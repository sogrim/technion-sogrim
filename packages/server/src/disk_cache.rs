//! Disk-backed course cache with moka in-memory layer.
//!
//! The fetcher CLI writes course JSON files to disk. This module reads them.
//! Server never talks to SAP directly.
//!
//! Directory structure:
//!   {cache_dir}/{year}/{semester}/_index.json
//!   {cache_dir}/{year}/{semester}/{course_id}.json

use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use moka::future::Cache;
use serde::Serialize;

use sogrim_server::sap::{CourseDetails, CourseIndexEntry};

const CACHE_TTL_HOURS: u64 = 6;

/// A semester discovered on disk.
#[derive(Debug, Clone, Serialize)]
pub struct DiskSemester {
    pub year: String,
    pub semester: String,
    /// Human-readable name, e.g. "spring 2026"
    pub name: String,
}

/// Disk-backed course data with moka caching.
pub struct DiskCourseCache {
    cache_dir: PathBuf,
    courses: Cache<String, Arc<CourseDetails>>,
    indexes: Cache<String, Arc<Vec<CourseIndexEntry>>>,
}

impl DiskCourseCache {
    pub fn new(cache_dir: PathBuf) -> Self {
        let ttl = Duration::from_secs(CACHE_TTL_HOURS * 3600);
        Self {
            cache_dir,
            courses: Cache::builder()
                .time_to_live(ttl)
                .max_capacity(20_000)
                .build(),
            indexes: Cache::builder().time_to_live(ttl).max_capacity(20).build(),
        }
    }

    /// Discover available semesters from the cache directory.
    pub fn discover_semesters(&self) -> Vec<DiskSemester> {
        let mut semesters = Vec::new();
        let Ok(years) = fs::read_dir(&self.cache_dir) else {
            return semesters;
        };

        for year_entry in years.flatten() {
            let year_name = year_entry.file_name().to_string_lossy().to_string();
            if !year_entry.path().is_dir() || year_name.starts_with('_') {
                continue;
            }

            let Ok(sems) = fs::read_dir(year_entry.path()) else {
                continue;
            };

            for sem_entry in sems.flatten() {
                let sem_name = sem_entry.file_name().to_string_lossy().to_string();
                if !sem_entry.path().is_dir() || sem_name.starts_with('_') {
                    continue;
                }

                // Only include if _index.json exists
                if !sem_entry.path().join("_index.json").exists() {
                    continue;
                }

                let display = semester_display_name(&year_name, &sem_name);
                semesters.push(DiskSemester {
                    year: year_name.clone(),
                    semester: sem_name,
                    name: display,
                });
            }
        }

        // Sort newest first
        semesters.sort_by(|a, b| {
            let a_key = format!("{}{}", a.year, a.semester);
            let b_key = format!("{}{}", b.year, b.semester);
            b_key.cmp(&a_key)
        });

        semesters
    }

    /// Get the course index for a semester. Cached in memory with TTL.
    pub async fn get_index(
        &self,
        year: &str,
        semester: &str,
    ) -> Option<Arc<Vec<CourseIndexEntry>>> {
        let key = format!("{year}/{semester}");
        if let Some(cached) = self.indexes.get(&key).await {
            return Some(cached);
        }

        let path = self.cache_dir.join(year).join(semester).join("_index.json");
        let data = fs::read_to_string(&path).ok()?;
        let index: Vec<CourseIndexEntry> = serde_json::from_str(&data).ok()?;
        let arc = Arc::new(index);
        self.indexes.insert(key, arc.clone()).await;
        Some(arc)
    }

    /// Get course details. Checks moka cache first, falls back to disk.
    pub async fn get_course(
        &self,
        year: &str,
        semester: &str,
        course_id: &str,
    ) -> Option<Arc<CourseDetails>> {
        let key = format!("{year}/{semester}/{course_id}");
        if let Some(cached) = self.courses.get(&key).await {
            return Some(cached);
        }

        let path = self
            .cache_dir
            .join(year)
            .join(semester)
            .join(format!("{course_id}.json"));
        let data = fs::read_to_string(&path).ok()?;
        let details: CourseDetails = serde_json::from_str(&data).ok()?;
        let arc = Arc::new(details);
        self.courses.insert(key, arc.clone()).await;
        Some(arc)
    }

    /// Load all courses from all semesters on disk into memory.
    pub async fn load_all(&self) {
        let semesters = self.discover_semesters();
        let mut total = 0usize;
        for sem in &semesters {
            let sem_dir = self.cache_dir.join(&sem.year).join(&sem.semester);
            let Ok(entries) = fs::read_dir(&sem_dir) else {
                continue;
            };
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_string();
                if !name.ends_with(".json") || name.starts_with('_') {
                    continue;
                }
                let course_id = name.trim_end_matches(".json");
                let key = format!("{}/{}/{}", sem.year, sem.semester, course_id);
                if let Ok(data) = fs::read_to_string(entry.path()) {
                    if let Ok(details) = serde_json::from_str::<CourseDetails>(&data) {
                        self.courses.insert(key, Arc::new(details)).await;
                        total += 1;
                    }
                }
            }
            // Also load the index
            let _ = self.get_index(&sem.year, &sem.semester).await;
        }
        log::info!(
            target: "sogrim_server",
            "Loaded {} courses from {} semesters into memory",
            total,
            semesters.len()
        );
    }
}

fn semester_display_name(year: &str, semester: &str) -> String {
    let y: i32 = year.parse().unwrap_or(0);
    match semester {
        "200" => format!("winter {}-{}", y, y + 1),
        "201" => format!("spring {}", y + 1),
        "202" => format!("summer {}", y + 1),
        "208" => format!("yearly {}-{}", y, y + 1),
        other => format!("{year}/{other}"),
    }
}
