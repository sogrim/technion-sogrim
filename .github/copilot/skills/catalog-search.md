# Technion Catalog Search & Batch Extraction

Search the internet for a Technion faculty catalog PDF, discover all degree tracks within it, extract each track into a JSON catalog, and validate the results — all orchestrated automatically.

## When to Use

Use this skill when asked to:
- Find and extract a Technion catalog (e.g., "Computer Science 2024-2025")
- Extract **all tracks** from a faculty catalog
- Batch-process a catalog into multiple JSON files

This skill **orchestrates** the other two skills:
- **catalog-extractor** — extracts a single track into JSON
- **catalog-validation** — validates a JSON catalog against the source PDF

## Step 1: Find the Catalog PDF URL

Given a faculty name and academic year (e.g., "Computer Science 2024-2025"), search the web to find the official Technion catalog PDF.

### Search Strategy

1. **Use web search** with queries like:
   - `Technion <faculty> undergraduate catalog <year> site:technion.ac.il filetype:pdf`
   - `טכניון הפקולטה ל<faculty-hebrew> תוכנית לימודים <hebrew-year> site:technion.ac.il`
   - `undergraduate.cs.technion.ac.il catalog <year> pdf`

2. **Known URL patterns** (try these first before searching):

   | Faculty | Base URL |
   |---|---|
   | Computer Science | `https://undergraduate.cs.technion.ac.il/` |

   The CS catalog PDF is usually found under `wp-content/uploads/` on the CS undergraduate site. The filename often contains the Hebrew academic year (e.g., תשפ"ה for 2024-2025).

3. **Hebrew year mapping** (useful for URL matching):

   | Academic Year | Hebrew Year | Hebrew Abbreviation |
   |---|---|---|
   | 2023-2024 | תשפ"ד | תשפד |
   | 2024-2025 | תשפ"ה | תשפה |
   | 2025-2026 | תשפ"ו | תשפו |
   | 2026-2027 | תשפ"ז | תשפז |

4. **Fallback**: If web search doesn't find a direct PDF link, search for the faculty's undergraduate page and browse for a "תוכנית לימודים" (study program) or "קטלוג" (catalog) link.

5. **Verify the URL**: Confirm the URL ends in `.pdf` and is accessible. Download a small portion to verify it's a valid PDF.

### Example

For "Computer Science 2024-2025":
- Search: `Technion Computer Science undergraduate catalog 2024-2025 site:technion.ac.il filetype:pdf`
- Expected result: `https://undergraduate.cs.technion.ac.il/wp-content/uploads/2024/12/23-הפקולטה-למדעי-המחשב-תשפ״ה-.pdf` (URL-encoded)

## Step 2: Extract PDF and Discover Tracks

Once you have the PDF URL:

1. **Install dependencies** (if not already):
   ```bash
   cd packages/catalog-extractor
   pip install -r requirements.txt
   ```

2. **Extract the raw text**:
   ```bash
   python extract_pdf.py "<pdf_url>" --output raw_text.txt
   ```

3. **Read the extracted text** and identify all degree tracks/programs in the PDF. Look for section headers that indicate different tracks:

### Known CS Faculty Tracks

| Track (Hebrew) | Track (English) | File Name Pattern | Faculty |
|---|---|---|---|
| מדמח תלת שנתי | CS 3-year | `ComputerScience3years{year}.json` | `ComputerScience` |
| מדמח ארבע שנתי | CS 4-year | `ComputerScience4years{year}.json` | `ComputerScience` |
| הנדסת תוכנה | Software Engineering | `ComputerScienceSoftwareEngineerCourse{year}.json` | `ComputerScience` |
| מדע הנתונים והנדסת החלטות | Data Science & Decision Engineering | `ComputerScienceDataScienceAndEngineering{year}.json` | `DataAndDecisionScience` |

### How to Identify Tracks in the PDF

- Look for **"סה"כ נ.ז"** (total credits) markers — each track has its own total
- Look for **track names** in headers: "תלת שנתי", "ארבע שנתי", "הנדסת תוכנה", "מדע נתונים"
- Look for **credit totals** that distinguish tracks:
  - 3-year CS: ~120 credits
  - 4-year CS: ~160 credits
  - Software Engineering: ~159.5 credits
  - Data Science: varies

- Present the discovered tracks to the user and confirm which ones to extract (or extract all).

## Step 3: Extract Each Track (invoke catalog-extractor)

For **each track** found in Step 2, invoke the **catalog-extractor** skill:

1. **Determine the track parameters**:
   - `name`: Hebrew catalog name (e.g., `"מדמח תלת שנתי 2024-2025"`)
   - `output`: File path following the naming convention: `packages/docs/{Faculty}{Track}{Year}.json`
   - `reference`: Use the most recent existing catalog of the same track as a reference (if available in `packages/docs/`)

2. **Run the extraction pipeline**:
   ```bash
   cd packages/catalog-extractor
   python main.py "<pdf_url>" \
     --name "<hebrew_name>" \
     --reference ../docs/<ReferenceFile>.json \
     --output ../docs/<OutputFile>.json \
     --save-text raw_text_<track>.txt \
     --save-sections sections_<track>.json
   ```

3. **Refine the output**: The extraction pipeline produces a skeleton. Use the catalog-extractor skill's guidelines to fill in:
   - `total_credit`
   - Bank `credit` values
   - `credit_overflows` (follow patterns for track type)
   - Complex rules (Chains, SpecializationGroups)
   - `catalog_replacements` and `common_replacements`

### Reference File Selection

When extracting a track, use the most recent existing catalog of the **same track type** as a reference:

| Track | Look for reference in `packages/docs/` |
|---|---|
| 3-year CS | `ComputerScience3years*.json` (most recent year) |
| 4-year CS | `ComputerScience4years*.json` (most recent year) |
| Software Engineering | `ComputerScienceSoftwareEngineerCourse*.json` (most recent year) |
| Data Science | `ComputerScienceDataScienceAndEngineering*.json` (most recent year, if exists) |

If no reference exists for a track, omit `--reference` and build from scratch using the raw text.

## Step 4: Validate Each Track (invoke catalog-validator)

For **each extracted catalog**, invoke the **catalog-validation** skill:

1. **Install dependencies** (if not already):
   ```bash
   cd packages/catalog-validation
   pip install -r requirements.txt
   ```

2. **Run full validation**:
   ```bash
   cd packages/catalog-validation
   python validate_all.py ../docs/<CatalogFile>.json "<pdf_url>" --verbose
   ```

3. **Review findings**:
   - **ERRORs**: Must be fixed. Go back and correct the JSON.
   - **WARNINGs**: Review manually. Some may be false positives (e.g., courses in a different section of the PDF).
   - **OK**: Check passed.

4. **Fix and re-validate**: If there are errors:
   - Edit the JSON file to fix the issues
   - Re-run validation
   - Repeat until 0 errors

5. **Cross-check between tracks**: After all tracks are validated individually, do a quick sanity check:
   - חובה (mandatory) courses for 3-year should be a subset of 4-year (4-year has more requirements)
   - Common replacements should be consistent across tracks of the same year
   - Credit overflows should follow the standard patterns for each track type

## Step 5: Summary Report

After processing all tracks, produce a summary:

```
## Catalog Extraction Summary

Faculty: Computer Science
Year: 2024-2025
Source PDF: <url>

| Track | Output File | Total Credits | Status | Errors | Warnings |
|---|---|---|---|---|---|
| 3-year | ComputerScience3years2024-2025.json | 120 | ✅ Valid | 0 | 2 |
| 4-year | ComputerScience4years2024-2025.json | 160 | ✅ Valid | 0 | 1 |
| Software Eng | ComputerScienceSoftwareEngineerCourse2024-2025.json | 159.5 | ✅ Valid | 0 | 3 |
| Data Science | ComputerScienceDataScienceAndEngineering2024-2025.json | 145 | ⚠️ 1 Warning | 0 | 1 |
```

## Error Handling

- **PDF not found**: Report that the catalog could not be found. Suggest the user provide the URL directly.
- **Track not recognized**: If a track section doesn't match known patterns, ask the user whether to attempt extraction.
- **Extraction failures**: If a track fails extraction, skip it and continue with others. Report the failure in the summary.
- **Validation failures**: If errors persist after 2 fix attempts, flag the track for manual review and move on.

## Full Example

User: "Extract all Computer Science catalogs for 2024-2025"

1. Search web → find `https://undergraduate.cs.technion.ac.il/wp-content/uploads/2024/12/23-הפקולטה-למדעי-המחשב-תשפ״ה-.pdf`
2. Extract PDF text → discover tracks: 3-year, 4-year, Software Engineering, Data Science
3. For each track:
   a. Run catalog-extractor pipeline with appropriate reference
   b. Refine the skeleton JSON
   c. Run catalog-validator
   d. Fix any errors, re-validate
4. Output summary table with all results
