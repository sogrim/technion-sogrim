---
description: "Validate Sogrim catalog JSON files for correctness — both structural (schema) and content (against the source Technion PDF)."
---

# Technion Catalog Validation

Validate Sogrim catalog JSON files for correctness — both structural (schema) and content (against the source PDF).

## Python Scripts

**IMPORTANT**: This skill uses pre-built Python scripts in `packages/catalog-validation/`. Do NOT recreate these scripts from scratch — use and improve them instead.

### Setup (one-time)
```bash
cd packages/catalog-validation
pip install -r requirements.txt
```

### Available scripts

| Script | Purpose |
|---|---|
| `validate_schema.py` | Validates JSON structure: required fields, 8-digit course IDs, bank references, overflow rules, replacements |
| `validate_pdf.py` | Cross-validates JSON against the source Technion PDF: courses, credits, banks, chains, ליבה rule |
| `validate_all.py` | Runs both validations in sequence — schema first, then PDF cross-check |
| `pdf_utils.py` | Shared utility: PDF download/text extraction, course ID zero-padding |

## Workflow

1. **Install dependencies**: `pip install -r packages/catalog-validation/requirements.txt`
2. **Run full validation**:
   ```bash
   cd packages/catalog-validation
   python validate_all.py ../docs/<CatalogFile>.json <pdf_url> --verbose
   ```
3. **Review findings**: Fix all ERRORs. Review WARNINGs manually.
4. **Re-run** until 0 errors.

### Schema-only validation (no PDF needed)
```bash
python validate_schema.py ../docs/<CatalogFile>.json
```

### PDF cross-validation only
```bash
python validate_pdf.py ../docs/<CatalogFile>.json <pdf_url> --verbose
```

## Validation Checks

### Schema Validation (`validate_schema.py`)

| # | Check | What it verifies |
|---|---|---|
| 1 | Required fields | `_id`, `name`, `faculty`, `total_credit`, `description`, `course_banks`, `credit_overflows`, `course_to_bank`, `catalog_replacements`, `common_replacements` |
| 2 | Faculty | Must be one of: `ComputerScience`, `DataAndDecisionScience`, `Medicine`, `Unknown` |
| 3 | Total credit | Must be a positive number |
| 4 | Course banks | Each bank has `name` and `rule` |
| 5 | Course IDs | All IDs in `course_to_bank` are 8-digit zero-padded |
| 6 | Bank references | Every course maps to a bank defined in `course_banks` |
| 7 | Bank coverage | All non-special banks have at least one course |
| 8 | Credit overflows | All `from`/`to` reference valid bank names |
| 9 | Replacements | All IDs in `catalog_replacements` and `common_replacements` are 8-digit, values are lists |
| 10 | Replacement convention | Replacement **values** must NOT appear in `course_to_bank` — only the **key** (CS faculty course) goes in `course_to_bank` |

### PDF Cross-Validation (`validate_pdf.py`)

The script **automatically detects** the track type from the JSON catalog name (e.g., `CyberSecurity`, `SoftwareEngineer`, `ComputerEngineering`, `DataScience`) and extracts the correct section from the PDF. No manual configuration is needed.

| # | Check | What it verifies |
|---|---|---|
| 1 | Track section extraction | Auto-detects track type and extracts the correct PDF section |
| 2 | Total credits | JSON `total_credit` matches PDF total |
| 3 | Credit breakdown | חובה + related bank credits match PDF's combined count (track-aware) |
| 4 | חובה courses | All courses from PDF semester tables exist in JSON (replacement-aware) |
| 5 | ליבה courses | All PDF ליבה courses match JSON ליבה bank (handles fragmented IDs and replacement-aware) |
| 6 | Course coverage | חובה/ליבה courses from JSON appear somewhere in PDF |
| 7 | Bank structure | All expected banks present in JSON (per-track expectations) |
| 8 | Chain structure | שרשרת מדעית uses `Chains` rule with valid chain options |
| 9 | Credit overflows | Overflow rules are defined |
| 10 | ליבה rule | ליבה bank requires correct number of courses (extracted from PDF) |

## Severity Levels

