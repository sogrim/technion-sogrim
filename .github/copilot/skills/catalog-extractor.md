# Technion Catalog JSON Extractor

Extract academic degree catalogs from Technion PDF course catalogs into structured JSON format for the Sogrim degree-completion checker.

## Python Scripts

**IMPORTANT**: This skill uses pre-built Python scripts in `packages/catalog-extractor/`. Do NOT recreate these scripts from scratch — use and improve them instead.

### Setup (one-time)
```bash
cd packages/catalog-extractor
pip install -r requirements.txt
```

### Available scripts

| Script | Purpose |
|---|---|
| `extract_pdf.py` | Downloads PDF (from URL or local path) and extracts text page-by-page |
| `parse_sections.py` | Splits extracted text into catalog sections by detecting bank headers |
| `normalize.py` | Utility: course ID padding, bank name detection, rule mappings |
| `build_catalog.py` | Builds skeleton catalog JSON from parsed sections |
| `validate_catalog.py` | Validates final JSON against expected schema |
| `validate_against_pdf.py` | **Cross-validates** a catalog JSON against the source PDF — checks courses, credits, banks, chains, overflows |
| `main.py` | All-in-one pipeline combining all steps |

### Quick pipeline
```bash
cd packages/catalog-extractor
python main.py <pdf_url_or_path> --name "Hebrew catalog name" --reference ../docs/ComputerScience3years2024-2025.json --output ../docs/NewCatalog.json --save-text raw_text.txt --save-sections sections.json
```

## Workflow

1. **Install dependencies**: Run `pip install -r packages/catalog-extractor/requirements.txt` if not already installed.
2. **Extract text**: Run `python packages/catalog-extractor/extract_pdf.py <pdf_url_or_path> --output raw_text.txt` to get the raw PDF text.
3. **Review raw text**: Read the extracted text to understand the PDF structure and identify which program/track to extract.
4. **Ask which program/track**: Present the user with the available programs found in the PDF and ask which one to extract.
5. **Parse and build skeleton**: Run the pipeline or manually use `parse_sections.py` + `build_catalog.py` to get a skeleton JSON.
6. **Refine the JSON**: The skeleton will have TODOs. Using the raw text and your understanding of the catalog, fill in:
   - `total_credit` — from the PDF's total credit summary
   - `description` — Hebrew description of the program
   - Bank `credit` values — from each section's credit requirements
   - `credit_overflows` — based on the track type (see patterns below)
   - Complex rules: `Chains` for שרשרת מדעית, `SpecializationGroups` for קבוצות התמחות
   - `catalog_replacements` — from replacement notes in the PDF
7. **Validate schema**: Run `python packages/catalog-extractor/validate_catalog.py <output.json>`
8. **Cross-validate against PDF**: Run `python packages/catalog-extractor/validate_against_pdf.py <output.json> <pdf_url> --verbose` to compare courses, credits, banks, chains, and overflows against the source PDF. Fix any ERRORs before proceeding.
9. **Output JSON**: Save to `packages/docs/{Faculty}{Track}{Year}.json`

### Improving the scripts
If the PDF format has changed or the scripts miss something, **update the scripts in `packages/catalog-extractor/`** rather than writing one-off code. This keeps the tooling reusable for future catalogs.

## JSON Schema

The output JSON must follow this exact structure:

```json
{
  "_id": { "$oid": "" },
  "name": "<Hebrew name, e.g., מדמח ארבע שנתי 2024-2025>",
  "total_credit": <number>,
  "description": "<Hebrew description of the program>",
  "course_banks": [ ... ],
  "credit_overflows": [ ... ],
  "course_to_bank": { ... },
  "catalog_replacements": { ... },
  "common_replacements": { ... },
  "faculty": "<FacultyName>"
}
```

### Field Details

#### `_id`
Always `{"$oid": ""}` for new catalogs (MongoDB will assign on insert).

#### `name`
Hebrew name of the catalog. Pattern: `"מדמח <track-type> <year-range>"`.
- 3-year: `"מדמח תלת שנתי 2024-2025"`
- 4-year: `"מדמח ארבע שנתי 2024-2025"`

#### `total_credit`
Total credit points required for degree completion. Found in the PDF under "סה\"כ נ.ז" or similar.

#### `course_banks`
Array of course bank objects. Each bank represents a category of courses:

```json
{
  "name": "<Hebrew bank name>",
  "rule": "<rule type>",
  "credit": <number or null>
}
```

**Common banks and their rules:**

