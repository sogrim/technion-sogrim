//! Admin BI dashboard statistics.
//!
//! One MongoDB `$facet` aggregation over the `Users` collection produces every
//! metric the dashboard needs in a single round trip, projected server-side so we
//! never deserialize the heavy per-user `degree_status` into Rust. The result is
//! shaped into a single [`DashboardStats`] JSON object. Course ids in the academic
//! facets are enriched with human-readable names from the in-memory course cache
//! *after* aggregation (no `$lookup`). A short-TTL [`StatsCache`] memoizes the
//! result so rapid dashboard reloads don't re-scan the collection.
//!
//! ## Data-shape notes (must match the BSON, not the Rust enum names)
//! - `User._id` is the Google `sub` string; there is no email/PII.
//! - `last_seen` is an `Option<bson::DateTime>`; absent until first login.
//! - Faculty lives at `details.catalog.faculty` and is a *string* of the serde
//!   variant name (`"ComputerScience"`, `"Unknown"`, …); the whole `catalog`
//!   object is absent until onboarding, hence a `None`/`"Unknown"` bucket.
//! - `CourseState`/`Grade` serialize to Hebrew strings. Pass = numeric >= 55 OR
//!   `"עבר"` OR an exemption string; fail = `"נכשל"` OR numeric < 55.
//! - A course id is stored at `course_statuses[].course._id` (serde rename).

use std::collections::HashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};

use bson::doc;
use serde::{Deserialize, Serialize};
use tokio::sync::RwLock;

use crate::db::Db;
use crate::error::AppError;
use crate::resources::course::{Course, CourseId};

/// How long a computed snapshot is served before the pipeline re-runs.
pub const STATS_TTL: Duration = Duration::from_secs(5 * 60);

/// GPA histogram bucket edges (lower-inclusive, upper-exclusive except the last).
/// Buckets: [0,55), [55,65), [65,75), [75,85), [85,95), [95,100].
const GPA_BUCKETS: [(f64, f64); 6] = [
    (0.0, 55.0),
    (55.0, 65.0),
    (65.0, 75.0),
    (75.0, 85.0),
    (85.0, 95.0),
    (95.0, 100.1),
];

/// Number of top courses to surface in the "most-taken" panel.
const TOP_COURSES_N: i64 = 15;
/// Number of hardest courses to surface (after a minimum-takers floor).
const HARDEST_COURSES_N: usize = 15;
/// Minimum number of takers before a course is eligible for the hardest-courses
/// ranking, so a single failed one-off doesn't dominate.
const HARDEST_MIN_TAKERS: i64 = 5;

// ---------------------------------------------------------------------------
// Public output types — these field names are the frontend contract.
// ---------------------------------------------------------------------------

