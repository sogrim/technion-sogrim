---
name: catalog-search
description: "Search for a Technion faculty catalog PDF, discover all degree tracks, extract each into JSON, and validate. Use when asked to find, search for, or batch-extract Technion catalogs."
---

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

**IMPORTANT — Unbiased validation**: Validation must run in a **separate, fresh conversation** (new thread / new Copilot chat) with no history from the extraction phase. This ensures the validator independently checks the JSON against the PDF without being influenced by extraction decisions, assumptions, or shortcuts.

## Step 1: Find the Catalog PDF URL

Given a faculty name and academic year (e.g., "Computer Science 2024-2025"), search the web to find the official Technion catalog PDF.

### Search Strategy

**All searches MUST be conducted in Hebrew and scoped to `site:technion.ac.il`.** English queries return wrong results. Follow this order strictly:

#### Strategy A: Direct site browsing (try first)

1. Navigate to the faculty's known undergraduate website (see table below).
2. Use `web_fetch` to load the page and look for links containing "קטלוג" or "תוכנית לימודים" or PDF links.
3. The catalog PDF is usually linked from the main undergraduate page or a "תוכניות לימודים" sub-page.

   | Faculty | Undergraduate Site |
   |---|---|
   | Computer Science | `https://undergraduate.cs.technion.ac.il/` |
   | Electrical Engineering | `https://ece.technion.ac.il/` |

   Faculty catalog PDFs are typically hosted under `wp-content/uploads/` on the faculty's undergraduate site or on the Technion undergraduate portal (`ugportal.technion.ac.il`).

   **Technion Undergraduate Portal** (all faculties): `https://ugportal.technion.ac.il/` — has a catalog page with links to ALL faculty PDFs for each year. URL pattern: `ugportal.technion.ac.il/wp-content/uploads/YYYY/MM/<number>-<hebrew-faculty-name>-תשפ״<letter>.pdf`

#### Strategy B: Hebrew web search (if Strategy A fails)

Search **in Hebrew** using these query patterns (most specific first):

1. `קטלוג <faculty-hebrew> <year> site:technion.ac.il`
   - Example: `קטלוג מדעי המחשב 2024-2025 site:technion.ac.il`

2. `הפקולטה ל<faculty-hebrew> תוכנית לימודים <hebrew-year-abbrev> site:technion.ac.il`
   - Example: `הפקולטה למדעי המחשב תוכנית לימודים תשפה site:technion.ac.il`

3. `<faculty-hebrew> קטלוג <hebrew-year-abbrev> filetype:pdf site:technion.ac.il`
   - Example: `מדעי המחשב קטלוג תשפה filetype:pdf site:technion.ac.il`

**Do NOT use English-language queries** — they consistently return incorrect catalogs from other sources.

#### Faculty name mapping

| Faculty (English) | Faculty (Hebrew) | Search term | Faculty code |
|---|---|---|---|
| Computer Science | מדעי המחשב | מדעי המחשב | `ComputerScience` |
| Electrical Engineering | הנדסת חשמל ומחשבים | הנדסת חשמל ומחשבים | `ElectricalEngineering` |
| Data & Decision Science | מדעי הנתונים וההחלטות | מדעי הנתונים | `DataAndDecisionScience` |
| Medicine | רפואה | רפואה | `Medicine` |

#### Hebrew year mapping

| Academic Year | Hebrew Year | Hebrew Abbreviation (for URLs/search) |
|---|---|---|
| 2023-2024 | תשפ"ד | תשפד |
| 2024-2025 | תשפ"ה | תשפה |
| 2025-2026 | תשפ"ו | תשפו |
| 2026-2027 | תשפ"ז | תשפז |

#### Strategy C: Fallback

If Strategies A and B don't find a direct PDF link:
1. Search for the faculty's undergraduate page: `<faculty-hebrew> טכניון לימודי הסמכה site:technion.ac.il`
2. Browse the page for links to "תוכנית לימודים" or "קטלוג"
3. Follow links until you find the PDF

#### Verify the URL

Confirm the URL ends in `.pdf` and is accessible. Use `web_fetch` to download a small portion and verify it's a valid PDF (starts with `%PDF`).

### Example

For "Computer Science 2024-2025" (מדעי המחשב):
1. **Strategy A**: Fetch `https://undergraduate.cs.technion.ac.il/` and look for PDF links containing "קטלוג" or "תשפה"
2. **Strategy B** (if needed): Search `קטלוג מדעי המחשב 2024-2025 site:technion.ac.il`
3. **Expected result**: `https://undergraduate.cs.technion.ac.il/wp-content/uploads/2024/12/23-הפקולטה-למדעי-המחשב-תשפ״ה-.pdf` (URL-encoded)

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

### Known Tracks

#### CS Faculty

| Track (Hebrew) | Track (English) | File Name Pattern | Faculty |
|---|---|---|---|
| מדמח תלת שנתי | CS 3-year | `ComputerScience3years{year}.json` | `ComputerScience` |
| מדמח ארבע שנתי | CS 4-year | `ComputerScience4years{year}.json` | `ComputerScience` |
| הנדסת תוכנה | Software Engineering | `ComputerScienceSoftwareEngineerCourse{year}.json` | `ComputerScience` |
| מגמת סייבר | Cyber Security | `ComputerScienceCyberSecurity{year}.json` | `ComputerScience` |
| למידה וניתוח מידע | Data Analysis | `ComputerScienceDataAnalysis{year}.json` | `ComputerScience` |
| ביואינפורמטיקה | Bioinformatics | `ComputerScienceBioinformatics{year}.json` | `ComputerScience` |
| הנדסת מחשבים | Computer Engineering | `ComputerScienceComputerEngineering{year}.json` | `ComputerScience` |