| Bank Name (Hebrew) | Rule | Notes |
|---|---|---|
| חובה | `"All"` | Mandatory courses - all must be completed |
| שרשרת מדעית | `{"Chains": [[...], ...]}` | Scientific chain - pick one chain of courses |
| מתמטי נוסף | `{"AccumulateCourses": {"$numberLong": "1"}}` | Additional math - accumulate N courses |
| רשימה א | `"AccumulateCredit"` | List A electives - accumulate credits |
| רשימה ב | `"AccumulateCredit"` | List B electives - accumulate credits |
| קבוצות התמחות | `{"SpecializationGroups": {...}}` | **4-year only** - specialization groups |
| פרויקט | `{"AccumulateCourses": {"$numberLong": "1"}}` | Project - credit is `null` |
| סמינר | `{"AccumulateCourses": {"$numberLong": "1"}}` | **4-year only** - Seminar, credit is `null` |
| בחירת העשרה | `"Malag"` | Enrichment electives |
| חינוך גופני | `"Sport"` | Physical education |
| בחירה חופשית | `"Elective"` | Free electives |

**Chains rule structure** (for שרשרת מדעית):
```json
{
  "Chains": [
    ["01140075"],
    ["01140052", "01140054"],
    ["01340058", "01340020"],
    ["01240120", "01250801"],
    ["01240120", "01240510"],
    ["01240120", "01140052"]
  ]
}
```
Each inner array is one valid chain. The student must complete one full chain.

**SpecializationGroups rule structure** (for קבוצות התמחות, 4-year only):
```json
{
  "SpecializationGroups": {
    "groups_list": [
      {
        "name": "סיבוכיות של חישובים",
        "courses_sum": {"$numberLong": "3"},
        "course_list": [
          "02360306", "02360309", "02360313", "02360315",
          "02360318", "02360359", "02360374", "02360377",
          "02360378", "02360508", "02360518", "02360521",
          "02360525", "02360755", "02360760"
        ],
        "mandatory": [["02360313"]]
      },
      {
        "name": "תורת האלגוריתמים",
        "courses_sum": {"$numberLong": "3"},
        "course_list": ["02360315", "02360357", "02360359", "02360377", "02360521"],
        "mandatory": null
      }
    ],
    "groups_number": {"$numberLong": "3"}
  }
}
```
All course IDs in specialization groups must also be 8-digit zero-padded.

#### `credit_overflows`
Defines how excess credits overflow between banks:
```json
[
  {"from": "חובה", "to": "רשימה ב"},
  {"from": "רשימה א", "to": "רשימה ב"},
  ...
]
```

Common overflow patterns:
- **3-year**: חובה→רשימה ב, רשימה א→רשימה ב, פרויקט→רשימה א, שרשרת מדעית→רשימה ב, מתמטי נוסף→רשימה ב, רשימה ב→בחירה חופשית, בחירת העשרה→בחירה חופשית, חינוך גופני→בחירה חופשית
- **4-year**: Same as above plus: פרויקט→סמינר, סמינר→רשימה א, קבוצות התמחות→רשימה א

#### `course_to_bank`
Maps every course ID to its bank name:
```json
{
  "02340114": "חובה",
  "02360306": "רשימה א",
  "01140075": "שרשרת מדעית",
  ...
}
```

**CRITICAL: Course ID format** — Use 8-digit zero-padded course IDs (e.g., `"02340114"` not `"234114"`). This is the current standard as of 2024-2025 catalogs. If the PDF shows shorter IDs, zero-pad them to 8 digits.

To convert: if the PDF shows a 6-digit ID like `"234114"`, pad it to `"02340114"`. The pattern is: prepend zeros until 8 digits.

#### `catalog_replacements`
Course-specific replacements valid only for this catalog:
```json
{
  "01040134": ["01040158"],
  "00440252": ["02340252"]
}
```

#### `common_replacements`
Cross-catalog course replacements (typically the same across years):
```json
{
  "01040031": ["01040195"],
  "01040032": ["01040281"],
  "01040174": ["01040168"],
  "01140071": ["01140074", "01140051"],
  "01140075": ["01140076"],
  "02340114": ["02340117"],
  "02340141": ["01040286"],
  "00940412": ["01040222"]
}
```

#### `faculty`
String identifier: `"ComputerScience"` for CS catalogs.

## Extraction Guidelines

### Reading the PDF
- The Technion catalog PDF is in Hebrew (right-to-left).
- Course IDs are numeric (6-8 digits). They appear next to course names.
- Credit points ("נ.ז") appear next to each course, usually as decimal numbers.
- The PDF is organized by sections: mandatory courses (חובה), elective lists (רשימה א, רשימה ב), scientific chains, specialization groups (4-year), etc.