//
// NOTE: these structs serialize with serde's default (their fields are already
// snake_case), which is exactly the frontend `AdminStats` contract. Do NOT add
// `#[serde(rename_all = "camelCase")]` here — that would break the contract.

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct DashboardStats {
    pub overview: Overview,
    pub activity: Activity,
    pub population: Population,
    pub funnel: Funnel,
    pub academic: Academic,
    /// ISO-8601 (RFC 3339) timestamp of when this snapshot was computed.
    pub generated_at: String,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct Overview {
    pub total_users: i64,
    /// Distinct users seen within the last 1 / 7 / 30 days.
    pub dau: i64,
    pub wau: i64,
    pub mau: i64,
    /// DAU/MAU stickiness, a fraction in [0, 1]. 0.0 when MAU is 0.
    pub stickiness: f64,
    /// Count of users who completed onboarding (have a catalog).
    pub onboarded: i64,
    /// Count of users who imported a grade sheet (non-empty course_statuses).
    pub imported_grades: i64,
    /// Count of users with a computed degree status (non-empty bank requirements).
    pub computed_status: i64,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct Activity {
    /// `last_seen` within the last 7 days.
    pub active: i64,
    /// `last_seen` between 7 and 30 days ago.
    pub dormant: i64,
    /// `last_seen` older than 30 days, or never logged in.
    pub inactive: i64,
    /// Last-active proxy heatmap: 7 rows (Sun..Sat) x 24 cols (hour 0..23) in
    /// Israel local time (Asia/Jerusalem, DST-aware).
    /// Derived from one timestamp per user; a proxy, not per-action engagement.
    pub last_active_heatmap: Vec<Vec<i64>>,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct Population {
    /// Users by faculty. Always includes a `"Unknown"` bucket for users with no
    /// catalog (or a catalog whose faculty is `Unknown`).
    pub by_faculty: Vec<CountBucket>,
    /// Users by catalog/track name (the catalog `name`). `"None"` = no catalog.
    pub by_catalog: Vec<CountBucket>,
    /// Users by catalog year. Year `0`/absent rolls into a `"Unknown"` label.
    pub by_catalog_year: Vec<CountBucket>,
    /// Feature adoption counts as labeled buckets (Hebrew labels).
    pub adoption: Vec<CountBucket>,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct Funnel {
    /// All users (signed in at least once to exist in the collection).
    pub signed_in: i64,
    /// Picked a catalog.
    pub picked_catalog: i64,
    /// Imported a grade sheet (non-empty course_statuses).
    pub imported_grades: i64,
    /// Computed degree status (non-empty bank requirements).
    pub computed_status: i64,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct Academic {
    /// Course-statuses counted per academic semester, ordered chronologically.
    pub courses_per_semester: Vec<CountBucket>,
    /// Top-N most-taken courses, with enriched names.
    pub most_taken_courses: Vec<CourseStat>,
    /// One data point per student's weighted GPA, bucketed into a histogram.
    pub gpa_distribution: Vec<CountBucket>,
    /// Hardest courses by avg numeric grade / fail rate / repeats.
    pub hardest_courses: Vec<CourseStat>,
    /// Highest-average courses (min graded-takers floor applied).
    pub best_average_courses: Vec<CourseStat>,
    /// Lowest-average courses (min graded-takers floor applied).
    pub worst_average_courses: Vec<CourseStat>,
    /// Per requirement-bank completion rates.
    pub bank_completion: Vec<BankCompletionStat>,
}

/// A `{ label, value }` pair for categorical bar/pie series.
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct CountBucket {
    pub label: String,
    pub value: i64,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct CourseStat {
    pub course_id: String,
    /// Enriched from the course cache; falls back to the id when unknown.
    pub course_name: String,
    pub count: i64,
    /// Average numeric grade across graded attempts. Omitted when absent.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub average_grade: Option<f64>,
    /// Fail rate over graded attempts, a fraction in [0, 1]. Omitted when absent.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub fail_rate: Option<f64>,
    /// Total repeats recorded across all takers. Omitted when absent.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub times_repeated: Option<i64>,
}

#[derive(Clone, Debug, Default, Serialize, Deserialize)]
pub struct BankCompletionStat {
    pub bank_name: String,
    /// completed/total, a fraction in [0, 1].
    pub completion_rate: f64,
    /// How many of those have it completed.
    pub completed: i64,
    /// How many users have this bank in their computed status.
    pub total: i64,
}

// ---------------------------------------------------------------------------
// Raw aggregation result (one document out of the single `$facet`).
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
struct FacetResult {
    #[serde(default)]
    total: Vec<CountDoc>,
    #[serde(default)]
    dau: Vec<CountDoc>,
    #[serde(default)]
    wau: Vec<CountDoc>,
    #[serde(default)]
    mau: Vec<CountDoc>,
    #[serde(default)]
    onboarded: Vec<CountDoc>,
    #[serde(default)]
    imported: Vec<CountDoc>,
    #[serde(default)]
    computed: Vec<CountDoc>,
    #[serde(default)]
    recency: Vec<RecencyDoc>,
    #[serde(default)]
    heatmap: Vec<HeatmapDoc>,
    #[serde(default)]
    by_faculty: Vec<GroupCount>,
    #[serde(default)]
    by_catalog: Vec<GroupCount>,
    #[serde(default)]
    by_catalog_year: Vec<GroupCountNum>,
    #[serde(default)]
    feature_adoption: Vec<FeatureDoc>,
    #[serde(default)]
    courses_per_semester: Vec<SemesterDoc>,
    #[serde(default)]
    top_courses: Vec<CourseAggDoc>,
    #[serde(default)]
    gpa: Vec<GpaDoc>,
    #[serde(default)]
    hardest: Vec<HardestDoc>,
    #[serde(default)]
    bank_completion: Vec<BankDoc>,
}

#[derive(Debug, Deserialize)]
struct CountDoc {
    #[serde(default)]
    count: i64,
}

#[derive(Debug, Deserialize)]
struct RecencyDoc {
    #[serde(rename = "_id")]
    bucket: String,
    #[serde(default)]
    count: i64,
}

#[derive(Debug, Deserialize)]
struct HeatmapDoc {
    #[serde(rename = "_id")]
    key: HeatmapKey,
    #[serde(default)]
    count: i64,
}

#[derive(Debug, Deserialize)]
struct HeatmapKey {
    #[serde(default)]
    dow: i32,
    #[serde(default)]
    hour: i32,
}

#[derive(Debug, Deserialize)]
struct GroupCount {
    #[serde(rename = "_id")]
    label: Option<String>,
    #[serde(default)]
    count: i64,
}

#[derive(Debug, Deserialize)]
struct GroupCountNum {
    #[serde(rename = "_id")]
    label: Option<i64>,
    #[serde(default)]
    count: i64,
}

#[derive(Debug, Deserialize)]
struct FeatureDoc {
    #[serde(default)]
    dark_mode: i64,
    #[serde(default)]
    custom_palette: i64,
    #[serde(default)]
    timetable_drafts: i64,
}

#[derive(Debug, Deserialize)]
struct SemesterDoc {
    #[serde(rename = "_id")]
    key: SemesterKey,
    #[serde(default)]
    count: i64,
}

#[derive(Debug, Deserialize)]
struct SemesterKey {
    season: Option<String>,
    start_year: Option<i32>,
}

#[derive(Debug, Deserialize)]
struct CourseAggDoc {
    #[serde(rename = "_id")]
    course_id: Option<String>,
    #[serde(default)]
    count: i64,
    /// Course name embedded in the student record (via `$first`).
    #[serde(default)]
    name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct GpaDoc {
    #[serde(rename = "_id")]
    bucket: i32,
    #[serde(default)]
    count: i64,
}

#[derive(Debug, Deserialize)]
struct HardestDoc {
    #[serde(rename = "_id")]
    course_id: Option<String>,
    /// Course name embedded in the student record (via `$first`).
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    takers: i64,
    #[serde(default)]
    avg_grade: Option<f64>,
    #[serde(default)]
    fails: i64,
    #[serde(default)]
    graded: i64,
    #[serde(default)]
    total_repeats: i64,
}

#[derive(Debug, Deserialize)]
struct BankDoc {
    #[serde(rename = "_id")]
    bank_name: Option<String>,
    #[serde(default)]
    total: i64,
    #[serde(default)]
    completed: i64,
}

// ---------------------------------------------------------------------------
// Pipeline construction.
// ---------------------------------------------------------------------------

/// Builds the single `$facet` pipeline over `Users`. `now_ms` is the current time
/// in epoch milliseconds (injected so tests can pin a clock).
fn build_pipeline(now_ms: i64) -> Vec<bson::Document> {
    let day_ms: i64 = 24 * 60 * 60 * 1000;
    let one_day_ago = bson::DateTime::from_millis(now_ms - day_ms);
    let seven_days_ago = bson::DateTime::from_millis(now_ms - 7 * day_ms);
    let thirty_days_ago = bson::DateTime::from_millis(now_ms - 30 * day_ms);

    // A numeric-grade detector: a grade string that parses as a double. MongoDB's
    // `$convert` with `onError` returns the fallback when the string isn't numeric.
    // Reused inside the academic facets via `$let`.
    let numeric_grade = doc! {
        "$convert": { "input": "$$g", "to": "double", "onError": bson::Bson::Null, "onNull": bson::Bson::Null }
    };

    vec![doc! {
        "$facet": {
            // --- Overview counts -------------------------------------------------
            "total": [ { "$count": "count" } ],
            "dau": [
                { "$match": { "last_seen": { "$gte": one_day_ago } } },
                { "$count": "count" }
            ],
            "wau": [
                { "$match": { "last_seen": { "$gte": seven_days_ago } } },
                { "$count": "count" }
            ],
            "mau": [
                { "$match": { "last_seen": { "$gte": thirty_days_ago } } },
                { "$count": "count" }
            ],
            "onboarded": [
                { "$match": { "details.catalog": { "$ne": bson::Bson::Null } } },
                { "$count": "count" }
            ],
            "imported": [
                { "$match": { "details.degree_status.course_statuses.0": { "$exists": true } } },
                { "$count": "count" }
            ],
            "computed": [
                { "$match": { "details.degree_status.course_bank_requirements.0": { "$exists": true } } },
                { "$count": "count" }
            ],

            // --- Activity recency buckets ---------------------------------------
            "recency": [
                { "$project": {
                    "bucket": {
                        "$switch": {
                            "branches": [
                                { "case": { "$eq": [ { "$type": "$last_seen" }, "missing" ] }, "then": "never" },
                                { "case": { "$eq": [ "$last_seen", bson::Bson::Null ] }, "then": "never" },
                                { "case": { "$gte": [ "$last_seen", seven_days_ago ] }, "then": "active7d" },
                                { "case": { "$gte": [ "$last_seen", thirty_days_ago ] }, "then": "dormant7to30d" }
                            ],
                            "default": "inactive30d_plus"
                        }
                    }
                } },
                { "$group": { "_id": "$bucket", "count": { "$sum": 1 } } }
            ],

            // --- Last-seen day-of-week x hour heatmap (Israel local time) -------
            "heatmap": [
                // `$ne: null` in Mongo also excludes the missing field, so this
                // keeps only users that have actually logged in.
                { "$match": { "last_seen": { "$ne": bson::Bson::Null } } },
                { "$group": {
                    "_id": {
                        // Mongo $dayOfWeek: 1 (Sun) .. 7 (Sat) -> 0..6. Bucketed in
                        // Israel local time (Asia/Jerusalem, DST-aware) so "when"
                        // reflects the students' actual clock.
                        "dow": { "$subtract": [ { "$dayOfWeek": { "date": "$last_seen", "timezone": "Asia/Jerusalem" } }, 1 ] },
                        "hour": { "$hour": { "date": "$last_seen", "timezone": "Asia/Jerusalem" } }
                    },
                    "count": { "$sum": 1 }
                } }
            ],

            // --- Population: faculty / catalog / year ---------------------------
            "by_faculty": [
                { "$group": {
                    "_id": { "$ifNull": [ "$details.catalog.faculty", "Unknown" ] },
                    "count": { "$sum": 1 }
                } }
            ],
            "by_catalog": [
                { "$group": {
                    "_id": { "$ifNull": [ "$details.catalog.name", bson::Bson::Null ] },
                    "count": { "$sum": 1 }
                } }
            ],
            "by_catalog_year": [
                { "$group": {
                    "_id": "$details.catalog.year",
                    "count": { "$sum": 1 }
                } }
            ],

            // --- Feature adoption ------------------------------------------------
            "feature_adoption": [
                { "$group": {
                    "_id": bson::Bson::Null,
                    "dark_mode": { "$sum": { "$cond": [ { "$eq": [ "$settings.dark_mode", true ] }, 1, 0 ] } },
                    "custom_palette": { "$sum": { "$cond": [
                        { "$and": [
                            { "$ne": [ { "$type": "$settings.palette" }, "missing" ] },
                            { "$ne": [ "$settings.palette", bson::Bson::Null ] }
                        ] }, 1, 0 ] } },
                    "timetable_drafts": { "$sum": { "$cond": [
                        { "$gt": [ { "$size": { "$ifNull": [ "$timetable.drafts", [] ] } }, 0 ] }, 1, 0 ] } }
                } }
            ],

            // --- Academic: courses per semester ---------------------------------
            "courses_per_semester": [
                { "$unwind": "$details.degree_status.course_statuses" },
                { "$match": { "details.degree_status.course_statuses.semester": { "$ne": bson::Bson::Null } } },
                { "$group": {
                    "_id": {
                        "season": "$details.degree_status.course_statuses.semester.season",
                        "start_year": "$details.degree_status.course_statuses.semester.start_year"
                    },
                    "count": { "$sum": 1 }
                } }
            ],

            // --- Academic: most-taken courses -----------------------------------
            "top_courses": [
                { "$unwind": "$details.degree_status.course_statuses" },
                { "$group": {
                    "_id": "$details.degree_status.course_statuses.course._id",
                    "count": { "$sum": 1 },
                    "name": { "$first": "$details.degree_status.course_statuses.course.name" }
                } },
                { "$sort": { "count": -1 } },
                { "$limit": TOP_COURSES_N }
            ],

            // --- Academic: per-student weighted GPA -> histogram bucket ---------
            "gpa": [
                { "$unwind": "$details.degree_status.course_statuses" },
                { "$project": {
                    "_id": 1,
                    "credit": { "$ifNull": [ "$details.degree_status.course_statuses.course.credit", 0 ] },
                    "numeric": { "$let": {
                        "vars": { "g": "$details.degree_status.course_statuses.grade" },
                        "in": numeric_grade.clone()
                    } }
                } },
                // Keep only numeric, credit-bearing attempts for the weighted average.
                { "$match": { "numeric": { "$ne": bson::Bson::Null }, "credit": { "$gt": 0 } } },
                { "$group": {
                    "_id": "$_id",
                    "weighted": { "$sum": { "$multiply": [ "$numeric", "$credit" ] } },
                    "credits": { "$sum": "$credit" }
                } },
                { "$match": { "credits": { "$gt": 0 } } },
                { "$project": { "gpa": { "$divide": [ "$weighted", "$credits" ] } } },
                { "$bucket": {
                    "groupBy": "$gpa",
                    "boundaries": [ 0.0, 55.0, 65.0, 75.0, 85.0, 95.0, 101.0 ],
                    "default": -1,
                    "output": { "count": { "$sum": 1 } }
                } },
                // Re-map the bucket boundary lower-bound to a 0..5 index for stable output.
                { "$project": {
                    "_id": { "$switch": {
                        "branches": [
                            { "case": { "$eq": [ "$_id", 0.0 ] }, "then": 0 },
                            { "case": { "$eq": [ "$_id", 55.0 ] }, "then": 1 },
                            { "case": { "$eq": [ "$_id", 65.0 ] }, "then": 2 },
                            { "case": { "$eq": [ "$_id", 75.0 ] }, "then": 3 },
                            { "case": { "$eq": [ "$_id", 85.0 ] }, "then": 4 },
                            { "case": { "$eq": [ "$_id", 95.0 ] }, "then": 5 }
                        ],
                        "default": -1
                    } },
                    "count": 1
                } }
            ],

            // --- Academic: hardest courses --------------------------------------
            "hardest": [
                { "$unwind": "$details.degree_status.course_statuses" },
                { "$project": {
                    "course_id": "$details.degree_status.course_statuses.course._id",
                    "name": "$details.degree_status.course_statuses.course.name",
                    "repeats": { "$ifNull": [ "$details.degree_status.course_statuses.times_repeated", 0 ] },
                    "grade": "$details.degree_status.course_statuses.grade",
                    "numeric": { "$let": {
                        "vars": { "g": "$details.degree_status.course_statuses.grade" },
                        "in": numeric_grade.clone()
                    } }
                } },
                { "$project": {
                    "course_id": 1,
                    "name": 1,
                    "repeats": 1,
                    "numeric": 1,
                    // graded = has a numeric grade OR an explicit pass/fail binary.
                    "is_graded": { "$or": [
                        { "$ne": [ "$numeric", bson::Bson::Null ] },
                        { "$in": [ "$grade", [ "עבר", "נכשל" ] ] }
                    ] },
                    "is_fail": { "$or": [
                        { "$eq": [ "$grade", "נכשל" ] },
                        { "$and": [ { "$ne": [ "$numeric", bson::Bson::Null ] }, { "$lt": [ "$numeric", 55 ] } ] }
                    ] }
                } },
                { "$group": {
                    "_id": "$course_id",
                    "name": { "$first": "$name" },
                    "takers": { "$sum": 1 },
                    "graded": { "$sum": { "$cond": [ "$is_graded", 1, 0 ] } },
                    "fails": { "$sum": { "$cond": [ "$is_fail", 1, 0 ] } },
                    "avg_grade": { "$avg": "$numeric" },
                    "total_repeats": { "$sum": "$repeats" }
                } },
                { "$match": { "graded": { "$gte": HARDEST_MIN_TAKERS } } }
            ],

            // --- Academic: requirement-bank completion --------------------------
            "bank_completion": [
                { "$unwind": "$details.degree_status.course_bank_requirements" },
                { "$group": {
                    "_id": "$details.degree_status.course_bank_requirements.course_bank_name",
                    "total": { "$sum": 1 },
                    "completed": { "$sum": { "$cond": [
                        { "$eq": [ "$details.degree_status.course_bank_requirements.completed", true ] }, 1, 0 ] } }
                } }
            ]
        }
    }]
}

// ---------------------------------------------------------------------------
// Compute: run pipeline + enrich.
// ---------------------------------------------------------------------------

impl DashboardStats {
    /// Run the aggregation against `Users` and shape the result, enriching course
    /// ids with names from the supplied course map (taken from the in-memory cache).
    pub async fn compute(
        db: &Db,
        courses: &HashMap<CourseId, Course>,
    ) -> Result<Self, AppError> {
        let now_ms = bson::DateTime::now().timestamp_millis();
        let pipeline = build_pipeline(now_ms);
        let mut results: Vec<FacetResult> = db.aggregate("Users", pipeline).await?;
        let facet = results.pop().unwrap_or(FacetResult {
            total: vec![],
            dau: vec![],
            wau: vec![],
            mau: vec![],
            onboarded: vec![],
            imported: vec![],
            computed: vec![],
            recency: vec![],
            heatmap: vec![],
            by_faculty: vec![],
            by_catalog: vec![],
            by_catalog_year: vec![],
            feature_adoption: vec![],
            courses_per_semester: vec![],
            top_courses: vec![],
            gpa: vec![],
            hardest: vec![],
            bank_completion: vec![],
        });
        Ok(Self::from_facet(facet, courses))
    }

    fn from_facet(f: FacetResult, courses: &HashMap<CourseId, Course>) -> Self {
        let count_of = |v: &[CountDoc]| v.first().map(|c| c.count).unwrap_or(0);

        let total_users = count_of(&f.total);
        let dau = count_of(&f.dau);
        let wau = count_of(&f.wau);
        let mau = count_of(&f.mau);
        let onboarded = count_of(&f.onboarded);
        let imported = count_of(&f.imported);
        let computed_n = count_of(&f.computed);

        let overview = Overview {
            total_users,
            dau,
            wau,
            mau,
            stickiness: if mau == 0 {
                0.0
            } else {
                (dau as f64) / (mau as f64)
            },
            onboarded,
            imported_grades: imported,
            computed_status: computed_n,
        };

        // Recency buckets. The frontend collapses these into 3:
        //   active = active7d; dormant = dormant7to30d; inactive = inactive30d_plus + never.
        let mut active7d = 0;
        let mut dormant7to30d = 0;
        let mut inactive30d_plus = 0;
        let mut never = 0;
        for r in &f.recency {
            match r.bucket.as_str() {
                "active7d" => active7d = r.count,
                "dormant7to30d" => dormant7to30d = r.count,
                "inactive30d_plus" => inactive30d_plus = r.count,
                "never" => never = r.count,
                _ => {}
            }
        }
        // 7 rows (Sun..Sat) x 24 cols.
        let mut last_active_heatmap = vec![vec![0i64; 24]; 7];
        for h in &f.heatmap {
            let dow = h.key.dow.clamp(0, 6) as usize;
            let hour = h.key.hour.clamp(0, 23) as usize;
            last_active_heatmap[dow][hour] += h.count;
        }
        let activity = Activity {
            active: active7d,
            dormant: dormant7to30d,
            inactive: inactive30d_plus + never,
            last_active_heatmap,
        };

        // Population.
        let by_faculty = labeled_from_group(f.by_faculty, "Unknown");
        let by_catalog = labeled_from_group(f.by_catalog, "None");
        let mut by_catalog_year: Vec<CountBucket> = f
            .by_catalog_year
            .into_iter()
            .map(|g| CountBucket {
                label: match g.label {
                    Some(y) if y > 0 => y.to_string(),
                    _ => "Unknown".to_string(),
                },
                value: g.count,
            })
            .collect();
        // Merge duplicate "Unknown" year labels (absent + year 0 both map there).
        by_catalog_year = merge_labels(by_catalog_year);
        by_catalog_year.sort_by(|a, b| b.value.cmp(&a.value));

        let feature = f.feature_adoption.into_iter().next();
        let dark_mode = feature.as_ref().map(|x| x.dark_mode).unwrap_or(0);
        let custom_palette = feature.as_ref().map(|x| x.custom_palette).unwrap_or(0);
        let timetable_drafts = feature.as_ref().map(|x| x.timetable_drafts).unwrap_or(0);
        let adoption = vec![
            CountBucket {
                label: "מצב כהה".to_string(),
                value: dark_mode,
            },
            CountBucket {
                label: "פלטה מותאמת".to_string(),
                value: custom_palette,
            },
            CountBucket {
                label: "מערכת שעות".to_string(),
                value: timetable_drafts,
            },
        ];

        let population = Population {
            by_faculty,
            by_catalog,
            by_catalog_year,
            adoption,
        };

        let funnel = Funnel {
            signed_in: total_users,
            picked_catalog: onboarded,
            imported_grades: imported,
            computed_status: computed_n,
        };

        // Academic: courses per semester, sorted by order_key, emitted as labeled
        // buckets with a Hebrew "<season> <start_year>" label.
        let mut per_semester: Vec<(i32, CountBucket)> = f
            .courses_per_semester
            .into_iter()
            .filter_map(|s| {
                let season = s.key.season?;
                let start_year = s.key.start_year?;
                let order_key = start_year * 3 + season_order(&season);
                let label = format!("{} {}", season_label(&season), start_year);
                Some((order_key, CountBucket { label, value: s.count }))
            })
            .collect();
        per_semester.sort_by_key(|(k, _)| *k);
        let courses_per_semester: Vec<CountBucket> =
            per_semester.into_iter().map(|(_, b)| b).collect();

        // Prefer the course name embedded in the student's record (present for any
        // course a student has taken), then the in-memory course cache, then the id.
        let resolve = |doc_name: Option<&str>, id: &str| -> String {
            match doc_name.map(str::trim).filter(|s| !s.is_empty()) {
                Some(n) => n.to_string(),
                None => courses
                    .get(id)
                    .map(|c| c.name.clone())
                    .unwrap_or_else(|| id.to_string()),
            }
        };

        let most_taken_courses: Vec<CourseStat> = f
            .top_courses
            .into_iter()
            .filter_map(|c| {
                let course_id = c.course_id?;
                Some(CourseStat {
                    course_name: resolve(c.name.as_deref(), &course_id),
                    course_id,
                    count: c.count,
                    average_grade: None,
                    fail_rate: None,
                    times_repeated: None,
                })
            })
            .collect();

        // GPA distribution: map bucket index -> label; ensure all buckets present,
        // in ascending order.
        let mut gpa_counts = [0i64; GPA_BUCKETS.len()];
        for g in &f.gpa {
            if g.bucket >= 0 && (g.bucket as usize) < GPA_BUCKETS.len() {
                gpa_counts[g.bucket as usize] += g.count;
            }
        }
        let gpa_distribution: Vec<CountBucket> = (0..GPA_BUCKETS.len())
            .map(|i| CountBucket {
                label: gpa_label(i),
                value: gpa_counts[i],
            })
            .collect();

        // All courses with >= HARDEST_MIN_TAKERS graded takers, as CourseStat. The
        // hardest / best-average / worst-average rankings are all derived from this
        // same set (so a one-off outlier can't dominate any of them).
        let graded: Vec<CourseStat> = f
            .hardest
            .into_iter()
            .filter_map(|h| {
                let course_id = h.course_id?;
                let fail_rate = if h.graded == 0 {
                    0.0
                } else {
                    (h.fails as f64) / (h.graded as f64)
                };
                Some(CourseStat {
                    course_name: resolve(h.name.as_deref(), &course_id),
                    course_id,
                    count: h.takers,
                    average_grade: h.avg_grade,
                    fail_rate: Some(fail_rate),
                    times_repeated: Some(h.total_repeats),
                })
            })
            .collect();

        // Hardest: by fail rate desc, then avg grade asc, then repeats desc.
        let mut hardest_courses = graded.clone();
        hardest_courses.sort_by(|a, b| {
            b.fail_rate
                .unwrap_or(0.0)
                .partial_cmp(&a.fail_rate.unwrap_or(0.0))
                .unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| {
                    a.average_grade
                        .unwrap_or(f64::MAX)
                        .partial_cmp(&b.average_grade.unwrap_or(f64::MAX))
                        .unwrap_or(std::cmp::Ordering::Equal)
                })
                .then_with(|| {
                    b.times_repeated
                        .unwrap_or(0)
                        .cmp(&a.times_repeated.unwrap_or(0))
                })
        });
        hardest_courses.truncate(HARDEST_COURSES_N);

        // Best / worst by average grade (only courses that have a numeric average).
        let mut by_avg: Vec<CourseStat> =
            graded.into_iter().filter(|c| c.average_grade.is_some()).collect();
        by_avg.sort_by(|a, b| {
            b.average_grade
                .unwrap_or(f64::MIN)
                .partial_cmp(&a.average_grade.unwrap_or(f64::MIN))
                .unwrap_or(std::cmp::Ordering::Equal)
        }); // highest average first
        let best_average_courses: Vec<CourseStat> =
            by_avg.iter().take(HARDEST_COURSES_N).cloned().collect();
        let worst_average_courses: Vec<CourseStat> =
            by_avg.iter().rev().take(HARDEST_COURSES_N).cloned().collect();

        let mut bank_completion: Vec<BankCompletionStat> = f
            .bank_completion
            .into_iter()
            .filter_map(|b| {
                let bank_name = b.bank_name?;
                let completion_rate = if b.total == 0 {
                    0.0
                } else {
                    (b.completed as f64) / (b.total as f64)
                };
                Some(BankCompletionStat {
                    bank_name,
                    completion_rate,
                    completed: b.completed,
                    total: b.total,
                })
            })
            .collect();
        bank_completion.sort_by(|a, b| {
            a.completion_rate
                .partial_cmp(&b.completion_rate)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        let academic = Academic {
            courses_per_semester,
            most_taken_courses,
            gpa_distribution,
            hardest_courses,
            best_average_courses,
            worst_average_courses,
            bank_completion,
        };

        DashboardStats {
            overview,
            activity,
            population,
            funnel,
            academic,
            generated_at: chrono::Utc::now().to_rfc3339(),
        }
    }
}

/// Maps a serialized `SemesterSeason` string to its Hebrew display label.
fn season_label(season: &str) -> &'static str {
    match season {
        "winter" => "חורף",
        "spring" => "אביב",
        "summer" => "קיץ",
        _ => "חורף",
    }
}

/// Maps a serialized `SemesterSeason` string to its `order` (winter/spring/summer = 0/1/2).
fn season_order(season: &str) -> i32 {
    match season {
        "winter" => 0,
        "spring" => 1,
        "summer" => 2,
        _ => 0,
    }
}

fn gpa_label(i: usize) -> String {
    match i {
        0 => "0-54".to_string(),
        1 => "55-64".to_string(),
        2 => "65-74".to_string(),
        3 => "75-84".to_string(),
        4 => "85-94".to_string(),
        _ => "95-100".to_string(),
    }
}

fn labeled_from_group(groups: Vec<GroupCount>, null_label: &str) -> Vec<CountBucket> {
    let mut out: Vec<CountBucket> = groups
        .into_iter()
        .map(|g| CountBucket {
            label: g.label.unwrap_or_else(|| null_label.to_string()),
            value: g.count,
        })
        .collect();
    out = merge_labels(out);
    out.sort_by(|a, b| b.value.cmp(&a.value));
    out
}

/// Collapses duplicate labels by summing their values (preserving first-seen order).
fn merge_labels(items: Vec<CountBucket>) -> Vec<CountBucket> {
    let mut order: Vec<String> = Vec::new();
    let mut map: HashMap<String, i64> = HashMap::new();
    for item in items {
        if !map.contains_key(&item.label) {
            order.push(item.label.clone());
        }
        *map.entry(item.label).or_insert(0) += item.value;
    }
    order
        .into_iter()
        .map(|label| {
            let value = map[&label];
            CountBucket { label, value }
        })
        .collect()
}

// ---------------------------------------------------------------------------
// TTL cache.
// ---------------------------------------------------------------------------

/// In-memory, short-TTL cache for the computed dashboard stats. Cheap to clone
/// (`Arc` inside), so it can live as an axum `Extension`.
#[derive(Clone, Default)]
pub struct StatsCache(Arc<RwLock<Option<(Instant, DashboardStats)>>>);

impl StatsCache {
    /// Returns a cached snapshot when one exists and is younger than `ttl`,
    /// otherwise recomputes via the aggregation and stores it.
    pub async fn get_or_compute(
        &self,
        db: &Db,
        courses: &HashMap<CourseId, Course>,
        ttl: Duration,
    ) -> Result<DashboardStats, AppError> {
        // Fast path: a fresh value already cached.
        if let Some((at, stats)) = self.0.read().await.as_ref() {
            if at.elapsed() < ttl {
                return Ok(stats.clone());
            }
        }
        // Slow path: compute and store. A concurrent caller may also compute; the
        // last writer wins, which is fine for an idempotent read-only snapshot.
        let stats = DashboardStats::compute(db, courses).await?;
        *self.0.write().await = Some((Instant::now(), stats.clone()));
        Ok(stats)
    }
}

#[cfg(test)]
mod tests;
