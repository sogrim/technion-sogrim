//! Client for Technion's SAP PortalEx OData API with in-memory caching.

use std::collections::{HashMap, HashSet};
use std::fmt;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::time::Duration;

use tokio::sync::Semaphore;
use tokio::time::sleep;

use chrono::Datelike;
use moka::future::Cache;
use regex::Regex;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::resources::course::CourseId;

const SAP_BASE_URL: &str =
    "https://portalex.technion.ac.il/sap/opu/odata/sap/Z_CM_EV_CDIR_DATA_SRV";
const BATCH_BOUNDARY: &str = "batch_1d12-afbf-e3c7";
const CACHE_TTL_HOURS: u64 = 24;
const BATCH_SIZE: usize = 30;
const PREWARM_CONCURRENCY: usize = 16;
const MAX_RETRIES: u32 = 4;
const INITIAL_BACKOFF_MS: u64 = 500;

/// Groups to filter out from the schedule.
const FILTERED_GROUPS: &[&str] = &["077", "069", "086"];

/// Check if a course is a sport course (03940800-03940999).
fn is_sport_course(course_id: &str) -> bool {
    course_id.starts_with("03940")
        && course_id.len() == 8
        && matches!(course_id.as_bytes().get(5), Some(b'8' | b'9'))
}

const HUMANITIES_FACULTY: &str = "המחלקה ללימודים הומניסטיים ואמנות";

/// Non-humanities courses that are explicitly malags.
const MALAG_EXPLICIT_IDS: &[&str] = &["02140119", "02140120", "02750112"];

/// Name patterns for language courses (not malag).
const LANGUAGE_KEYWORDS: &[&str] = &[
    "אנגלית",
    "עברית",
    "סינית",
    "יפנית",
    "צרפתית",
    "גרמנית",
    "רוסית",
    "ערבית",
    "ספרדית",
    "איטלקית",
    "שיחה ב",
];

/// Name patterns for art/performance/studio courses (not malag).
const ART_KEYWORDS: &[&str] = &[
    "רישום",
    "ציור",
    "תזמורת",
    "כוריאוגרפיה",
    "סדנת צילום",
    "מחזה-הצגה",
    "סטודיו אומן",
    "עיצוב גרפי",
];

/// Classify whether a course is a malag (enrichment) course.
/// Humanities department + 2 credits = malag, unless it's a language,
/// art/performance, or academic writing course.
fn classify_malag(id: &str, name: &str, credits: f32, faculty: Option<&str>) -> bool {
    if MALAG_EXPLICIT_IDS.contains(&id) {
        return true;
    }

    if faculty != Some(HUMANITIES_FACULTY) || credits != 2.0 {
        return false;
    }

    if LANGUAGE_KEYWORDS.iter().any(|kw| name.contains(kw)) {
        return false;
    }

    if ART_KEYWORDS.iter().any(|kw| name.contains(kw)) {
        return false;
    }

    if name.contains("כתיבה אקדמית") {
        return false;
    }

    true
}

// ---------------------------------------------------------------------------
// Error
// ---------------------------------------------------------------------------

#[derive(Debug)]
pub enum SapError {
    Http(reqwest::Error),
    BadStatus(u16),
    BadResponse(String),
    Json(serde_json::Error),
    NotFound(String),
}

impl fmt::Display for SapError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Http(e) => write!(f, "HTTP error: {e}"),
            Self::BadStatus(s) => write!(f, "expected HTTP 202, got {s}"),
            Self::BadResponse(msg) => write!(f, "bad batch response: {msg}"),
            Self::Json(e) => write!(f, "JSON parse error: {e}"),
            Self::NotFound(id) => write!(f, "not found: {id}"),
        }
    }
}

impl std::error::Error for SapError {}
impl From<reqwest::Error> for SapError {
    fn from(e: reqwest::Error) -> Self {
        Self::Http(e)
    }
}
impl From<serde_json::Error> for SapError {
    fn from(e: serde_json::Error) -> Self {
        Self::Json(e)
    }
}

// ---------------------------------------------------------------------------
// OData response wrapper
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct ODataResponse {
    d: ODataResults,
}

#[derive(Deserialize)]
struct ODataResults {
    results: Vec<Value>,
}