#### EE Faculty

| Track (Hebrew) | Track (English) | File Name Pattern | Faculty |
|---|---|---|---|
| הנדסת חשמל | Electrical Engineering | `ElectricalEngineering{year}.json` | `ElectricalEngineering` |
| הנדסת מחשבים ותוכנה | Computer & Software Eng | `ElectricalEngineeringComputerSoftware{year}.json` | `ElectricalEngineering` |
| הנדסת חשמל ומתמטיקה | EE + Math | `ElectricalEngineeringMath{year}.json` | `ElectricalEngineering` |

### How to Identify Tracks in the PDF

- Look for **"סה"כ נ.ז"** or **"יש לצבור X נקודות"** (total credits) markers — each track has its own total
- Look for **track names** in headers (e.g., "המסלול בהנדסת חשמל", "מדמח תלת שנתי")
- Look for **credit totals** that distinguish tracks:
  - CS 3-year: ~120 credits
  - CS 4-year: ~155 credits
  - CS Software Engineering: ~159.5 credits
  - EE main: ~157.5 credits
  - EE Computer & Software Eng: ~159.5 credits
  - EE + Math: ~162 credits

- Present the discovered tracks to the user and confirm which ones to extract (or extract all).

## Step 3: Extract Each Track (invoke catalog-extractor)

For **each track** found in Step 2, invoke the **catalog-extractor** skill (see `.github/skills/catalog-extractor/SKILL.md`). Process the tracks one at a time:

1. **Determine the track parameters**:
   - `name`: Hebrew catalog name (e.g., `"מדמח תלת שנתי 2024-2025"`)
   - `output`: File path following the naming convention: `packages/docs/{Faculty}{Track}{Year}.json`
   - `reference`: Use the most recent existing catalog of the same track as a reference (if available in `packages/docs/`)

2. **Run the extraction pipeline** for the track:
   ```bash
   cd packages/catalog-extractor
   python main.py "<pdf_url>" \
     --name "<hebrew_name>" \
     --reference ../docs/<ReferenceFile>.json \
     --output ../docs/<OutputFile>.json \
     --save-text raw_text_<track>.txt \
     --save-sections sections_<track>.json
   ```

3. **Refine the output**: The pipeline produces a skeleton. Following the catalog-extractor skill guidelines, fill in:
   - `total_credit`
   - Bank `credit` values
   - `credit_overflows` (follow patterns for track type)
   - Complex rules (Chains, SpecializationGroups)
   - `catalog_replacements` and `common_replacements`

### Reference File Selection

When extracting a track, use the most recent existing catalog of the **same track type** as a reference:

Look for the most recent existing catalog of the **same track type** in `packages/docs/` using glob patterns like `{Faculty}{Track}*.json`. For example:
- CS 4-year → `ComputerScience4years*.json`
- EE main → `ElectricalEngineering*.json`

If no reference exists for a track (first extraction for that faculty), omit `--reference` and build from scratch using the raw text. This is expected for new faculties.

## Step 4: Validate Each Track (invoke catalog-validation)

### CRITICAL: Fresh Conversation Required

Validation **MUST** run in a **separate, clean conversation** with no history from the extraction phase. This prevents the validator from being biased by the extractor's assumptions or decisions.

**How to do this:**
1. After all tracks are extracted in Steps 1-3, **stop the current conversation**.
2. **Start a new Copilot conversation** (new thread / new chat session).
3. In the new conversation, provide **only**:
   - The path(s) to the generated JSON file(s) (e.g., `packages/docs/ComputerScience3years2025-2026.json`)
   - The PDF URL
   - The instruction: "Validate these catalog JSONs against the PDF using the catalog-validation skill"
4. The validator independently reads the JSON and PDF with fresh eyes — no extraction context leaking in.

### Validation Workflow (in the fresh conversation)

For **each extracted catalog**, invoke the **catalog-validation** skill (see `.github/skills/catalog-validation/SKILL.md`):

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

4. **Fix and re-validate**: If there are errors, edit the JSON and re-run validation until 0 errors.

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
| 3-year | ComputerScience3years2024-2025.json | 120 | Valid | 0 | 2 |
| 4-year | ComputerScience4years2024-2025.json | 160 | Valid | 0 | 1 |
| Software Eng | ComputerScienceSoftwareEngineerCourse2024-2025.json | 159.5 | Valid | 0 | 3 |
| Data Science | ComputerScienceDataScienceAndEngineering2024-2025.json | 145 | 1 Warning | 0 | 1 |
```

## Error Handling

- **PDF not found**: Report that the catalog could not be found. Suggest the user provide the URL directly.
- **Track not recognized**: If a track section doesn't match known patterns, ask the user whether to attempt extraction.
- **Extraction failures**: If a track fails extraction, skip it and continue with others. Report the failure in the summary.
- **Validation failures**: If errors persist after 2 fix attempts, flag the track for manual review and move on.

## Full Example

User: "Extract all Computer Science catalogs for 2024-2025"

### Conversation 1 — Search & Extract (Steps 1-3)
1. Browse `https://undergraduate.cs.technion.ac.il/` for PDF links -> find the catalog PDF
2. Extract PDF text -> discover tracks: 3-year, 4-year, Software Engineering, Data Science
3. For each track: run the catalog-extractor pipeline with the appropriate reference -> save JSON files
4. **Stop the conversation.** Tell the user: "Extraction complete. Start a new conversation for validation."

### Conversation 2 — Validate (Step 4, fresh thread)
1. User starts a **new Copilot conversation** (no extraction history)
2. User provides the JSON file paths + PDF URL and asks to validate using catalog-validation
3. Validator independently reads each JSON + PDF, finds issues, fixes them
4. Produces summary report
