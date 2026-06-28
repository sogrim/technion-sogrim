//! Tests for the admin BI dashboard statistics.
//!
//! Pure shaping logic (`from_facet`, label merging, GPA bucketing) is tested
//! without a database. A live-DB integration test that seeds users and asserts
//! each facet is gated behind the same `SOGRIM_URI`/`SOGRIM_PROFILE` test-env
//! pattern used elsewhere, so the suite never blocks on a database being present.

use super::*;

fn courses_fixture() -> HashMap<CourseId, Course> {
    let mut m = HashMap::new();
    for (id, name) in [
        ("01040031", "חשבון אינפיניטסימלי 1מ'"),
        ("01040166", "אלגברה אמ'"),
    ] {
        m.insert(
            CourseId::new(id),
            Course {
                id: CourseId::new(id),
                credit: 5.0,
                name: name.to_string(),
                tags: None,
            },
        );
    }
    m
}

/// Builds a `FacetResult` from raw BSON exactly as the pipeline would emit it,
/// so we test the deserialization + shaping path end to end without a DB.
fn facet_from_bson(d: bson::Document) -> FacetResult {
    bson::deserialize_from_document(d).expect("facet doc should deserialize")
}

#[test]
fn overview_counts_and_stickiness() {
    let f = facet_from_bson(bson::doc! {
        "total": [ { "count": 100i64 } ],
        "dau": [ { "count": 10i64 } ],
        "wau": [ { "count": 30i64 } ],
        "mau": [ { "count": 50i64 } ],
        "onboarded": [ { "count": 80i64 } ],
        "imported": [ { "count": 60i64 } ],
        "computed": [ { "count": 40i64 } ],
    });
    let stats = DashboardStats::from_facet(f, &courses_fixture());
    assert_eq!(stats.overview.total_users, 100);
    assert_eq!(stats.overview.dau, 10);
    assert_eq!(stats.overview.wau, 30);
    assert_eq!(stats.overview.mau, 50);
    // Stickiness is a fraction in [0, 1] = dau/mau.
    assert_eq!(stats.overview.stickiness, 0.2);
    // Overview emits raw counts (the UI divides by total itself).
    assert_eq!(stats.overview.onboarded, 80);
    assert_eq!(stats.overview.imported_grades, 60);
    assert_eq!(stats.overview.computed_status, 40);
    // generated_at is an RFC-3339 timestamp.
    assert!(!stats.generated_at.is_empty());
    assert!(stats.generated_at.contains('T'));
    // Funnel mirrors the same counts.
    assert_eq!(stats.funnel.signed_in, 100);
    assert_eq!(stats.funnel.picked_catalog, 80);
    assert_eq!(stats.funnel.imported_grades, 60);
    assert_eq!(stats.funnel.computed_status, 40);
}

#[test]
fn empty_db_is_all_zeroes_not_a_panic() {
    let stats = DashboardStats::from_facet(facet_from_bson(bson::doc! {}), &HashMap::new());
    assert_eq!(stats.overview.total_users, 0);
    assert_eq!(stats.overview.onboarded, 0);
    // Stickiness is 0.0 (not null) when mau == 0.
    assert_eq!(stats.overview.stickiness, 0.0);
    // The GPA distribution always has all buckets, even with no data.
    assert_eq!(stats.academic.gpa_distribution.len(), GPA_BUCKETS.len());
    assert!(stats.academic.gpa_distribution.iter().all(|b| b.value == 0));
    // Heatmap is always 7x24.
    assert_eq!(stats.activity.last_active_heatmap.len(), 7);
    assert!(stats
        .activity
        .last_active_heatmap
        .iter()
        .all(|r| r.len() == 24));
    // Adoption is always a 3-element labeled array.
    assert_eq!(stats.population.adoption.len(), 3);
}

#[test]
fn recency_collapses_to_three_buckets_and_heatmap() {
    let f = facet_from_bson(bson::doc! {
        "recency": [
            { "_id": "active7d", "count": 5i64 },
            { "_id": "dormant7to30d", "count": 3i64 },
            { "_id": "inactive30d_plus", "count": 2i64 },
            { "_id": "never", "count": 7i64 },
        ],
        "heatmap": [
            { "_id": { "dow": 0i32, "hour": 9i32 }, "count": 4i64 },
            { "_id": { "dow": 6i32, "hour": 23i32 }, "count": 1i64 },
        ],
    });
    let stats = DashboardStats::from_facet(f, &HashMap::new());
    assert_eq!(stats.activity.active, 5);
    assert_eq!(stats.activity.dormant, 3);
    // inactive = inactive30d_plus + never = 2 + 7.
    assert_eq!(stats.activity.inactive, 9);
    assert_eq!(stats.activity.last_active_heatmap[0][9], 4);
    assert_eq!(stats.activity.last_active_heatmap[6][23], 1);
}

