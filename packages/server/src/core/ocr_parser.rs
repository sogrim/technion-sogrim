use lazy_static::lazy_static;
use regex::Regex;
use std::io::Write;
use std::process::Command;

use crate::{
    error::AppError,
    resources::course::{Course, CourseStatus, Grade},
};

lazy_static! {
    static ref COURSE_ID_RE: Regex = Regex::new(r"\d+").unwrap();
    static ref CREDIT_RE: Regex = Regex::new(r"(\d{1,2}\.\d)").unwrap();
    static ref SEMESTER_LINE_RE: Regex =
        Regex::new(r#"תשפ"([א-ת])"#).unwrap();
    static ref GRADE_WORD_RE: Regex =
        Regex::new(r"(פטור ללא ניקוד|פטור עם ניקוד|פטור|עובר|נכשל|לא השלים)").unwrap();
}

/// Main entry point: takes raw PDF bytes, returns parsed course statuses.
pub fn parse_pdf_ocr(pdf_bytes: &[u8]) -> Result<Vec<CourseStatus>, AppError> {
    let pages = render_pdf_pages(pdf_bytes)?;
    if pages.is_empty() {
        return Err(AppError::Parser("PDF has no pages".into()));
    }

    // OCR all pages and combine the text, since table columns span across pages
    let mut combined_text = String::new();
    for page_png in &pages {
        let ocr_text = ocr_image(page_png, 3)?;
        combined_text.push_str(&ocr_text);
        combined_text.push('\n');
    }

    let mut semester_counter: f32 = 0.0;
    let mut last_season = String::new();
    let all_courses = parse_psm3_page(&combined_text, &mut semester_counter, &mut last_season)?;

    if all_courses.is_empty() {
        return Err(AppError::Parser(
            "No courses found in PDF. Make sure the PDF is a Technion grades transcript.".into(),
        ));
    }

    Ok(all_courses)
}

/// Render all pages of a PDF to PNG images at 300 DPI using pdftoppm (from Poppler).
fn render_pdf_pages(pdf_bytes: &[u8]) -> Result<Vec<Vec<u8>>, AppError> {
    let tmp_dir = tempfile::tempdir()
        .map_err(|e| AppError::Parser(format!("Failed to create temp dir: {e}")))?;

    // Write PDF to a temp file
    let pdf_path = tmp_dir.path().join("input.pdf");
    std::fs::write(&pdf_path, pdf_bytes)
        .map_err(|e| AppError::Parser(format!("Failed to write temp PDF: {e}")))?;

    let pdftoppm_bin = find_pdftoppm()?;
    let output_prefix = tmp_dir.path().join("page");

    let output = Command::new(&pdftoppm_bin)
        .arg("-png")
        .arg("-r")
        .arg("300")
        .arg(pdf_path.to_str().unwrap_or(""))
        .arg(output_prefix.to_str().unwrap_or(""))
        .output()
        .map_err(|e| {
            AppError::Parser(format!(
                "Failed to run pdftoppm: {e}. Make sure Poppler utils are installed."
            ))
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Parser(format!("pdftoppm failed: {stderr}")));
    }

    // Collect all generated PNG files sorted by name
    let mut png_files: Vec<_> = std::fs::read_dir(tmp_dir.path())
        .map_err(|e| AppError::Parser(format!("Failed to read temp dir: {e}")))?
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry
                .path()
                .extension()
                .map(|ext| ext == "png")
                .unwrap_or(false)
        })
        .collect();

    png_files.sort_by_key(|e| e.file_name());

    let mut pages = Vec::new();
    for entry in png_files {
        let data = std::fs::read(entry.path())
            .map_err(|e| AppError::Parser(format!("Failed to read page image: {e}")))?;
        pages.push(data);
    }

    Ok(pages)
}

fn find_pdftoppm() -> Result<String, AppError> {
    // Check PATH first
    if Command::new("pdftoppm")
        .arg("-v")
        .output()
        .map(|o| o.status.success() || !o.stderr.is_empty())
        .unwrap_or(false)
    {
        return Ok("pdftoppm".to_string());
    }
    // Check user-level poppler install (common on Windows)
    let user_home = dirs_or_home();
    let user_paths = [
        user_home.join("poppler").join("poppler-24.08.0").join("Library").join("bin").join("pdftoppm.exe"),
        user_home.join("poppler").join("Library").join("bin").join("pdftoppm.exe"),
    ];
    for p in &user_paths {
        if p.exists() {
            return Ok(p.to_string_lossy().to_string());
        }
    }
    // Check common install locations
    let standard_paths = [
        r"C:\Program Files\poppler\Library\bin\pdftoppm.exe",
        r"C:\Program Files (x86)\poppler\Library\bin\pdftoppm.exe",
    ];
    for p in &standard_paths {
        if std::path::Path::new(p).exists() {
            return Ok(p.to_string());
        }
    }
    Err(AppError::Parser(
        "pdftoppm (Poppler) not found. Install Poppler utils and ensure pdftoppm is in PATH or standard location.".into(),
    ))
}

