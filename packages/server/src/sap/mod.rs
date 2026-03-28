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
    pub id: String,
    pub name: String,
    pub credits: f32,
    pub faculty: Option<String>,
    pub syllabus: Option<String>,
    pub academic_level: Option<String>,
    pub semester_note: Option<String>,
    pub exams: Vec<Exam>,
    pub relations: Vec<Relation>,
    pub prerequisites: Vec<PrereqToken>,
    pub corequisites: Vec<String>,
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
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Relation {
    pub course_id: String,
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
    pub events: Vec<ScheduleEvent>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScheduleEvent {
    /// e.g. "הרצאה", "תרגול", "מעבדה"
    pub kind: String,
    /// Day of week: 0=Sunday, 1=Monday, ..., 4=Thursday
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
    schedule_summary: Option<String>,
    room_text: Option<String>,
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
    pub id: String,
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
    course_ids: Cache<String, Arc<Vec<String>>>,
    course_index: Cache<String, Arc<Vec<CourseIndexEntry>>>,
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
        let chunks: Vec<Vec<String>> = ids.chunks(BATCH_SIZE).map(|c| c.to_vec()).collect();

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
                        match client.assemble_course(
                            &detail_results[i],
                            &sched_persons_results[i],
                            &sched_times_results[i],
                        ) {
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
        let chunks: Vec<Vec<String>> = ids.chunks(BATCH_SIZE).map(|c| c.to_vec()).collect();

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
                        ) {
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
    ) -> Result<Arc<Vec<String>>, SapError> {
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

    async fn fetch_course_ids(&self, year: &str, semester: &str) -> Result<Vec<String>, SapError> {
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
        self.assemble_course(&detail_val, &sched_persons_val, &sched_times_val)
    }

    /// Assemble a `CourseDetails` from pre-fetched detail + schedule (persons) + schedule (times).
    fn assemble_course(
        &self,
        detail_val: &Value,
        sched_persons_val: &Value,
        sched_times_val: &Value,
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

        let exams = Self::dedup_exams(Self::nested_results(&raw, "Exams"));
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

        let schedule = Self::parse_schedule(sched_persons_val, sched_times_val)?;

        Ok(CourseDetails {
            id: sap_id_to_course_number(&course.otjid),
            name: course.name.trim().to_string(),
            credits,
            faculty: course.org_text.filter(|s| !s.is_empty()),
            syllabus: course.study_content_description.filter(|s| !s.is_empty()),
            academic_level: course.zz_academic_level_text.filter(|s| !s.is_empty()),
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
    fn parse_schedule(
        persons_val: &Value,
        times_val: &Value,
    ) -> Result<Vec<ScheduleGroup>, SapError> {
        let persons_groups = Self::extract_results(persons_val.clone())?;
        let times_groups = Self::extract_results(times_val.clone())?;

        type ScheduleTime = (Option<u8>, Option<String>, Option<String>);
        let mut time_map: HashMap<String, ScheduleTime> = HashMap::new();
        for tg in &times_groups {
            for ev in Self::nested_results(tg, "EObjectSet") {
                if let Ok(te) = serde_json::from_value::<RawEObjectTimes>(ev) {
                    let time_info = extract_schedule_time(&te.schedule);
                    time_map.insert(te.otjid, time_info);
                }
            }
        }

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

            let events_raw = Self::nested_results(&gv, "EObjectSet");
            let mut events = Vec::new();

            for ev in events_raw {
                let e: RawEObject = match serde_json::from_value(ev) {
                    Ok(e) => e,
                    Err(_) => continue,
                };

                let (day, start_time, end_time) = time_map
                    .get(&e.otjid)
                    .cloned()
                    .unwrap_or((None, None, None));

                let (building, room) = e
                    .room_text
                    .as_deref()
                    .filter(|r| !r.is_empty())
                    .map(resolve_room)
                    .unwrap_or((None, None));

                events.push(ScheduleEvent {
                    kind: e.category_text,
                    day,
                    start_time,
                    end_time,
                    schedule_text: e.schedule_summary.unwrap_or_default(),
                    building,
                    room,
                    lecturer: format_person(&e.persons.results),
                });
            }

            groups.push(ScheduleGroup {
                group: group_number,
                events,
            });
        }

        Ok(groups)
    }

    fn detail_query(year: &str, semester: &str, sap_id: &str) -> String {
        let filter = format!(
            "Peryr%20eq%20%27{year}%27%20and%20Perid%20eq%20%27{semester}%27\
             %20and%20Otjid%20eq%20%27{sap_id}%27"
        );
        let select = "Otjid,Points,Name,StudyContentDescription,OrgText,\
                       ZzAcademicLevel,ZzAcademicLevelText,ZzSemesterNote,\
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
    fn schedule_query_persons(year: &str, semester: &str, sap_id: &str) -> String {
        format!(
            "{}&$expand=EObjectSet,EObjectSet/Persons",
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

    fn dedup_exams(raw_exams: Vec<Value>) -> Vec<Exam> {
        let mut seen = HashSet::new();
        let mut result = Vec::new();
        for v in raw_exams {
            let e: RawExam = match serde_json::from_value(v) {
                Ok(e) => e,
                Err(_) => continue,
            };
            let date = e.exam_date.as_deref().and_then(parse_sap_date_str);
            let begin = e.exam_beg_time.as_deref().and_then(parse_sap_time);
            let end = e.exam_end_time.as_deref().and_then(parse_sap_time);
            let key = (e.category_code.clone(), date.clone());
            if seen.insert(key) {
                result.push(Exam {
                    category: e.category,
                    category_code: e.category_code,
                    date,
                    begin_time: begin,
                    end_time: end,
                });
            }
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

/// Extract structured day/time from EventScheduleSet entries.
/// Returns (day_of_week, start_time, end_time) from the first entry.
fn extract_schedule_time(
    entries: &RawScheduleEntries,
) -> (Option<u8>, Option<String>, Option<String>) {
    let Some(first) = entries.results.first() else {
        return (None, None, None);
    };

    let day = first.evdat.as_deref().and_then(|d| {
        let secs = parse_sap_date_epoch(d)?;
        let dt = chrono::DateTime::from_timestamp(secs, 0)?;
        // chrono: Mon=0 .. Sun=6. We want Sun=0, Mon=1, ..., Thu=4
        let weekday = dt.weekday().num_days_from_sunday() as u8;
        if weekday <= 4 {
            Some(weekday)
        } else {
            None
        }
    });

    let start_time = first.beguz.as_deref().and_then(parse_sap_time);
    let end_time = first.enduz.as_deref().and_then(parse_sap_time);

    (day, start_time, end_time)
}

/// Resolve room text like "069-0001" into (building_name, room_number).
fn resolve_room(room_text: &str) -> (Option<String>, Option<String>) {
    // Room text format: "BBB-RRRR" where BBB = building code, RRRR = room number
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

    let building_name = match building_code {
        "014" => Some("טאוב"),
        "032" => Some("אמדו"),
        "034" => Some("זיסאפל"),
        "037" => Some("ליידי דייוס"),
        "044" => Some("פישבך"),
        "054" => Some("אולמן"),
        "058" => Some("סגו"),
        "069" => Some("דן קהאן"),
        "079" => Some("הנדסת חמרים"),
        "084" => Some("מדעי המחשב"),
        "093" => Some("בורוביץ הנדסה אזרחית"),
        "095" => Some("הנ' אוירונאוטית"),
        "102" => Some("פקולטה לרפואה"),
        "103" => Some("ננו-אלקטרוניקה"),
        "120" => Some("ספורט"),
        _ => None,
    };

    (
        building_name.map(|s| s.to_string()),
        Some(room_num.to_string()),
    )
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
/// "מקצוע צמוד: 104031" or "מקצועות צמודים: 104031, 104166"
fn parse_corequisites(note: &str) -> Vec<String> {
    let re = Regex::new(r"מקצועו?ת? צמודי?ם?:\s*(.+)").unwrap();
    let Some(caps) = re.captures(note) else {
        return vec![];
    };
    let content = caps.get(1).unwrap().as_str();
    let num_re = Regex::new(r"\d{5,8}").unwrap();
    num_re
        .find_iter(content)
        .map(|m| {
            let n = m.as_str();
            if n.len() <= 6 {
                to_new_course_number(&format!("{n:0>6}"))
            } else {
                n.to_string()
            }
        })
        .collect()
}

/// Convert a 6-digit Technion course number to the SAP `SM` ID format.
pub fn course_number_to_sap_id(number: &str) -> String {
    let padded = format!("{number:0>6}");
    // Special case: 9730XX → 970300XX
    if let Some(suffix) = padded.strip_prefix("9730") {
        return format!("SM970300{suffix}");
    }
    format!("SM0{}0{}", &padded[..3], &padded[3..])
}

/// Extract the 6-digit course number from a SAP ID.
pub fn sap_id_to_course_number(sap_id: &str) -> String {
    let digits = sap_id.trim_start_matches("SM");
    if digits.len() == 8 {
        // Check for 970300XX → 9730XX
        if let Some(suffix) = digits.strip_prefix("970300") {
            return format!("9730{suffix}");
        }
        format!("{}{}", &digits[1..4], &digits[5..8])
    } else {
        digits.to_string()
    }
}

/// Normalize old course numbers to the new 8-digit format (used for corequisites).
fn to_new_course_number(course: &str) -> String {
    if course.starts_with("9730") && course.len() == 6 {
        return format!("970300{}", &course[4..]);
    }
    course.to_string()
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
        assert_eq!(course_number_to_sap_id("234114"), "SM02340114");
        assert_eq!(course_number_to_sap_id("104031"), "SM01040031");
        assert_eq!(course_number_to_sap_id("973012"), "SM97030012");
        assert_eq!(sap_id_to_course_number("SM02340114"), "234114");
        assert_eq!(sap_id_to_course_number("SM97030012"), "973012");
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
        assert_eq!(parse_corequisites("מקצוע צמוד: 104031"), vec!["104031"]);
        assert_eq!(
            parse_corequisites("מקצועות צמודים: 104031, 104166"),
            vec!["104031", "104166"]
        );
        assert_eq!(parse_corequisites("no coreqs here"), Vec::<String>::new());
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
        // IDs should be 6-digit course numbers, not SAP format
        assert!(ids.iter().all(|id| !id.starts_with("SM")));
    }

    #[tokio::test]
    #[ignore]
    async fn test_cached_course_details() {
        let c = client();

        // First fetch — hits SAP
        let d1 = c.get_course_details("2025", "200", "234114").await.unwrap();
        assert_eq!(d1.name, "מבוא למדעי המחשב מ'");
        assert_eq!(d1.id, "234114");
        assert!(d1.credits > 0.0);
        assert!(!d1.exams.is_empty());
        assert!(d1.exams.len() < 10); // deduped
        assert!(!d1.relations.is_empty());
        assert!(!d1.schedule.is_empty());
        assert!(!d1.offered_periods.is_empty());

        // Second fetch — should be instant (cached)
        let d2 = c.get_course_details("2025", "200", "234114").await.unwrap();
        assert!(Arc::ptr_eq(&d1, &d2)); // same Arc = same cache entry

        // Verify JSON serialization works
        let json = serde_json::to_string_pretty(&*d1).unwrap();
        assert!(json.contains("234114"));
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