#[test]
fn adoption_is_labeled_three_element_array() {
    let f = facet_from_bson(bson::doc! {
        "feature_adoption": [
            { "_id": bson::Bson::Null, "dark_mode": 12i64, "custom_palette": 7i64, "timetable_drafts": 3i64 },
        ],
    });
    let stats = DashboardStats::from_facet(f, &HashMap::new());
    let a = &stats.population.adoption;
    assert_eq!(a.len(), 3);
    assert_eq!(a[0].label, "מצב כהה");
    assert_eq!(a[0].value, 12);
    assert_eq!(a[1].label, "פלטה מותאמת");
    assert_eq!(a[1].value, 7);
    assert_eq!(a[2].label, "מערכת שעות");
    assert_eq!(a[2].value, 3);
}

#[test]
fn faculty_catalog_and_year_buckets_merge_nulls() {
    let f = facet_from_bson(bson::doc! {
        "by_faculty": [
            { "_id": "ComputerScience", "count": 10i64 },
            { "_id": bson::Bson::Null, "count": 4i64 }, // no catalog -> Unknown
            { "_id": "Unknown", "count": 2i64 },        // explicit Unknown faculty
        ],
        "by_catalog": [
            { "_id": "מדמח תלת שנתי 2022-2023", "count": 6i64 },
            { "_id": bson::Bson::Null, "count": 4i64 },
        ],
        "by_catalog_year": [
            { "_id": 2022i64, "count": 6i64 },
            { "_id": 0i64, "count": 1i64 },
            { "_id": bson::Bson::Null, "count": 3i64 },
        ],
    });
    let stats = DashboardStats::from_facet(f, &HashMap::new());
    // The two Unknown faculty entries (null + explicit) merge into one.
    let unknown = stats
        .population
        .by_faculty
        .iter()
        .find(|l| l.label == "Unknown")
        .expect("Unknown faculty bucket present");
    assert_eq!(unknown.value, 6);
    // Catalog null -> "None".
    assert!(stats
        .population
        .by_catalog
        .iter()
        .any(|l| l.label == "None" && l.value == 4));
    // Year 0 + null merge into "Unknown" = 4.
    let yr_unknown = stats
        .population
        .by_catalog_year
        .iter()
        .find(|l| l.label == "Unknown")
        .expect("Unknown year bucket present");
    assert_eq!(yr_unknown.value, 4);
}

#[test]
fn courses_per_semester_sorted_by_order_key() {
    let f = facet_from_bson(bson::doc! {
        "courses_per_semester": [
            { "_id": { "season": "spring", "start_year": 2023i32 }, "count": 8i64 },
            { "_id": { "season": "winter", "start_year": 2023i32 }, "count": 5i64 },
            { "_id": { "season": "winter", "start_year": 2022i32 }, "count": 3i64 },
        ],
    });
    let stats = DashboardStats::from_facet(f, &HashMap::new());
    let labels: Vec<&str> = stats
        .academic
        .courses_per_semester
        .iter()
        .map(|s| s.label.as_str())
        .collect();
    // Ordered by order_key: 2022 winter < 2023 winter < 2023 spring, with
    // Hebrew season labels + start_year.
    assert_eq!(labels, vec!["חורף 2022", "חורף 2023", "אביב 2023"]);
    let values: Vec<i64> = stats
        .academic
        .courses_per_semester
        .iter()
        .map(|s| s.value)
        .collect();
    assert_eq!(values, vec![3, 5, 8]);
}

#[test]
fn most_taken_courses_enriched_with_names() {
    let f = facet_from_bson(bson::doc! {
        "top_courses": [
            { "_id": "01040031", "count": 50i64 },
            { "_id": "99999999", "count": 3i64 }, // unknown -> falls back to id
        ],
    });
    let stats = DashboardStats::from_facet(f, &courses_fixture());
    assert_eq!(
        stats.academic.most_taken_courses[0].course_name,
        "חשבון אינפיניטסימלי 1מ'"
    );
    assert_eq!(stats.academic.most_taken_courses[0].count, 50);
    // Most-taken rows carry no grade/fail/repeat data.
    assert_eq!(stats.academic.most_taken_courses[0].average_grade, None);
    assert_eq!(stats.academic.most_taken_courses[0].fail_rate, None);
    assert_eq!(stats.academic.most_taken_courses[0].times_repeated, None);
    assert_eq!(stats.academic.most_taken_courses[1].course_name, "99999999");
}