// ---------------------------------------------------------------------------
// Public types (all Serialize for JSON API responses)
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Semester {
    pub year: String,
    pub semester: String,
    pub begin_date: String,
    pub end_date: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseDetails {
    pub id: CourseId,
    pub name: String,
    pub credits: f32,
    pub faculty: Option<String>,
    pub syllabus: Option<String>,
    pub academic_level: Option<String>,
    /// True if the course is taught in English.
    pub is_english: bool,
    /// True if this course qualifies as a malag (enrichment) course.
    pub is_malag: bool,
    /// True if this is a sport course (03940800-03940999).
    pub is_sport: bool,
    pub semester_note: Option<String>,
    pub exams: Vec<Exam>,
    pub relations: Vec<Relation>,
    pub prerequisites: Vec<PrereqToken>,
    pub corequisites: Vec<CourseId>,
    pub responsible: Vec<Person>,
    pub offered_periods: Vec<OfferedPeriod>,
    pub schedule: Vec<ScheduleGroup>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub struct Exam {
    pub category: String,
    pub category_code: String,
    pub date: Option<String>,
    pub begin_time: Option<String>,
    pub end_time: Option<String>,
    /// Exam-specific note (e.g. special seating, group restrictions).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relation {
    pub course_id: CourseId,
    #[serde(rename = "type")]
    pub relation_type: RelationType,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum RelationType {
    NoAdditionalCredit,
    Contains,
    ContainedIn,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrereqToken {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub module_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operator: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bracket: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Person {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OfferedPeriod {
    pub year: String,
    pub semester: String,
    pub semester_name: String,
    pub year_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduleGroup {
    pub group: String,
    /// Group-level name from SAP (e.g. "נבחרת טניס נשים" for sport courses).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
    pub events: Vec<ScheduleEvent>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ScheduleEvent {
    /// e.g. "הרצאה", "תרגול", "מעבדה", or sport-specific name like "נבחרת טניס נשים"
    pub kind: String,
    /// Day of week: 0=Sunday, 1=Monday, ..., 5=Friday
    #[serde(skip_serializing_if = "Option::is_none")]
    pub day: Option<u8>,
    /// "HH:MM"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub start_time: Option<String>,
    /// "HH:MM"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub end_time: Option<String>,
    /// Human-readable schedule text, e.g. "יום רביעי 14:30-16:30"
    pub schedule_text: String,
    /// Hebrew building name, e.g. "טאוב"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub building: Option<String>,
    /// Room number, e.g. "305"
    #[serde(skip_serializing_if = "Option::is_none")]
    pub room: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub lecturer: Option<String>,
}

// ---------------------------------------------------------------------------
// Raw deserialization types (internal)
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawCourse {
    otjid: String,
    points: String,
    name: String,
    study_content_description: Option<String>,
    org_text: Option<String>,
    zz_academic_level_text: Option<String>,
    zz_sm_language: Option<String>,
    zz_semester_note: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawExam {
    category: String,
    category_code: String,
    exam_date: Option<String>,
    exam_beg_time: Option<String>,
    exam_end_time: Option<String>,
    /// Exam-level note/comment from SAP.
    zz_se_comment: Option<String>,
    /// GUID for parent/child exam hierarchy.
    zz_exam_offer_guid: Option<String>,
    /// Parent GUID — non-empty means this is a sub-exam (e.g. time slot under a date).
    zz_exam_offer_parent_guid: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawRelation {
    otjid: String,
    zz_relationship_key: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawPrereqToken {
    module_id: Option<String>,
    operator: Option<String>,
    bracket: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawResponsible {
    first_name: String,
    last_name: String,
    title: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawOfferedPeriod {
    peryr: String,
    perid: String,
    perit: String,
    peryt: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawEObject {
    otjid: String,
    category_text: String,
    /// Event-level name (e.g. "נבחרת טניס נשים" for sport courses).
    name: Option<String>,
    schedule_summary: Option<String>,
    room_text: Option<String>,
    /// Room OData ID for building lookup via GObjectSet.
    room_id: Option<String>,
    #[serde(default)]
    persons: RawPersons,
}

/// EObjectSet item from the "times" query (expands Schedule instead of Persons).
#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawEObjectTimes {
    otjid: String,
    #[serde(default)]
    schedule: RawScheduleEntries,
}

#[derive(Default, Deserialize)]
struct RawScheduleEntries {
    results: Vec<RawScheduleEntry>,
}

/// Individual session from EventScheduleSet — has structured day/time.
#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawScheduleEntry {
    evdat: Option<String>,
    beguz: Option<String>,
    enduz: Option<String>,
}

#[derive(Default, Deserialize)]
struct RawPersons {
    results: Vec<RawPerson>,
}

#[derive(Deserialize)]
#[serde(rename_all = "PascalCase")]
struct RawPerson {
    first_name: String,
    last_name: String,
    title: Option<String>,
}

// ---------------------------------------------------------------------------
// Cached client
// ---------------------------------------------------------------------------

/// Lightweight course entry for the search index.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CourseIndexEntry {
    pub id: CourseId,
    pub name: String,
    pub faculty: Option<String>,
    pub credits: f32,
}

/// Fetch progress, exposed via healthcheck.
#[derive(Debug, Clone, Serialize)]
pub struct FetchStats {
    pub total_courses: usize,
    pub warmed_courses: usize,
    pub percent: f32,
    pub cache_bytes: usize,
}

/// SAP client with in-memory caching at every level.
pub struct CachedSapClient {
    http: Client,
    proxy_url: Option<String>,
    courses: Cache<String, Arc<CourseDetails>>,
    semesters: Cache<String, Arc<Vec<Semester>>>,
    course_ids: Cache<String, Arc<Vec<CourseId>>>,
    course_index: Cache<String, Arc<Vec<CourseIndexEntry>>>,
    /// Cached building names resolved via GObjectSet. Key: room OData ID.
    buildings: Cache<String, Option<String>>,
    fetch_total: AtomicUsize,
    fetch_done: AtomicUsize,
    /// Total bytes sent to SAP (request bodies)
    bytes_sent: AtomicUsize,
    /// Total bytes received from SAP (response bodies)
    bytes_received: AtomicUsize,
}

impl Default for CachedSapClient {
    fn default() -> Self {
        Self::new()
    }
}

impl CachedSapClient {
    pub fn new() -> Self {
        Self::with_proxy_url(None)
    }

    pub fn with_proxy_url(proxy_url: Option<String>) -> Self {
        let ttl = Duration::from_secs(CACHE_TTL_HOURS * 3600);
        Self {
            http: Client::builder()
                .timeout(Duration::from_secs(60))
                .build()
                .expect("failed to build HTTP client"),
            proxy_url,
            courses: Cache::builder()
                .time_to_live(ttl)
                .max_capacity(5000)
                .build(),
            semesters: Cache::builder().time_to_live(ttl).max_capacity(1).build(),
            course_ids: Cache::builder().time_to_live(ttl).max_capacity(20).build(),
            course_index: Cache::builder().time_to_live(ttl).max_capacity(20).build(),
            buildings: Cache::builder().time_to_live(ttl).max_capacity(500).build(),
            fetch_total: AtomicUsize::new(0),
            fetch_done: AtomicUsize::new(0),
            bytes_sent: AtomicUsize::new(0),
            bytes_received: AtomicUsize::new(0),
        }
    }

    /// (total, done) course counts from the current prewarm operation.
    pub fn fetch_progress_counts(&self) -> (usize, usize) {
        (
            self.fetch_total.load(Ordering::Relaxed),
            self.fetch_done.load(Ordering::Relaxed),
        )
    }

    /// Total bytes transferred to/from SAP.
    pub fn transfer_stats(&self) -> (usize, usize) {
        (
            self.bytes_sent.load(Ordering::Relaxed),
            self.bytes_received.load(Ordering::Relaxed),
        )
    }

    pub fn fetch_stats(&self) -> FetchStats {
        let total = self.fetch_total.load(Ordering::Relaxed);
        let done = self.fetch_done.load(Ordering::Relaxed);
        let percent = if total == 0 {
            0.0
        } else {
            (done as f32 / total as f32) * 100.0
        };
        FetchStats {
            total_courses: total,
            warmed_courses: done,
            percent,
            cache_bytes: self.compute_cache_bytes(),
        }
    }

    /// Return a lightweight index of ALL courses for a semester (cached 24h).
    pub async fn get_course_index(
        &self,
        year: &str,
        semester: &str,
    ) -> Result<Arc<Vec<CourseIndexEntry>>, SapError> {
        let key = format!("{year}/{semester}");
        if let Some(cached) = self.course_index.get(&key).await {
            return Ok(cached);
        }
        let result = Arc::new(self.fetch_course_index(year, semester).await?);
        self.course_index.insert(key, result.clone()).await;
        Ok(result)
    }

    async fn fetch_course_index(
        &self,
        year: &str,
        semester: &str,
    ) -> Result<Vec<CourseIndexEntry>, SapError> {
        let query = format!(
            "SmObjectSet?sap-client=700&$skip=0&$top=10000\
             &$filter=Peryr%20eq%20%27{year}%27%20and%20Perid%20eq%20%27{semester}%27\
             &$select=Otjid,Name,Points,OrgText"
        );
        let value = self.batch_get(&query).await?;
        let results = Self::extract_results(value)?;
        Ok(results
            .into_iter()
            .filter_map(|v| {
                let sap_id = v.get("Otjid")?.as_str()?;
                let name = v.get("Name")?.as_str().unwrap_or("").trim().to_string();
                let credits = v
                    .get("Points")?
                    .as_str()
                    .unwrap_or("0")
                    .trim()
                    .parse::<f32>()
                    .unwrap_or(0.0);
                let faculty = v
                    .get("OrgText")
                    .and_then(|f| f.as_str())
                    .map(|s| s.to_string())
                    .filter(|s| !s.is_empty());
                Some(CourseIndexEntry {
                    id: sap_id_to_course_number(sap_id),
                    name,
                    faculty,
                    credits,
                })
            })
            .collect())
    }

    fn compute_cache_bytes(&self) -> usize {
        self.courses
            .iter()
            .filter_map(|(_, v)| serde_json::to_string(&*v).ok())
            .map(|s| s.len())
            .sum()
    }

    /// Phase 1: fetch semesters + course IDs for the current semester.
    /// Call this before the server starts accepting requests.
    pub async fn fetch_essential(&self) -> Result<(), SapError> {
        let semesters = self.get_semesters().await?;
        if let Some(current) = semesters.first() {
            let ids = self
                .get_course_ids(&current.year, &current.semester)
                .await?;
            self.fetch_total.store(ids.len(), Ordering::Relaxed);
            log::info!(
                target: "sogrim_server",
                "Fetched semesters + {} course IDs for {}/{}",
                ids.len(),
                current.year,
                current.semester
            );
        }
        Ok(())
    }

    /// Phase 2: background prewarm using multi-GET batching.
    /// Packs ~30 course detail queries into a single HTTP request,
    /// then ~30 schedule queries into another. ~40 HTTP requests total
    /// instead of ~2400.
    pub async fn fetch_all_courses(self: &Arc<Self>) {
        let semesters = match self.get_semesters().await {
            Ok(s) => s,
            Err(e) => {
                log::error!(target: "sogrim_server", "Fetch: failed to get semesters: {e}");
                return;
            }
        };
        let Some(current) = semesters.first() else {
            return;
        };
        let ids = match self.get_course_ids(&current.year, &current.semester).await {
            Ok(ids) => ids,
            Err(e) => {
                log::error!(target: "sogrim_server", "Fetch: failed to get course IDs: {e}");
                return;
            }
        };

        let year = &current.year;
        let semester = &current.semester;

        let semaphore = Arc::new(Semaphore::new(PREWARM_CONCURRENCY));
        let chunks: Vec<Vec<CourseId>> = ids.chunks(BATCH_SIZE).map(|c| c.to_vec()).collect();

        let handles: Vec<_> = chunks
            .into_iter()
            .map(|chunk| {
                let client = Arc::clone(self);
                let sem = Arc::clone(&semaphore);
                let year = year.clone();
                let semester = semester.clone();
                tokio::spawn(async move {
                    let _permit = sem.acquire().await.unwrap();

                    let sap_ids: Vec<String> =
                        chunk.iter().map(|id| course_number_to_sap_id(id)).collect();

                    let detail_queries: Vec<String> = sap_ids
                        .iter()
                        .map(|sap_id| Self::detail_query(&year, &semester, sap_id))
                        .collect();
                    let sched_persons_queries: Vec<String> = sap_ids
                        .iter()
                        .map(|sap_id| Self::schedule_query_persons(&year, &semester, sap_id))
                        .collect();
                    let sched_times_queries: Vec<String> = sap_ids
                        .iter()
                        .map(|sap_id| Self::schedule_query_times(&year, &semester, sap_id))
                        .collect();

                    // Retry with exponential backoff
                    let mut backoff = Duration::from_millis(INITIAL_BACKOFF_MS);
                    let mut results = None;
                    for attempt in 0..=MAX_RETRIES {
                        match tokio::try_join!(
                            client.batch_get_multi(&detail_queries),
                            client.batch_get_multi(&sched_persons_queries),
                            client.batch_get_multi(&sched_times_queries),
                        ) {
                            Ok(r) => {
                                results = Some(r);
                                break;
                            }
                            Err(e) => {
                                if attempt == MAX_RETRIES {
                                    log::warn!(target: "sogrim_server",
                                        "Fetch: batch failed after {MAX_RETRIES} retries: {e}"
                                    );
                                } else {
                                    sleep(backoff).await;
                                    backoff *= 2;
                                }
                            }
                        }
                    }

                    let Some((detail_results, sched_persons_results, sched_times_results)) =
                        results
                    else {
                        return;
                    };

                    for (i, course_number) in chunk.iter().enumerate() {
                        match client
                            .assemble_course(
                                &detail_results[i],
                                &sched_persons_results[i],
                                &sched_times_results[i],
                                &year,
                                &semester,
                            )
                            .await
                        {
                            Ok(details) => {
                                let key = format!("{year}/{semester}/{course_number}");
                                client.courses.insert(key, Arc::new(details)).await;
                                client.fetch_done.fetch_add(1, Ordering::Relaxed);
                            }
                            Err(e) => {
                                log::warn!(target: "sogrim_server",
                                    "Fetch: failed to parse {course_number}: {e}"
                                );
                            }
                        }
                    }
                })
            })
            .collect();

        for handle in handles {
            let _ = handle.await;
        }
        log::info!(target: "sogrim_server", "Fetch complete: all courses cached");
    }

    /// Batch-fetch all courses for a specific year/semester into the cache.
    /// Unlike `fetch_all_courses` (which always targets the first/current semester),
    /// this method fetches the exact semester requested. Used by the fetcher CLI.
    pub async fn fetch_semester(self: &Arc<Self>, year: &str, semester: &str) {
        self.fetch_semester_with_concurrency(year, semester, PREWARM_CONCURRENCY)
            .await;
    }

    pub async fn fetch_semester_with_concurrency(
        self: &Arc<Self>,
        year: &str,
        semester: &str,
        concurrency: usize,
    ) {
        let ids = match self.get_course_ids(year, semester).await {
            Ok(ids) => ids,
            Err(e) => {
                log::error!(target: "sogrim_server", "fetch_semester: failed to get course IDs: {e}");
                return;
            }
        };

        self.fetch_total.fetch_add(ids.len(), Ordering::Relaxed);

        let semaphore = Arc::new(Semaphore::new(concurrency));
        let chunks: Vec<Vec<CourseId>> = ids.chunks(BATCH_SIZE).map(|c| c.to_vec()).collect();

        let handles: Vec<_> = chunks
            .into_iter()
            .map(|chunk| {
                let client = Arc::clone(self);
                let sem = Arc::clone(&semaphore);
                let year = year.to_string();
                let semester = semester.to_string();
                tokio::spawn(async move {
                    let _permit = sem.acquire().await.unwrap();

                    let sap_ids: Vec<String> =
                        chunk.iter().map(|id| course_number_to_sap_id(id)).collect();

                    let detail_queries: Vec<String> = sap_ids
                        .iter()
                        .map(|sap_id| Self::detail_query(&year, &semester, sap_id))
                        .collect();
                    let sched_persons_queries: Vec<String> = sap_ids
                        .iter()
                        .map(|sap_id| Self::schedule_query_persons(&year, &semester, sap_id))
                        .collect();
                    let sched_times_queries: Vec<String> = sap_ids
                        .iter()
                        .map(|sap_id| Self::schedule_query_times(&year, &semester, sap_id))
                        .collect();

                    let mut backoff = Duration::from_millis(INITIAL_BACKOFF_MS);
                    let mut results = None;
                    for attempt in 0..=MAX_RETRIES {
                        match tokio::try_join!(
                            client.batch_get_multi(&detail_queries),
                            client.batch_get_multi(&sched_persons_queries),
                            client.batch_get_multi(&sched_times_queries),
                        ) {
                            Ok(r) => {
                                results = Some(r);
                                break;
                            }
                            Err(e) => {
                                if attempt == MAX_RETRIES {
                                    log::warn!(target: "sogrim_server",
                                        "fetch_semester: batch failed after {MAX_RETRIES} retries: {e}"
                                    );
                                } else {
                                    sleep(backoff).await;
                                    backoff *= 2;
                                }
                            }
                        }
                    }

                    let Some((detail_results, sched_persons_results, sched_times_results)) =
                        results
                    else {
                        return;
                    };

                    for (i, course_number) in chunk.iter().enumerate() {
                        match client.assemble_course(
                            &detail_results[i],
                            &sched_persons_results[i],
                            &sched_times_results[i],
                            &year,
                            &semester,
                        ).await {
                            Ok(details) => {
                                let key = format!("{year}/{semester}/{course_number}");
                                client.courses.insert(key, Arc::new(details)).await;
                                client.fetch_done.fetch_add(1, Ordering::Relaxed);
                            }
                            Err(e) => {
                                log::warn!(target: "sogrim_server",
                                    "fetch_semester: failed to parse {course_number}: {e}"
                                );
                            }
                        }
                    }
                })
            })
            .collect();

        for handle in handles {
            let _ = handle.await;
        }

        let stats = self.fetch_stats();
        log::info!(
            target: "sogrim_server",
            "fetch_semester {year}/{semester} complete: {}/{} courses cached",
            stats.warmed_courses,
            stats.total_courses,
        );
    }

    pub async fn get_course_details(
        &self,
        year: &str,
        semester: &str,
        course_number: &str,
    ) -> Result<Arc<CourseDetails>, SapError> {
        let key = format!("{year}/{semester}/{course_number}");
        if let Some(cached) = self.courses.get(&key).await {
            return Ok(cached);
        }
        let sap_id = course_number_to_sap_id(course_number);
        let details = Arc::new(self.fetch_course(year, semester, &sap_id).await?);
        self.courses.insert(key, details.clone()).await;
        Ok(details)
    }

    pub async fn get_semesters(&self) -> Result<Arc<Vec<Semester>>, SapError> {
        let key = "semesters".to_string();
        if let Some(cached) = self.semesters.get(&key).await {
            return Ok(cached);
        }
        let result = Arc::new(self.fetch_semesters().await?);
        self.semesters.insert(key, result.clone()).await;
        Ok(result)
    }

    pub async fn get_course_ids(
        &self,
        year: &str,
        semester: &str,
    ) -> Result<Arc<Vec<CourseId>>, SapError> {
        let key = format!("{year}/{semester}");
        if let Some(cached) = self.course_ids.get(&key).await {
            return Ok(cached);
        }
        let result = Arc::new(self.fetch_course_ids(year, semester).await?);
        self.course_ids.insert(key, result.clone()).await;
        Ok(result)
    }

    async fn fetch_semesters(&self) -> Result<Vec<Semester>, SapError> {
        let query = "SemesterSet?sap-client=700&$select=PiqYear,PiqSession,Begda,Endda";
        let value = self.batch_get(query).await?;
        let results = Self::extract_results(value)?;
        results
            .into_iter()
            .map(|v| {
                let year = v["PiqYear"].as_str().unwrap_or("").to_string();
                let session = v["PiqSession"].as_str().unwrap_or("").to_string();
                let begda = v["Begda"].as_str().unwrap_or("").to_string();
                let endda = v["Endda"].as_str().unwrap_or("").to_string();
                Ok(Semester {
                    year,
                    semester: session,
                    begin_date: parse_sap_date_str(&begda).unwrap_or(begda),
                    end_date: parse_sap_date_str(&endda).unwrap_or(endda),
                })
            })
            .collect()
    }

    async fn fetch_course_ids(
        &self,
        year: &str,
        semester: &str,
    ) -> Result<Vec<CourseId>, SapError> {
        let query = format!(
            "SmObjectSet?sap-client=700&$skip=0&$top=10000\
             &$filter=Peryr%20eq%20%27{year}%27%20and%20Perid%20eq%20%27{semester}%27\
             &$select=Otjid"
        );
        let value = self.batch_get(&query).await?;
        let results = Self::extract_results(value)?;
        Ok(results
            .into_iter()
            .filter_map(|v| {
                let sap_id = v.get("Otjid")?.as_str()?;
                Some(sap_id_to_course_number(sap_id))
            })
            .collect())
    }

    /// Fetch a single course (3 concurrent HTTP requests).
    /// Used for on-demand cache misses.
    async fn fetch_course(
        &self,
        year: &str,
        semester: &str,
        sap_id: &str,
    ) -> Result<CourseDetails, SapError> {
        let detail_query = Self::detail_query(year, semester, sap_id);
        let sched_persons_query = Self::schedule_query_persons(year, semester, sap_id);
        let sched_times_query = Self::schedule_query_times(year, semester, sap_id);
        let (detail_val, sched_persons_val, sched_times_val) = tokio::try_join!(
            self.batch_get(&detail_query),
            self.batch_get(&sched_persons_query),
            self.batch_get(&sched_times_query),
        )?;
        self.assemble_course(
            &detail_val,
            &sched_persons_val,
            &sched_times_val,
            year,
            semester,
        )
        .await
    }

    /// Assemble a `CourseDetails` from pre-fetched detail + schedule (persons) + schedule (times).
    async fn assemble_course(
        &self,
        detail_val: &Value,
        sched_persons_val: &Value,
        sched_times_val: &Value,
        year: &str,
        semester: &str,
    ) -> Result<CourseDetails, SapError> {
        let mut results = Self::extract_results(detail_val.clone())?;
        let raw = results
            .pop()
            .ok_or_else(|| SapError::NotFound("no results in detail response".into()))?;

        let course: RawCourse = serde_json::from_value(raw.clone())?;
        let credits = course.points.trim().parse::<f32>().unwrap_or(0.0);
        let corequisites = course
            .zz_semester_note
            .as_deref()
            .map(parse_corequisites)
            .unwrap_or_default();

        let exams = Self::parse_exams(Self::nested_results(&raw, "Exams"));
        let relations = Self::parse_relations(Self::nested_results(&raw, "SmRelations"));
        let prerequisites = Self::parse_prerequisites(Self::nested_results(&raw, "SmPrereq"));

        let responsible: Vec<Person> = Self::nested_results(&raw, "Responsible")
            .into_iter()
            .filter_map(|v| {
                let r: RawResponsible = serde_json::from_value(v).ok()?;
                Some(Person {
                    name: format!("{} {}", r.first_name, r.last_name),
                    title: r.title.filter(|t| !t.is_empty() && t != "-"),
                })
            })
            .collect();

        let offered_periods: Vec<OfferedPeriod> = Self::nested_results(&raw, "SmOfferedPeriodSet")
            .into_iter()
            .filter_map(|v| {
                let p: RawOfferedPeriod = serde_json::from_value(v).ok()?;
                Some(OfferedPeriod {
                    year: p.peryr,
                    semester: p.perid,
                    semester_name: p.perit,
                    year_name: p.peryt,
                })
            })
            .collect();

        let course_id = sap_id_to_course_number(&course.otjid);
        let schedule = self
            .parse_schedule(
                sched_persons_val,
                sched_times_val,
                &course_id,
                year,
                semester,
            )
            .await?;

        let name = course.name.trim().to_string();
        let faculty = course.org_text.filter(|s| !s.is_empty());
        let is_malag = classify_malag(&course_id, &name, credits, faculty.as_deref());
        let is_sport = is_sport_course(&course_id);

        Ok(CourseDetails {
            id: course_id,
            name,
            credits,
            faculty,
            syllabus: course.study_content_description.filter(|s| !s.is_empty()),
            academic_level: course.zz_academic_level_text.filter(|s| !s.is_empty()),
            is_english: course.zz_sm_language.as_deref() == Some("E"),
            is_malag,
            is_sport,
            semester_note: course.zz_semester_note.filter(|s| !s.is_empty()),
            exams,
            relations,
            prerequisites,
            corequisites,
            responsible,
            offered_periods,
            schedule,
        })
    }

    /// Parse schedule from two SAP responses:
    /// - `persons_val`: SeObjectSet expanded with EObjectSet + EObjectSet/Persons
    /// - `times_val`: SeObjectSet expanded with EObjectSet + EObjectSet/Schedule
    ///   We merge them by matching on EObjectSet Otjid.
    ///
    /// `course_id` is the 8-digit course number, used for sport-course name logic.
    async fn parse_schedule(
        &self,
        persons_val: &Value,
        times_val: &Value,
        course_id: &str,
        year: &str,
        semester: &str,
    ) -> Result<Vec<ScheduleGroup>, SapError> {
        let persons_groups = Self::extract_results(persons_val.clone())?;
        let times_groups = Self::extract_results(times_val.clone())?;

        // Build map: EObject Otjid → all structured time slots.
        let mut time_map: HashMap<String, Vec<ScheduleTimeSlot>> = HashMap::new();
        for tg in &times_groups {
            for ev in Self::nested_results(tg, "EObjectSet") {
                if let Ok(te) = serde_json::from_value::<RawEObjectTimes>(ev) {
                    let slots = extract_all_schedule_times(&te.schedule);
                    time_map.insert(te.otjid, slots);
                }
            }
        }

        let is_sport = is_sport_course(course_id);
        let se_prefix_re = Regex::new(r"^SE\d+\s*").unwrap();
        let mut groups = Vec::new();

        for gv in persons_groups {
            let group_number = gv
                .get("ZzSeSeqnr")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            if FILTERED_GROUPS.contains(&group_number.as_str()) {
                continue;
            }

            // Group-level name from SeObjectSet (e.g. "SE11 נבחרת טניס נשים").
            let group_name_raw = gv
                .get("Name")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();

            let events_raw = Self::nested_results(&gv, "EObjectSet");
            let mut events = Vec::new();

            for ev in events_raw {
                let e: RawEObject = match serde_json::from_value(ev) {
                    Ok(e) => e,
                    Err(_) => continue,
                };

                // Resolve event kind — for sport courses, use the specific team name.
                let kind = if is_sport {
                    resolve_sport_kind(
                        &e.category_text,
                        e.name.as_deref(),
                        &group_name_raw,
                        course_id,
                    )
                } else {
                    e.category_text.clone()
                };

                // Resolve building/room — prefer RoomId-based lookup, fall back to
                // code-based resolution from RoomText.
                let (building, room) = self
                    .resolve_building_and_room(
                        e.room_text.as_deref(),
                        e.room_id.as_deref(),
                        year,
                        semester,
                    )
                    .await;

                let lecturer = format_person(&e.persons.results);
                let schedule_text = e.schedule_summary.clone().unwrap_or_default();

                // Expand into one ScheduleEvent per time slot (GAP 6).
                let slots = time_map.get(&e.otjid);
                if let Some(slots) = slots.filter(|s| !s.is_empty()) {
                    for slot in slots {
                        // Filter out buggy near-zero-duration entries (GAP 11).
                        if is_buggy_time_slot(slot) {
                            continue;
                        }
                        events.push(ScheduleEvent {
                            kind: kind.clone(),
                            day: slot.day,
                            start_time: slot.start_time.clone(),
                            end_time: slot.end_time.clone(),
                            schedule_text: schedule_text.clone(),
                            building: building.clone(),
                            room: room.clone(),
                            lecturer: lecturer.clone(),
                        });
                    }
                } else {
                    // No structured time data — emit event with None day/times,
                    // the schedule_text still provides human-readable info.
                    events.push(ScheduleEvent {
                        kind,
                        day: None,
                        start_time: None,
                        end_time: None,
                        schedule_text,
                        building,
                        room,
                        lecturer,
                    });
                }
            }

            // Deduplicate events that are identical (can happen with multi-entry schedules).
            events.dedup();

            // Resolve group-level name for sport courses.
            let group_display_name = if is_sport {
                let cleaned = se_prefix_re.replace(&group_name_raw, "").to_string();
                Some(cleaned).filter(|s| !s.is_empty())
            } else {
                None
            };

            groups.push(ScheduleGroup {
                group: group_number,
                name: group_display_name,
                events,
            });
        }

        Ok(groups)
    }

    /// Resolve building name and room number from SAP room data.
    /// Uses the static building code map first; on miss, queries GObjectSet
    /// and caches the result for the lifetime of the client.
    async fn resolve_building_and_room(
        &self,
        room_text: Option<&str>,
        room_id: Option<&str>,
        year: &str,
        semester: &str,
    ) -> (Option<String>, Option<String>) {
        let room_text = match room_text.filter(|r| !r.is_empty() && *r != "ראה פרטים") {
            Some(r) => r,
            None => return (None, None),
        };

        let parts: Vec<&str> = room_text.split('-').collect();
        if parts.len() != 2 {
            return (None, Some(room_text.to_string()));
        }
        let building_code = parts[0];
        let room_number = parts[1].trim_start_matches('0');
        let room_num = if room_number.is_empty() {
            parts[1]
        } else {
            room_number
        };

        // Try static map first (fast path, covers most buildings).
        if let Some(name) = resolve_building_code(building_code) {
            return (Some(name.to_string()), Some(room_num.to_string()));
        }

        // Dynamic lookup via GObjectSet, cached per room_id.
        if let Some(rid) = room_id.filter(|r| !r.is_empty()) {
            let building = self.get_building_name(rid, year, semester).await;
            return (building, Some(room_num.to_string()));
        }

        (None, Some(room_num.to_string()))
    }

    /// Fetch building name from GObjectSet, with moka cache.
    async fn get_building_name(&self, room_id: &str, year: &str, semester: &str) -> Option<String> {
        // Check cache.
        if let Some(cached) = self.buildings.get(room_id).await {
            return cached;
        }

        let query = format!(
            "GObjectSet(Otjid='{}',Peryr='{year}',Perid='{semester}')?sap-client=700&$select=Building",
            urlencoding::encode(room_id)
        );

        let result = match self.batch_get(&query).await {
            Ok(val) => {
                let building = val
                    .get("d")
                    .and_then(|d| d.get("Building"))
                    .and_then(|b| b.as_str())
                    .filter(|s| !s.is_empty())
                    .map(normalize_building_name);
                building
            }
            Err(e) => {
                log::debug!(target: "sogrim_server", "GObjectSet lookup failed for {room_id}: {e}");
                None
            }
        };

        self.buildings
            .insert(room_id.to_string(), result.clone())
            .await;
        result
    }

    fn detail_query(year: &str, semester: &str, sap_id: &str) -> String {
        let filter = format!(
            "Peryr%20eq%20%27{year}%27%20and%20Perid%20eq%20%27{semester}%27\
             %20and%20Otjid%20eq%20%27{sap_id}%27"
        );
        let select = "Otjid,Points,Name,StudyContentDescription,OrgText,\
                       ZzAcademicLevel,ZzAcademicLevelText,ZzSmLanguage,ZzSemesterNote,\
                       Responsible,Exams,SmRelations,SmPrereq,SmOfferedPeriodSet";
        let expand = "Responsible,Exams,SmRelations,SmPrereq,SmOfferedPeriodSet";
        format!("SmObjectSet?sap-client=700&$filter={filter}&$select={select}&$expand={expand}")
    }

    fn schedule_entity(year: &str, semester: &str, sap_id: &str) -> String {
        format!(
            "SmObjectSet(Otjid='{sap_id}',Peryr='{year}',Perid='{semester}',\
             ZzCgOtjid='',ZzPoVersion='',ZzScOtjid='')/SeObjectSet?sap-client=700"
        )
    }

    /// Schedule query expanding Persons (for lecturer names).
    /// Selects Name at both SeObjectSet and EObjectSet level (for sport course names),
    /// plus RoomId for building lookup.
    fn schedule_query_persons(year: &str, semester: &str, sap_id: &str) -> String {
        format!(
            "{}&$select=ZzSeSeqnr,Name,\
             EObjectSet/Otjid,EObjectSet/CategoryText,EObjectSet/Name,\
             EObjectSet/ScheduleSummary,EObjectSet/ScheduleText,\
             EObjectSet/RoomText,EObjectSet/RoomId,\
             EObjectSet/Persons/Title,EObjectSet/Persons/FirstName,EObjectSet/Persons/LastName\
             &$expand=EObjectSet,EObjectSet/Persons",
            Self::schedule_entity(year, semester, sap_id)
        )
    }

    /// Schedule query expanding Schedule (for structured day/time).
    fn schedule_query_times(year: &str, semester: &str, sap_id: &str) -> String {
        format!(
            "{}&$expand=EObjectSet,EObjectSet/Schedule",
            Self::schedule_entity(year, semester, sap_id)
        )
    }

    // -----------------------------------------------------------------------
    // Batch protocol
    // -----------------------------------------------------------------------

    /// Send a single GET query via the OData $batch endpoint.
    /// This is the proven format that SAP accepts.
    async fn batch_get(&self, query: &str) -> Result<Value, SapError> {
        let url = format!("{SAP_BASE_URL}/$batch?sap-client=700");
        let body = format!(
            "\r\n--{BATCH_BOUNDARY}\r\n\
             Content-Type: application/http\r\n\
             Content-Transfer-Encoding: binary\r\n\
             \r\n\
             GET {query} HTTP/1.1\r\n\
             sap-cancel-on-close: true\r\n\
             X-Requested-With: X\r\n\
             sap-contextid-accept: header\r\n\
             Accept: application/json\r\n\
             Accept-Language: he\r\n\
             DataServiceVersion: 2.0\r\n\
             MaxDataServiceVersion: 2.0\r\n\
             \r\n\
             \r\n\
             --{BATCH_BOUNDARY}--\r\n"
        );

        let body_len = body.len();
        let resp = self.send_batch_post(&url, body).await?;
        let text = resp.text().await?;
        self.bytes_sent.fetch_add(body_len, Ordering::Relaxed);
        self.bytes_received.fetch_add(text.len(), Ordering::Relaxed);

        // Single-GET response: split on double newline, 3rd chunk, first line = JSON
        let normalized = text.replace("\r\n", "\n");
        let chunks: Vec<&str> = normalized.trim().split("\n\n").collect();
        if chunks.len() < 3 {
            return Err(SapError::BadResponse(format!(
                "expected 3+ chunks, got {}",
                chunks.len()
            )));
        }
        let json_str = chunks[2]
            .split('\n')
            .next()
            .ok_or_else(|| SapError::BadResponse("empty JSON chunk".into()))?;
        serde_json::from_str(json_str).map_err(SapError::Json)
    }

    /// Send multiple GET queries packed into a single OData $batch POST.
    /// Returns one `Value` per query, in the same order.
    async fn batch_get_multi(&self, queries: &[String]) -> Result<Vec<Value>, SapError> {
        let url = format!("{SAP_BASE_URL}/$batch?sap-client=700");

        // Build body using the same indented format that works for single GETs
        let mut body = String::new();
        for query in queries {
            body.push_str(&format!(
                "\r\n--{BATCH_BOUNDARY}\r\n\
                 Content-Type: application/http\r\n\
                 Content-Transfer-Encoding: binary\r\n\
                 \r\n\
                 GET {query} HTTP/1.1\r\n\
                 sap-cancel-on-close: true\r\n\
                 X-Requested-With: X\r\n\
                 sap-contextid-accept: header\r\n\
                 Accept: application/json\r\n\
                 Accept-Language: he\r\n\
                 DataServiceVersion: 2.0\r\n\
                 MaxDataServiceVersion: 2.0\r\n\
                 \r\n\
                 \r\n"
            ));
        }
        body.push_str(&format!("--{BATCH_BOUNDARY}--\r\n"));

        let body_len = body.len();
        let resp = self.send_batch_post(&url, body).await?;
        let text = resp.text().await?;
        self.bytes_sent.fetch_add(body_len, Ordering::Relaxed);
        self.bytes_received.fetch_add(text.len(), Ordering::Relaxed);
        Self::parse_multi_batch_response(&text, queries.len())
    }

    async fn send_batch_post(
        &self,
        url: &str,
        body: String,
    ) -> Result<reqwest::Response, SapError> {
        let target_url = if let Some(ref proxy) = self.proxy_url {
            format!("{proxy}/?url={}", urlencoding::encode(url))
        } else {
            url.to_string()
        };

        let mut req = self
            .http
            .post(&target_url)
            .header(
                "Content-Type",
                format!("multipart/mixed;boundary={BATCH_BOUNDARY}"),
            )
            .header("Accept", "multipart/mixed");

        // When going direct (no proxy), we need SAP-specific headers.
        // The Worker adds these itself.
        if self.proxy_url.is_none() {
            req = req
                .header("Origin", "https://portalex.technion.ac.il")
                .header("Referer", "https://portalex.technion.ac.il/ovv/")
                .header(
                    "User-Agent",
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                )
                .header("X-Requested-With", "X")
                .header("DataServiceVersion", "2.0")
                .header("MaxDataServiceVersion", "2.0")
                .header("Accept-Language", "he");
        }

        let resp = req.body(body).send().await?;

        let status = resp.status().as_u16();
        if status != 202 {
            return Err(SapError::BadStatus(status));
        }
        Ok(resp)
    }

    /// Parse a multipart batch response containing multiple JSON payloads.
    /// SAP uses its own boundary in the response (not the request boundary),
    /// so we extract it from the first line.
    fn parse_multi_batch_response(text: &str, expected: usize) -> Result<Vec<Value>, SapError> {
        // First line of the response IS the boundary (e.g. "--1AB578A7...")
        let response_boundary = text
            .lines()
            .next()
            .ok_or_else(|| SapError::BadResponse("empty response".into()))?
            .trim();

        let parts: Vec<&str> = text.split(response_boundary).collect();
        let mut results = Vec::with_capacity(expected);

        for part in parts.iter().skip(1) {
            // Skip closing boundary
            if part.trim_start().starts_with("--") || part.trim().is_empty() {
                continue;
            }

            let normalized = part.replace("\r\n", "\n");
            let sections: Vec<&str> = normalized.split("\n\n").collect();

            // Sections: [0] = MIME headers, [1] = HTTP status + response headers, [2] = JSON body
            if sections.len() >= 3 {
                let json_str = sections[2].split('\n').next().unwrap_or("");
                if !json_str.is_empty() {
                    let value: Value = serde_json::from_str(json_str)?;
                    results.push(value);
                }
            }
        }

        if results.len() != expected {
            return Err(SapError::BadResponse(format!(
                "expected {} results, got {}",
                expected,
                results.len()
            )));
        }

        Ok(results)
    }

    fn extract_results(value: Value) -> Result<Vec<Value>, SapError> {
        let resp: ODataResponse = serde_json::from_value(value)?;
        Ok(resp.d.results)
    }

    fn nested_results(parent: &Value, key: &str) -> Vec<Value> {
        parent
            .get(key)
            .and_then(|v| v.get("results"))
            .and_then(|v| v.as_array())
            .cloned()
            .unwrap_or_default()
    }

    // -----------------------------------------------------------------------
    // Data processing
    // -----------------------------------------------------------------------

    /// Parse exams with parent/child hierarchy handling.
    /// SAP returns root exam entries (date only) and child entries (date + time).
    /// When both exist for the same date, we keep only the child (with time).
    /// Also handles quiz exams (MI, M2) and exam notes (ZzSeComment).
    fn parse_exams(raw_exams: Vec<Value>) -> Vec<Exam> {
        let parsed: Vec<RawExam> = raw_exams
            .into_iter()
            .filter_map(|v| serde_json::from_value(v).ok())
            .collect();

        // Identify root exam GUIDs so we can detect parent vs child.
        let root_guids: HashSet<&str> = parsed
            .iter()
            .filter(|e| {
                e.zz_exam_offer_parent_guid
                    .as_deref()
                    .is_none_or(|s| s.is_empty())
            })
            .filter_map(|e| e.zz_exam_offer_guid.as_deref())
            .filter(|s| !s.is_empty())
            .collect();

        // Track which (category_code, date, note) combos have a child with time,
        // so we can suppress the parent's timeless entry.
        let mut dates_with_time: HashSet<(String, String, String)> = HashSet::new();

        struct ExamEntry {
            category: String,
            category_code: String,
            date: Option<String>,
            begin_time: Option<String>,
            end_time: Option<String>,
            note: Option<String>,
            is_child: bool,
        }

        let mut entries: Vec<ExamEntry> = Vec::new();

        for e in &parsed {
            let date = e.exam_date.as_deref().and_then(parse_sap_date_str);
            let begin = e.exam_beg_time.as_deref().and_then(parse_sap_time);
            let end = e.exam_end_time.as_deref().and_then(parse_sap_time);
            let note = e
                .zz_se_comment
                .as_deref()
                .filter(|s| !s.is_empty())
                .map(|s| s.to_string());

            let is_child = e
                .zz_exam_offer_parent_guid
                .as_deref()
                .is_some_and(|p| !p.is_empty() && root_guids.contains(p));

            // Child entries with "00:00 - 00:00" are effectively timeless.
            let has_real_time = begin.as_deref().is_some_and(|b| b != "00:00")
                || end.as_deref().is_some_and(|e| e != "00:00");

            let (begin, end) = if is_child && !has_real_time {
                (None, None)
            } else {
                (begin, end)
            };

            if has_real_time {
                if let Some(ref d) = date {
                    dates_with_time.insert((
                        e.category_code.clone(),
                        d.clone(),
                        note.clone().unwrap_or_default(),
                    ));
                }
            }

            entries.push(ExamEntry {
                category: e.category.clone(),
                category_code: e.category_code.clone(),
                date,
                begin_time: begin,
                end_time: end,
                note,
                is_child,
            });
        }

        // Deduplicate: suppress parent entries when a child with time exists.
        let mut seen = HashSet::new();
        let mut result = Vec::new();
        for entry in entries {
            // Skip root entries that have a child with time for the same date.
            if !entry.is_child
                && entry.begin_time.is_none()
                && entry.date.as_ref().is_some_and(|d| {
                    dates_with_time.contains(&(
                        entry.category_code.clone(),
                        d.clone(),
                        entry.note.clone().unwrap_or_default(),
                    ))
                })
            {
                continue;
            }

            let dedup_key = (
                entry.category_code.clone(),
                entry.date.clone(),
                entry.begin_time.clone(),
                entry.end_time.clone(),
                entry.note.clone(),
            );
            if !seen.insert(dedup_key) {
                continue;
            }

            result.push(Exam {
                category: entry.category,
                category_code: entry.category_code,
                date: entry.date,
                begin_time: entry.begin_time,
                end_time: entry.end_time,
                note: entry.note,
            });
        }
        result
    }

    fn parse_relations(raw: Vec<Value>) -> Vec<Relation> {
        let mut seen = HashMap::new();
        for v in raw {
            let r: RawRelation = match serde_json::from_value(v) {
                Ok(r) => r,
                Err(_) => continue,
            };
            let relation_type = match r.zz_relationship_key.as_deref() {
                Some("AZEC" | "AZID") => RelationType::NoAdditionalCredit,
                Some("AZCC") => RelationType::Contains,
                Some("BZCC") => RelationType::ContainedIn,
                _ => continue,
            };
            seen.entry(r.otjid.clone()).or_insert(Relation {
                course_id: sap_id_to_course_number(&r.otjid),
                relation_type,
            });
        }
        seen.into_values().collect()
    }

    fn parse_prerequisites(raw: Vec<Value>) -> Vec<PrereqToken> {
        raw.into_iter()
            .filter_map(|v| {
                let t: RawPrereqToken = serde_json::from_value(v).ok()?;
                // Skip empty tokens
                if t.module_id
                    .as_deref()
                    .is_none_or(|s| s.trim_start_matches('0').is_empty())
                    && t.operator.is_none()
                    && t.bracket.as_deref().is_none_or(|s| s.is_empty())
                {
                    return None;
                }
                let module_id = t
                    .module_id
                    .map(|id| id.trim_start_matches('0').to_string())
                    .filter(|s| !s.is_empty());
                let operator = t.operator.filter(|s| !s.is_empty());
                let bracket = t.bracket.filter(|s| !s.is_empty());
                Some(PrereqToken {
                    module_id,
                    operator,
                    bracket,
                })
            })
            .collect()
    }
}

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

/// A single resolved time slot for a schedule event.
#[derive(Debug, Clone)]
struct ScheduleTimeSlot {
    day: Option<u8>,
    start_time: Option<String>,
    end_time: Option<String>,
}

/// Extract ALL structured day/time slots from EventScheduleSet entries.
/// Groups identical (weekday, start, end) tuples and only keeps repeating ones
/// (appearing more than half the expected number of sessions in a semester).
/// This filters out one-off makeup sessions and keeps the regular weekly schedule.
fn extract_all_schedule_times(entries: &RawScheduleEntries) -> Vec<ScheduleTimeSlot> {
    if entries.results.is_empty() {
        return vec![];
    }

    // Count occurrences of each (weekday, start, end) tuple.
    type TimeKey = (Option<u8>, Option<String>, Option<String>);
    let mut counts: HashMap<TimeKey, usize> = HashMap::new();

    for entry in &entries.results {
        let day = entry.evdat.as_deref().and_then(|d| {
            let secs = parse_sap_date_epoch(d)?;
            let dt = chrono::DateTime::from_timestamp(secs, 0)?;
            let weekday = dt.weekday().num_days_from_sunday() as u8;
            // Include Sun-Fri, skip Saturday.
            if weekday <= 5 {
                Some(weekday)
            } else {
                None
            }
        });

        let start_time = entry.beguz.as_deref().and_then(parse_sap_time);
        let end_time = entry.enduz.as_deref().and_then(parse_sap_time);

        // Skip entries where day resolved to None (Saturday) but time exists.
        if day.is_none() && start_time.is_some() {
            continue;
        }

        *counts.entry((day, start_time, end_time)).or_insert(0) += 1;
    }

    // A regular semester has ~13 weeks, summer ~7. A repeating event should appear
    // more than half that. Use half the average count as threshold.
    let total_entries = entries.results.len();
    let distinct_slots = counts.len().max(1);
    let avg_count = total_entries / distinct_slots;
    let min_repeating = avg_count / 2;

    // If there's only one distinct slot, always keep it.
    // Otherwise, filter to repeating ones.
    let slots: Vec<ScheduleTimeSlot> = if distinct_slots == 1 {
        counts
            .into_keys()
            .map(|(day, start_time, end_time)| ScheduleTimeSlot {
                day,
                start_time,
                end_time,
            })
            .collect()
    } else {
        counts
            .into_iter()
            .filter(|(_, count)| *count > min_repeating)
            .map(|((day, start_time, end_time), _)| ScheduleTimeSlot {
                day,
                start_time,
                end_time,
            })
            .collect()
    };

    slots
}

/// Detect buggy near-zero-duration schedule entries.
/// Filters patterns like "01:01-01:02" or "00:0X-01:00".
fn is_buggy_time_slot(slot: &ScheduleTimeSlot) -> bool {
    let (Some(start), Some(end)) = (slot.start_time.as_deref(), slot.end_time.as_deref()) else {
        return false;
    };
    // Parse "HH:MM" to minutes since midnight.
    let parse_mins = |s: &str| -> Option<u32> {
        let (h, m) = s.split_once(':')?;
        Some(h.parse::<u32>().ok()? * 60 + m.parse::<u32>().ok()?)
    };
    let (Some(s), Some(e)) = (parse_mins(start), parse_mins(end)) else {
        return false;
    };
    // Events shorter than 15 minutes are almost certainly data bugs.
    e.saturating_sub(s) < 15
}

/// Resolve the display name for a sport course event.
/// Sport courses have generic CategoryText ("ספורט" / "נבחרת ספורט") but
/// the specific team name is in the EObject Name or SeObject (group) Name.
fn resolve_sport_kind(
    category_text: &str,
    event_name: Option<&str>,
    group_name_raw: &str,
    course_id: &str,
) -> String {
    let event_name = event_name.unwrap_or("");

    // If the event name is specific (not generic), use it.
    let is_generic_event_name = event_name.is_empty()
        || event_name.contains("ספורט חינוך גופני")
        || event_name == "ספורט נבחרות ספורט"
        || {
            // Check if the name just ends with the course number.
            let num = course_id.trim_start_matches('0');
            let re = Regex::new(&format!(r"-\s*0*{}$", regex::escape(num))).unwrap();
            re.is_match(event_name)
        };

    if !is_generic_event_name {
        return event_name.to_string();
    }

    // Fall back to group-level name (strip "SE\d+" prefix).
    if !group_name_raw.is_empty() {
        let cleaned = Regex::new(r"^SE\d+\s*")
            .unwrap()
            .replace(group_name_raw, "")
            .to_string();
        if !cleaned.is_empty() {
            return cleaned;
        }
    }

    // Last resort: use the original category text.
    category_text.to_string()
}

/// Static building code → name mapping. Comprehensive list matching
/// the GObjectSet API results.
/// When a code is missing, callers get None (still shows the room code).
fn resolve_building_code(code: &str) -> Option<&'static str> {
    // This list is derived from GObjectSet results + the SAP
    // building names normalized the same way he does (strip "בנין"/"בניין" prefix).
    match code {
        "014" => Some("אולמן"),
        "015" => Some("אולם צ'רצ'יל"),
        "016" => Some("הנ' כימית"),
        "018" => Some("הנ' מכונות"),
        "019" => Some("מתמטיקה"),
        "020" => Some("כימיה"),
        "021" => Some("פיסיקה"),
        "024" => Some("הנ' תעשיה"),
        "025" => Some("הנ' חשמל"),
        "028" => Some("ביולוגיה"),
        "030" => Some("גולדשטיין-גורן"),
        "032" => Some("אמדו"),
        "033" => Some("מדעי המזון"),
        "034" => Some("זיסאפל"),
        "037" => Some("ליידי דייוס"),
        "038" => Some("אודיטוריום"),
        "039" => Some("ארכיטקטורה"),
        "040" => Some("ביוטכנולוגיה"),
        "044" => Some("פישבך"),
        "048" => Some("הנ' ביורפואית"),
        "054" => Some("אולמן"),
        "056" => Some("מדע החלטות"),
        "058" => Some("סגו"),
        "060" => Some("ביוטכנולוגיה ומדעי המזון"),
        "069" => Some("טאוב"),
        "071" => Some("ספריה מרכזית"),
        "079" => Some("הנדסת חמרים"),
        "084" => Some("מדעי המחשב"),
        "088" => Some("אהרונוב"),
        "090" => Some("מכון נאמן"),
        "093" => Some("בורוביץ הנדסה אזרחית"),
        "095" => Some("הנ' אוירונאוטית"),
        "096" => Some("רקנאטי"),
        "102" => Some("פקולטה לרפואה"),
        "103" => Some("ננו-אלקטרוניקה"),
        "120" => Some("ספורט"),
        "121" => Some("בנין ספורט 2"),
        "126" => Some("מגרש כדורגל"),
        "127" => Some("מגרש טניס"),
        "128" => Some("בריכת שחיה"),
        "129" => Some("סקווש"),
        _ => None,
    }
}

/// Normalize a building name from GObjectSet (e.g. "בנין ע'ש טאוב" → "טאוב").
/// Matches the normalization used by GObjectSet building names.
fn normalize_building_name(raw: &str) -> String {
    let trimmed = Regex::new(r"\s+").unwrap().replace_all(raw.trim(), " ");
    let mappings: &[(&str, &str)] = &[
        ("בנין אולמן", "אולמן"),
        ("בנין בורוביץ הנדסה אזרחית", "בורוביץ הנדסה אזרחית"),
        ("בנין דן קהאן", "דן קהאן"),
        ("בנין הנ' אוירונאוטית", "הנ' אוירונאוטית"),
        ("בנין זיסאפל", "זיסאפל"),
        ("בנין להנדסת חמרים", "הנדסת חמרים"),
        ("בנין ליידי דייוס", "ליידי דייוס"),
        ("בנין למדעי המחשב", "מדעי המחשב"),
        ("בנין ע'ש אמדו", "אמדו"),
        ("בנין ע'ש טאוב", "טאוב"),
        ("בנין ע'ש סגו", "סגו"),
        ("בנין פישבך", "פישבך"),
        ("בנין פקולטה לרפואה", "פקולטה לרפואה"),
        ("בניין ננו-אלקטרוניקה", "ננו-אלקטרוניקה"),
        ("בניין ספורט", "ספורט"),
    ];
    for (prefix, replacement) in mappings {
        if let Some(rest) = trimmed.strip_prefix(prefix) {
            return format!("{replacement}{rest}");
        }
    }
    trimmed.to_string()
}

fn format_person(persons: &[RawPerson]) -> Option<String> {
    persons.first().map(|p| {
        let title = p.title.as_deref().unwrap_or("").trim();
        if title.is_empty() || title == "-" {
            format!("{} {}", p.first_name, p.last_name)
        } else {
            format!("{title} {} {}", p.first_name, p.last_name)
        }
    })
}

/// Parse corequisites from semester notes. Looks for lines like:
/// "מקצוע צמוד: 01040031" or "מקצועות צמודים: 01040031, 01041066"
fn parse_corequisites(note: &str) -> Vec<CourseId> {
    let re = Regex::new(r"מקצועו?ת? צמודי?ם?:\s*(.+)").unwrap();
    let Some(caps) = re.captures(note) else {
        return vec![];
    };
    let content = caps.get(1).unwrap().as_str();
    let num_re = Regex::new(r"\d{5,8}").unwrap();
    num_re
        .find_iter(content)
        .map(|m| CourseId::new(m.as_str()))
        .collect()
}

/// Prepend `SM` to get the SAP OData entity ID.
/// Course numbers are always 8-digit (e.g. "02340114").
pub fn course_number_to_sap_id(number: &str) -> String {
    format!("SM{number}")
}

/// Strip the `SM` prefix from a SAP OData entity ID.
/// Returns the 8-digit course number (e.g. "02340114").
pub fn sap_id_to_course_number(sap_id: &str) -> CourseId {
    CourseId::new(sap_id.trim_start_matches("SM"))
}

fn parse_sap_date_epoch(date_str: &str) -> Option<i64> {
    let inner = date_str.strip_prefix("/Date(")?.strip_suffix(")/")?;
    let ms: i64 = inner.parse().ok()?;
    Some(ms / 1000)
}

fn parse_sap_date_str(date_str: &str) -> Option<String> {
    let inner = date_str.strip_prefix("/Date(")?.strip_suffix(")/")?;
    let ms: i64 = inner.parse().ok()?;
    let dt = chrono::DateTime::from_timestamp(ms / 1000, 0)?;
    Some(dt.format("%d-%m-%Y").to_string())
}

fn parse_sap_time(time_str: &str) -> Option<String> {
    let rest = time_str.strip_prefix("PT")?;
    let (hours, rest) = rest.split_once('H')?;
    let (minutes, _) = rest.split_once('M')?;
    Some(format!("{hours}:{minutes}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn client() -> CachedSapClient {
        CachedSapClient::new()
    }

    #[test]
    fn test_course_number_conversions() {
        assert_eq!(course_number_to_sap_id("02340114"), "SM02340114");
        assert_eq!(course_number_to_sap_id("01040031"), "SM01040031");
        assert_eq!(*sap_id_to_course_number("SM02340114"), *"02340114");
        assert_eq!(*sap_id_to_course_number("SM97030012"), *"97030012");
    }

    #[test]
    fn test_is_sport_course() {
        assert!(is_sport_course("03940902")); // נבחרות ספורט
        assert!(is_sport_course("03940800")); // חינוך גופני
        assert!(is_sport_course("03940999"));
        assert!(!is_sport_course("03940700")); // not sport range
        assert!(!is_sport_course("02340114")); // מבוא למדמ"ח
        assert!(!is_sport_course("01040031")); // infi 1
    }

    #[test]
    fn test_classify_malag() {
        let h = Some(HUMANITIES_FACULTY);

        // Standard malag courses
        assert!(classify_malag(
            "03240879",
            "סוגיות נבחרות בחברה הישראלית",
            2.0,
            h
        ));
        assert!(classify_malag("03240442", "משפט העבודה בישראל", 2.0, h));
        assert!(classify_malag("03250010", "מדע דת ופילוסופיה", 2.0, h));
        assert!(classify_malag(
            "03260005",
            "פריצות דרך בתולדות החשיבה המתמטית",
            2.0,
            h
        ));

        // Explicit non-humanities malags
        assert!(classify_malag(
            "02140120",
            "יסודות למידה והוראה",
            2.0,
            Some("חינוך למדע וטכנולוגיה")
        ));
        assert!(classify_malag(
            "02750112",
            "אבולוציה של האדם",
            2.0,
            Some("הפקולטה לרפואה")
        ));

        // Language courses — not malag
        assert!(!classify_malag("03240692", "סינית למתחילים", 2.0, h));
        assert!(!classify_malag("03240600", "גרמנית 1", 2.0, h));
        assert!(!classify_malag("03240685", "שיחה באנגלית למתקדמים", 2.0, h));

        // Art/performance — not malag
        assert!(!classify_malag("03240481", "רישום למתחילים", 2.0, h));
        assert!(!classify_malag("03240236", "תזמורת נשיפה", 2.0, h));

        // Academic writing — not malag
        assert!(!classify_malag(
            "03240490",
            "כתיבה אקדמית לתואר ראשון",
            2.0,
            h
        ));

        // Wrong credits — not malag
        assert!(!classify_malag(
            "03240033",
            "אנגלית טכנית-מתקדמים ב'",
            3.0,
            h
        ));
        assert!(!classify_malag("03240513", "מחזה-הצגה-מופע", 1.5, h));

        // Wrong faculty — not malag
        assert!(!classify_malag(
            "02340114",
            "מבוא למדעי המחשב",
            2.0,
            Some("הנדסת חשמל ומחשבים")
        ));

        // Sport — not malag
        assert!(!classify_malag("03940902", "נבחרות ספורט", 1.5, h));
    }

    #[test]
    fn test_parse_sap_formats() {
        assert_eq!(
            parse_sap_date_str("/Date(1766707200000)/"),
            Some("26-12-2025".into())
        );
        assert_eq!(parse_sap_time("PT09H30M00S"), Some("09:30".into()));
        assert_eq!(parse_sap_time("garbage"), None);
    }

    #[test]
    fn test_parse_corequisites() {
        assert_eq!(
            parse_corequisites("מקצוע צמוד: 104031"),
            vec![CourseId::new("104031")]
        );
        assert_eq!(
            parse_corequisites("מקצועות צמודים: 104031, 104166"),
            vec![CourseId::new("104031"), CourseId::new("104166")]
        );
        assert_eq!(parse_corequisites("no coreqs here"), Vec::<CourseId>::new());
    }

    // Integration tests below require SAP API access.
    // Run with: cargo test -- --ignored

    #[tokio::test]
    #[ignore]
    async fn test_multi_batch() {
        let c = client();
        let queries = vec![
            "SemesterSet?sap-client=700&$select=PiqYear,PiqSession".to_string(),
            "SemesterSet?sap-client=700&$select=PiqYear".to_string(),
        ];
        let results = c.batch_get_multi(&queries).await.unwrap();
        assert_eq!(results.len(), 2);
        // Both should contain semester data
        assert!(!results[0]["d"]["results"].as_array().unwrap().is_empty());
        assert!(!results[1]["d"]["results"].as_array().unwrap().is_empty());
    }

    #[tokio::test]
    #[ignore]
    async fn test_fetch_semesters() {
        let semesters = client().get_semesters().await.unwrap();
        assert!(!semesters.is_empty());
    }

    #[tokio::test]
    #[ignore]
    async fn test_fetch_course_ids() {
        let semesters = client().get_semesters().await.unwrap();
        let s = &semesters[0];
        let ids = client().get_course_ids(&s.year, &s.semester).await.unwrap();
        assert!(ids.len() > 100);
        // IDs should be 8-digit course numbers without SM prefix
        assert!(ids.iter().all(|id| !id.starts_with("SM")));
    }

    #[tokio::test]
    #[ignore]
    async fn test_cached_course_details() {
        let c = client();

        // First fetch — hits SAP
        let d1 = c
            .get_course_details("2025", "200", "02340114")
            .await
            .unwrap();
        assert_eq!(d1.name, "מבוא למדעי המחשב מ'");
        assert_eq!(*d1.id, *"02340114");
        assert!(d1.credits > 0.0);
        assert!(!d1.exams.is_empty());
        assert!(d1.exams.len() < 10); // deduped
        assert!(!d1.relations.is_empty());
        assert!(!d1.schedule.is_empty());
        assert!(!d1.offered_periods.is_empty());

        // Second fetch — should be instant (cached)
        let d2 = c
            .get_course_details("2025", "200", "02340114")
            .await
            .unwrap();
        assert!(Arc::ptr_eq(&d1, &d2)); // same Arc = same cache entry

        // Verify JSON serialization works
        let json = serde_json::to_string_pretty(&*d1).unwrap();
        assert!(json.contains("02340114"));
        assert!(json.contains("מבוא למדעי המחשב"));
        println!("{json}");
    }

    #[tokio::test]
    #[ignore]
    async fn test_investigate_all_semesters_with_dates() {
        let c = client();
        // Fetch ALL semesters with full date info
        let query = "SemesterSet?sap-client=700&$select=PiqYear,PiqSession,Begda,Endda".to_string();
        let value = c.batch_get(&query).await.unwrap();
        let results = CachedSapClient::extract_results(value).unwrap();

        println!(
            "\n{:<6} {:<10} {:<14} {:<14} Analysis",
            "Year", "Code", "Start", "End"
        );
        println!("{}", "-".repeat(70));

        for v in &results {
            let year = v["PiqYear"].as_str().unwrap_or("?");
            let code = v["PiqSession"].as_str().unwrap_or("?");
            let begda = v["Begda"].as_str().unwrap_or("?");
            let endda = v["Endda"].as_str().unwrap_or("?");

            let start = parse_sap_date_str(begda).unwrap_or_else(|| begda.to_string());
            let end = parse_sap_date_str(endda).unwrap_or_else(|| endda.to_string());

            // Analyze: what month does it start?
            let analysis = match code {
                "200" => "winter".to_string(),
                "201" => "spring".to_string(),
                "202" => "summer".to_string(),
                _ => {
                    // Parse start month to guess what this is
                    if let Some(month_str) = start.split('-').nth(1) {
                        let month: u32 = month_str.parse().unwrap_or(0);
                        match month {
                            10 | 11 => "??? (starts Oct/Nov = winter-like)".to_string(),
                            3 | 4 => "??? (starts Mar/Apr = spring-like)".to_string(),
                            7..=9 => "??? (starts Jul/Aug/Sep = SUMMER-LIKE!)".to_string(),
                            _ => format!("??? (starts month {month})"),
                        }
                    } else {
                        "???".to_string()
                    }
                }
            };

            println!("{year:<6} {code:<10} {start:<14} {end:<14} {analysis}");
        }

        // Also count courses in each non-standard semester
        println!("\n--- Course counts for non-200/201/202 semesters ---");
        for v in &results {
            let year = v["PiqYear"].as_str().unwrap_or("?");
            let code = v["PiqSession"].as_str().unwrap_or("?");
            if matches!(code, "200" | "201" | "202") {
                continue;
            }
            match c.get_course_ids(year, code).await {
                Ok(ids) => println!("  {year}/{code}: {} courses", ids.len()),
                Err(e) => println!("  {year}/{code}: error: {e}"),
            }
        }
    }

    #[tokio::test]
    #[ignore]
    async fn test_measure_bandwidth_full_semester() {
        let c = Arc::new(CachedSapClient::new());

        // Phase 1: semesters + course index
        let semesters = c.get_semesters().await.unwrap();
        let latest = &semesters[0];
        let index = c
            .get_course_index(&latest.year, &latest.semester)
            .await
            .unwrap();

        let (sent1, recv1) = c.transfer_stats();
        println!("=== After semesters + index ===");
        println!("  Courses in semester: {}", index.len());
        println!(
            "  Bytes sent:     {:>10} ({:.1} KB)",
            sent1,
            sent1 as f64 / 1024.0
        );
        println!(
            "  Bytes received: {:>10} ({:.1} KB)",
            recv1,
            recv1 as f64 / 1024.0
        );
        println!(
            "  Total:          {:>10} ({:.1} KB)",
            sent1 + recv1,
            (sent1 + recv1) as f64 / 1024.0
        );

        // Phase 2: prewarm ALL courses
        c.fetch_total.store(index.len(), Ordering::Relaxed);
        c.fetch_all_courses().await;

        let (sent2, recv2) = c.transfer_stats();
        let warm = c.fetch_done.load(Ordering::Relaxed);
        println!("\n=== After full prewarm ===");
        println!("  Courses warmed:  {}/{}", warm, index.len());
        println!(
            "  Bytes sent:     {:>10} ({:.2} MB)",
            sent2,
            sent2 as f64 / 1_048_576.0
        );
        println!(
            "  Bytes received: {:>10} ({:.2} MB)",
            recv2,
            recv2 as f64 / 1_048_576.0
        );
        println!(
            "  Total transfer: {:>10} ({:.2} MB)",
            sent2 + recv2,
            (sent2 + recv2) as f64 / 1_048_576.0
        );
        println!("\n=== Cost estimate (DataImpulse $1/GB) ===");
        let total_gb = (sent2 + recv2) as f64 / 1_073_741_824.0;
        println!(
            "  Per prewarm:  ${:.4} ({:.2} MB)",
            total_gb,
            (sent2 + recv2) as f64 / 1_048_576.0
        );
        println!("  Daily (1x):   ${total_gb:.4}/day");
        println!("  Monthly (30x): ${:.2}/month", total_gb * 30.0);
        println!("  Yearly (365x): ${:.2}/year", total_gb * 365.0);
    }
}