- **ERROR** — Must fix. Missing courses, wrong credits, invalid IDs.
- **WARNING** — Review manually. Course in JSON but not found in specific PDF pages (may be in general track).
- **OK** — Check passed.
- **INFO** — Verbose details (only with `--verbose`).

## JSON Output

Use `--json-output findings.json` to save machine-readable results:
```bash
python validate_all.py ../docs/CatalogFile.json <pdf_url> --json-output findings.json
```

Each finding is:
```json
{
  "severity": "ERROR|WARNING|OK|INFO",
  "category": "schema|total_credit|חובה_courses|...",
  "message": "Human-readable description",
  "details": "Additional context (optional)"
}
```

## Catalog Replacement Convention

Replacements are **one-directional**: the KEY is the preferred CS faculty course, the VALUE is the alternative.

- **KEY** (e.g., `02360330`) → appears in `course_to_bank` and as the replacement key
- **VALUE** (e.g., `00460197`) → appears ONLY in `catalog_replacements`, **never** in `course_to_bank`
- Replacements are NOT bidirectional — do not add a reverse entry

The schema validator enforces this: it warns if any replacement value is also found in `course_to_bank`.

## Supported Tracks

The PDF cross-validation supports multiple tracks via `TRACK_CONFIGS` in `validate_pdf.py`:

| Track | Catalog name pattern | Credit total | חובה includes |
|---|---|---|---|
| Cyber Security | `CyberSecurity` | 155 | חובה + שרשרת מדעית + מתמטי נוסף |
| Software Engineering | `SoftwareEngineer` | 159.5 | חובה + שרשרת מדעית |
| Computer Engineering | `ComputerEngineering` | 160 | חובה + שרשרת מדעית |
| General 4-year | `General` (no 3yr) | 155 | חובה + שרשרת מדעית |
| General 3-year | `3Year` | 161 | חובה + שרשרת מדעית |
| Data Science | `DataScience` | varies | חובה + שרשרת מדעית |

### Adding a New Track

1. Add an entry to `TRACK_CONFIGS` in `validate_pdf.py` with: `keywords`, `header_pattern`, `total_credits`, `expected_banks`, `chova_includes`
2. Add the track's section header to `ALL_SECTION_HEADERS` for boundary detection
3. Run validation — the script will auto-detect the track from the catalog name

### Known PDF Parsing Quirks

- **Fragmented course IDs**: Hebrew RTL rendering can split IDs across lines (e.g., `02360341` appears as `341\n0\n236\n0`). The ליבה extraction handles this automatically.
- **חובה credit mapping**: Some tracks include sub-banks (שרשרת מדעית, מתמטי נוסף) within the PDF's "חובה" total. The `chova_includes` config handles this per-track.

## Improving the Scripts

If the PDF format changes or a check needs updating, **modify the scripts in `packages/catalog-validation/`** rather than writing one-off code. This keeps the tooling reusable.

## Examples

```bash
cd packages/catalog-validation

# Validate the Cyber Security 2024-2025 catalog
python validate_all.py \
  ../docs/ComputerScienceCyberSecurity2024-2025.json \
  "https://undergraduate.cs.technion.ac.il/wp-content/uploads/2024/12/23-%D7%94%D7%A4%D7%A7%D7%95%D7%9C%D7%98%D7%94-%D7%9C%D7%9E%D7%93%D7%A2%D7%99-%D7%94%D7%9E%D7%97%D7%A9%D7%91-%D7%AA%D7%A9%D7%A4%D7%B4%D7%94-.pdf" \
  --verbose

# Validate the SE 2024-2025 catalog (same PDF, different JSON)
python validate_all.py \
  ../docs/ComputerScienceSoftwareEngineerCourse2024-2025.json \
  "https://undergraduate.cs.technion.ac.il/wp-content/uploads/2024/12/23-%D7%94%D7%A4%D7%A7%D7%95%D7%9C%D7%98%D7%94-%D7%9C%D7%9E%D7%93%D7%A2%D7%99-%D7%94%D7%9E%D7%97%D7%A9%D7%91-%D7%AA%D7%A9%D7%A4%D7%B4%D7%94-.pdf" \
  --verbose
```