#[test]
fn hardest_courses_ranked_by_fail_rate() {
    let f = facet_from_bson(bson::doc! {
        "hardest": [
            { "_id": "01040031", "takers": 10i64, "graded": 10i64, "fails": 5i64, "avg_grade": 60.0, "total_repeats": 4i64 },
            { "_id": "01040166", "takers": 8i64, "graded": 8i64, "fails": 1i64, "avg_grade": 80.0, "total_repeats": 1i64 },
        ],
    });
    let stats = DashboardStats::from_facet(f, &courses_fixture());
    // 50% fail rate ranks ahead of 12.5%. fail_rate is a fraction in [0, 1].
    let top = &stats.academic.hardest_courses[0];
    assert_eq!(top.course_id, "01040031");
    assert_eq!(top.fail_rate, Some(0.5));
    assert_eq!(top.average_grade, Some(60.0));
    assert_eq!(top.count, 10); // takers
    assert_eq!(top.times_repeated, Some(4));
}

#[test]
fn gpa_distribution_buckets_mapped() {
    let f = facet_from_bson(bson::doc! {
        "gpa": [
            { "_id": 0i32, "count": 1i64 },
            { "_id": 3i32, "count": 4i64 },
            { "_id": 5i32, "count": 2i64 },
        ],
    });
    let stats = DashboardStats::from_facet(f, &HashMap::new());
    assert_eq!(stats.academic.gpa_distribution[0].value, 1);
    assert_eq!(stats.academic.gpa_distribution[3].value, 4);
    assert_eq!(stats.academic.gpa_distribution[5].value, 2);
    assert_eq!(stats.academic.gpa_distribution[5].label, "95-100");
}

#[test]
fn bank_completion_rates_sorted_ascending() {
    let f = facet_from_bson(bson::doc! {
        "bank_completion": [
            { "_id": "חובה", "total": 10i64, "completed": 9i64 },
            { "_id": "רשימה א", "total": 10i64, "completed": 2i64 },
        ],
    });
    let stats = DashboardStats::from_facet(f, &HashMap::new());
    // Lowest completion (the bottleneck) first. completion_rate is a fraction in [0, 1].
    assert_eq!(stats.academic.bank_completion[0].bank_name, "רשימה א");
    assert_eq!(stats.academic.bank_completion[0].completion_rate, 0.2);
    assert_eq!(stats.academic.bank_completion[1].completion_rate, 0.9);
}

#[test]
fn pipeline_builds_single_facet_stage() {
    let pipeline = build_pipeline(1_700_000_000_000);
    assert_eq!(pipeline.len(), 1);
    assert!(pipeline[0].contains_key("$facet"));
}

// --- Live-DB integration test (gated on the test-env pattern) --------------

/// Runs the real aggregation against the configured test database when
/// `SOGRIM_URI` is set. Skips cleanly otherwise so CI without a DB still passes.
#[tokio::test]
async fn compute_against_live_db_when_available() {
    let _ = dotenvy::dotenv();
    let Ok(uri) = std::env::var("SOGRIM_URI") else {
        eprintln!("SOGRIM_URI not set; skipping live-DB stats test");
        return;
    };
    let profile = std::env::var("SOGRIM_PROFILE").unwrap_or_else(|_| "debug".into());
    let db = Db::connect(&uri, &profile)
        .await
        .expect("connect to test DB");
    let courses = HashMap::new();
    let stats = DashboardStats::compute(&db, &courses)
        .await
        .expect("compute stats");
    // Sanity invariants that must hold for any non-corrupt collection.
    assert!(stats.overview.total_users >= 0);
    assert!(stats.overview.dau <= stats.overview.wau);
    assert!(stats.overview.wau <= stats.overview.mau);
    assert!(stats.overview.mau <= stats.overview.total_users);
    // The 3 recency buckets partition all users.
    let recency_sum = stats.activity.active + stats.activity.dormant + stats.activity.inactive;
    assert_eq!(recency_sum, stats.overview.total_users);
    assert_eq!(stats.activity.last_active_heatmap.len(), 7);
    assert_eq!(stats.academic.gpa_distribution.len(), GPA_BUCKETS.len());
    // generated_at is always populated.
    assert!(!stats.generated_at.is_empty());
}