/// Run Tesseract OCR on a PNG image, return the recognized text.
fn ocr_image(png_data: &[u8], psm: u8) -> Result<String, AppError> {
    let mut tmp = tempfile::NamedTempFile::new()
        .map_err(|e| AppError::Parser(format!("Failed to create temp file: {e}")))?;
    tmp.write_all(png_data)
        .map_err(|e| AppError::Parser(format!("Failed to write temp file: {e}")))?;
    let tmp_path = tmp.path().to_path_buf();

    // Look for tesseract in standard install location and PATH
    let tesseract_bin = find_tesseract()?;

    let mut cmd = Command::new(&tesseract_bin);
    cmd.arg(tmp_path.to_str().unwrap_or(""))
        .arg("stdout")
        .arg("-l")
        .arg("heb+eng")
        .arg("--psm")
        .arg(psm.to_string());

    // Set TESSDATA_PREFIX if the user-level tessdata directory exists
    let user_tessdata = dirs_or_home().join(".tessdata");
    if user_tessdata.exists() {
        cmd.env("TESSDATA_PREFIX", &user_tessdata);
    }

    let output = cmd
        .output()
        .map_err(|e| AppError::Parser(format!("Failed to run tesseract: {e}. Make sure Tesseract OCR is installed.")))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::Parser(format!(
            "Tesseract failed: {stderr}"
        )));
    }

    let text = String::from_utf8_lossy(&output.stdout).to_string();
    Ok(text)
}

fn find_tesseract() -> Result<String, AppError> {
    // Check PATH first
    if Command::new("tesseract")
        .arg("--version")
        .output()
        .is_ok()
    {
        return Ok("tesseract".to_string());
    }
    // Check standard Windows install location
    let standard_path = r"C:\Program Files\Tesseract-OCR\tesseract.exe";
    if std::path::Path::new(standard_path).exists() {
        return Ok(standard_path.to_string());
    }
    Err(AppError::Parser(
        "Tesseract OCR not found. Install from https://github.com/UB-Mannheim/tesseract/wiki".into(),
    ))
}

fn dirs_or_home() -> std::path::PathBuf {
    std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|_| std::path::PathBuf::from("."))
}

/// Parse combined OCR output (all pages merged).
/// PSM 3 separates the table into columns, producing sections for:
///   1. Course IDs (8-digit numbers)
///   2. Course name + credits + grade (after "ניקוד ציון" header)
///   3. Semester info (lines containing תשפ"X)
fn parse_psm3_page(
    text: &str,
    _semester_counter: &mut f32,
    _last_season: &mut String,
) -> Result<Vec<CourseStatus>, AppError> {
    // Strip Unicode directional markers that Tesseract emits for bidi text
    let clean = text
        .replace('\u{200e}', "")
        .replace('\u{200f}', "")
        .replace('\u{200b}', "");

    // Extract all 8-digit course IDs from the text
    let course_ids: Vec<String> = COURSE_ID_RE
        .find_iter(&clean)
        .filter(|m| m.as_str().len() == 8)
        .map(|m| m.as_str().to_string())
        .collect();

    // Extract data lines (course name + credit + grade) from after "ניקוד ציון"
    let raw_data = extract_data_lines(&clean);

    // Extract semester lines from the entire text
    let raw_semesters = extract_semester_lines(&clean);

    // Match first N semesters to course IDs by index
    let n = course_ids.len();
    let parsed_semesters: Vec<(String, char)> = raw_semesters
        .iter()
        .take(n)
        .map(|s| parse_raw_semester(s))
        .collect();

    // Build a map from (season, year_letter) -> "season_counter" string
    let semester_map = build_semester_map(&parsed_semesters);

    let mut courses = Vec::new();
    for i in 0..n {
        let id = &course_ids[i];
        let (name, credit, grade) = raw_data
            .get(i)
            .cloned()
            .unwrap_or_else(|| (String::new(), 0.0, None));

        let semester = parsed_semesters
            .get(i)
            .and_then(|(season, year)| semester_map.get(&(season.clone(), *year)).cloned());

        let mut course_status = CourseStatus {
            course: Course {
                id: id.clone(),
                credit,
                name,
                tags: None,
            },
            semester,
            grade,
            ..Default::default()
        };
        course_status.set_state();
        courses.push(course_status);
    }

    Ok(courses)
}