### Identifying Course Banks
- Look for section headers like "קורסי חובה", "רשימה א'", "רשימה ב'", "שרשרת מדעית", "קבוצות התמחות".
- Under each section, extract all course IDs listed.
- Map each course ID to the appropriate bank name in `course_to_bank`.

### Credit Calculation
- Sum up credits for each bank as listed in the catalog.
- `total_credit` is the sum required for the entire degree.
- Individual bank credits should match what's specified in the PDF.

### Specialization Groups (4-year only)
- Each group has a name, a list of courses, minimum number of courses required (`courses_sum`), and optionally mandatory courses within the group.
- `groups_number` is how many specialization groups the student must complete.
- `mandatory` field: array of arrays. Each inner array lists courses where at least one must be taken. `null` if no mandatory courses.

### Handling Course Replacements
- `catalog_replacements`: Courses that have been replaced specifically in this catalog year. Look for notes like "במקום" (instead of) or replacement tables.
- `common_replacements`: Standard replacements that apply across catalogs (e.g., old math courses replaced by new ones). These are typically stable across years — copy from the most recent existing catalog and adjust if needed.

### Projects and Seminars
- Project courses (פרויקט) and seminars (סמינר) have `credit: null` because their credits count toward other banks via overflow rules.
- List all valid project/seminar course IDs in `course_to_bank`.

## Existing Examples

Reference these files in `packages/docs/` for format examples:
- `ComputerScience3years2024-2025.json` — 3-year CS catalog (**current standard** with 8-digit IDs)
- `ComputerScience4years2022-2023.json` — 4-year CS catalog (uses older 6-digit IDs — **do NOT follow this ID format**, always use 8-digit zero-padded IDs in new catalogs)
- `ComputerScience3years2019-2020.json` — 3-year CS catalog (older format, 6-digit IDs)

## Validation Checklist

Before outputting the final JSON:
1. ✅ All course IDs are 8-digit zero-padded strings
2. ✅ Every course in `course_to_bank` maps to a valid bank name from `course_banks`
3. ✅ `total_credit` matches the sum described in the PDF
4. ✅ All banks listed in `course_banks` have their courses represented in `course_to_bank`
5. ✅ `credit_overflows` follows the standard pattern for the track type (3-year or 4-year)
6. ✅ Specialization groups (4-year) have correct `courses_sum`, `course_list`, and `mandatory` fields
7. ✅ `_id` is `{"$oid": ""}` for new catalogs
8. ✅ `faculty` field is set correctly
9. ✅ JSON is valid and parseable
10. ✅ Hebrew text is properly encoded (UTF-8)

## Cross-Validation Against PDF

After building or editing a catalog JSON, **always** cross-validate it against the source PDF:

```bash
cd packages/catalog-extractor
python validate_against_pdf.py <catalog.json> <pdf_url_or_path> --verbose
```

### What it checks (10 validations)

| # | Check | What it verifies |
|---|---|---|
| 1 | SE section extraction | Finds the correct track section in the PDF using "159.5" anchor |
| 2 | Total credits | JSON `total_credit` matches PDF total |
| 3 | Credit breakdown | חובה + שרשרת credits match PDF's combined "חובה" count |
| 4 | חובה courses | All courses from PDF semester tables exist in JSON (replacement-aware) |
| 5 | ליבה courses | All PDF ליבה courses match JSON ליבה bank |
| 6 | Course coverage | חובה/ליבה courses from JSON appear somewhere in PDF |
| 7 | Bank structure | All expected banks (חובה, שרשרת, ליבה, רשימה א/ב, etc.) present |
| 8 | Chain structure | שרשרת מדעית has `Chains` rule with valid chain options |
| 9 | Credit overflows | Overflow rules are defined |
| 10 | ליבה rule | ליבה bank requires 3 courses per PDF |

### Severity levels

- **ERROR** — Must fix before using the catalog. E.g., missing courses, wrong credits.
- **WARNING** — Review manually. E.g., a course in JSON but not found in SE pages (may be in general track pages).
- **OK** — Check passed.
- **INFO** — Verbose details (only shown with `--verbose`).

### JSON output

Use `--json-output findings.json` to save machine-readable results for CI integration.

### Adapting for other tracks

The script currently targets the SE (Software Engineering) track using the 159.5-credit anchor. To validate other tracks:
1. Update `extract_se_section()` to find the correct track anchor
2. Adjust `extract_chova_courses()` and `extract_liba_courses()` for that track's structure
3. Update `expected_banks` in the bank structure check