/// Extract data lines from after the first "ניקוד ציון" marker.
/// Data lines are those containing credits/grades but NOT semester info.
fn extract_data_lines(text: &str) -> Vec<(String, f32, Option<Grade>)> {
    let data_marker = "ניקוד ציון";
    let start = match text.find(data_marker) {
        Some(p) => p + data_marker.len(),
        None => return Vec::new(),
    };

    let section = &text[start..];
    let mut results = Vec::new();

    for line in section.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        // Stop at semester lines - they come after the data section
        if is_semester_line(line) {
            break;
        }
        // Skip header/footer junk
        if is_junk_line(line) {
            continue;
        }

        // Check if line has grade or credit data
        let has_grade = GRADE_WORD_RE.is_match(line)
            || line
                .split_whitespace()
                .any(|w| w.parse::<u32>().map(|n| n <= 100).unwrap_or(false));
        let has_credit = CREDIT_RE.is_match(line);

        if !has_grade && !has_credit {
            // Might be a continuation of a multi-line course name
            if let Some(last) = results.last_mut() {
                let (ref mut name, _, _): &mut (String, f32, Option<Grade>) = last;
                name.push(' ');
                name.push_str(line);
            }
            continue;
        }

        let (name, credit, grade) = parse_data_line(line);
        results.push((name, credit, grade));
    }

    results
}

/// Check if a line is a semester line (contains Hebrew year marker).
fn is_semester_line(line: &str) -> bool {
    SEMESTER_LINE_RE.is_match(line)
}

/// Check if a line is junk (header, footer, boilerplate).
fn is_junk_line(line: &str) -> bool {
    let junk_markers = [
        "גיליון ציונים", "סוף", "סולם ציונים", "ציון מעבר",
        "(E)", "הקורס ניתן", "הנני מאשר", "מזכיר", "הטכניון",
        "מכון טכנולוגי", "Technion", "Institute", "Undergraduate",
        "לתואר", "בפקולטה", "וצברה", "תעודת ציונים", "הלומד",
        "לימודי הסמכה", "חתום דיגיטלית", "חיפה,", "עמוד",
        "Brien", "mete)", "alo)",
    ];
    junk_markers.iter().any(|m| line.contains(m))
}

/// Extract all semester lines from the entire text.
/// A semester line is any line containing תשפ"X (Hebrew year marker).
fn extract_semester_lines(text: &str) -> Vec<String> {
    text.lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty() && is_semester_line(l))
        .map(|l| l.to_string())
        .collect()
}

/// Parse a raw semester line to extract (season, year_letter).
/// Handles OCR garbling of season names and WAN/IAN prefixes.
fn parse_raw_semester(raw: &str) -> (String, char) {
    // Extract year letter from תשפ"X
    let year_letter = SEMESTER_LINE_RE
        .captures(raw)
        .and_then(|c| c.get(1))
        .and_then(|m| m.as_str().chars().next())
        .unwrap_or('ה');

    // Determine season from keywords
    let season = if raw.contains("קיץ") {
        "קיץ"
    } else if raw.contains("אביב")
        || raw.contains("ביב")   // catches אצאביב, שצשביב, האהאביב etc.
    {
        "אביב"
    } else {
        // Default to winter: covers "חורף", WAN, IAN, and other garbled patterns
        "חורף"
    };

    (season.to_string(), year_letter)
}

/// Build a map from (season, year_letter) -> "season_counter" string.
/// Semesters are sorted chronologically, then counters are assigned
/// following the convention: +1.0 for חורף/אביב, +0.5 for קיץ.
fn build_semester_map(
    semesters: &[(String, char)],
) -> std::collections::HashMap<(String, char), String> {
    use std::collections::{BTreeSet, HashMap};

    // Hebrew letter to numeric value for sorting
    fn year_num(c: char) -> u32 {
        match c {
            'א' => 1, 'ב' => 2, 'ג' => 3, 'ד' => 4,
            'ה' => 5, 'ו' => 6, 'ז' => 7, 'ח' => 8,
            'ט' => 9, 'י' => 10,
            _ => 0,
        }
    }
    fn season_offset(s: &str) -> u32 {
        match s {
            "חורף" => 0,
            "אביב" => 1,
            "קיץ" => 2,
            _ => 0,
        }
    }

    // Collect unique (season, year) pairs with sort keys
    let mut unique: BTreeSet<(u32, String, char)> = BTreeSet::new();
    for (season, year) in semesters {
        let key = year_num(*year) * 3 + season_offset(season);
        unique.insert((key, season.clone(), *year));
    }

    // Assign counters chronologically
    let mut map = HashMap::new();
    let mut counter: f32 = 0.0;
    for (_key, season, year) in &unique {
        if season == "קיץ" {
            counter += 0.5;
        } else {
            counter += 1.0;
        }
        // Format counter without trailing zeros for integers
        let counter_str = if counter.fract() == 0.0 {
            format!("{}", counter as u32)
        } else {
            format!("{}", counter)
        };
        map.insert(
            (season.clone(), *year),
            format!("{}_{}", season, counter_str),
        );
    }

    map
}
fn parse_data_line(line: &str) -> (String, f32, Option<Grade>) {
    let mut remaining = line.to_string();
    let mut grade: Option<Grade> = None;
    let mut credit: f32 = 0.0;

    // 1. Extract Hebrew grade words first
    if let Some(m) = GRADE_WORD_RE.find(&remaining) {
        let grade_str = m.as_str();
        grade = match grade_str {
            "פטור ללא ניקוד" => Some(Grade::ExemptionWithoutCredit),
            "פטור עם ניקוד" => Some(Grade::ExemptionWithCredit),
            "פטור" => Some(Grade::ExemptionWithCredit), // short form
            "עובר" => Some(Grade::Binary(true)),
            "נכשל" => Some(Grade::Binary(false)),
            "לא השלים" => Some(Grade::NotComplete),
            _ => None,
        };
        remaining = remaining.replace(grade_str, "").trim().to_string();
    }

    // 2. Extract credit (decimal number like X.X)
    if let Some(m) = CREDIT_RE.find(&remaining) {
        if let Ok(c) = m.as_str().parse::<f32>() {
            credit = c;
            remaining = format!(
                "{}{}",
                &remaining[..m.start()],
                &remaining[m.end()..]
            )
            .trim()
            .to_string();
        }
    }

    // 3. If no grade found yet, look for numeric grade at the end
    if grade.is_none() {
        // Get trailing numbers from the remaining text
        let words: Vec<&str> = remaining.split_whitespace().collect();
        if let Some(last) = words.last() {
            if let Ok(n) = last.parse::<u32>() {
                if n <= 100 {
                    grade = Some(Grade::Numeric(n));
                    remaining = words[..words.len() - 1].join(" ");
                }
            }
        }
    }

    // 4. If no credit found, try to find an integer credit at the end of remaining
    if credit == 0.0 {
        let words: Vec<&str> = remaining.split_whitespace().collect();
        if let Some(last) = words.last() {
            if let Ok(n) = last.parse::<f32>() {
                if n > 0.0 && n <= 10.0 {
                    credit = n;
                    remaining = words[..words.len() - 1].join(" ");
                }
            }
        }
    }

    // 5. Clean up the course name
    let name = clean_course_name(&remaining);

    (name, credit, grade)
}

/// Clean up OCR artifacts from course names.
fn clean_course_name(name: &str) -> String {
    let name = name.trim();
    // Remove common OCR garbage prefixes (single digits, garbled text)
    let name = name
        .trim_start_matches(|c: char| c.is_ascii_digit() || c == ' ')
        .trim();
    // Remove non-Hebrew/non-ASCII garbage but keep Hebrew, digits, hyphens, spaces, quotes, parentheses
    let cleaned: String = name
        .chars()
        .filter(|c| {
            c.is_alphabetic()
                || c.is_ascii_digit()
                || *c == ' '
                || *c == '-'
                || *c == '\''
                || *c == '"'
                || *c == '('
                || *c == ')'
                || *c == '.'
                || *c == ':'
        })
        .collect();

    // Collapse multiple spaces
    cleaned
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
        .trim()
        .to_string()
}

#[cfg(test)]
#[path = "ocr_parser_tests.rs"]
mod ocr_parser_tests;
