---
description: "Extract academic degree catalogs from Technion PDF course catalogs into structured JSON format for the Sogrim degree-completion checker."
---

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
| פרויקט | `{"AccumulateCourses": {"$numberLong": "N"}}` | Project — see [Projects section](#projects-and-seminars) for credit rules |
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
- **Computer Engineering**: חובה→בחירה פקולטית, ליבה→בחירה פקולטית, קבוצות התמחות→בחירה פקולטית, פרויקט→בחירה פקולטית, בחירה פקולטית→בחירה חופשית, בחירת העשרה→בחירה חופשית, חינוך גופני→בחירה חופשית

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

### Handling "או" (Or) Course Alternatives

**CRITICAL for cross-faculty tracks** (e.g., Computer Engineering shared between CS and EE faculties):

When the PDF lists two courses joined by "או" (or), the student may take either one. These **must** be handled with `catalog_replacements`:

```
5.0 - - 2 4 אלגברה 1מ׳ 1  01040064
 או
5.0 - - 2 4 אלגברה 1מ'    01040016
```

**Key/value orientation**: The KEY of the replacement should be the CS course (0236/0234 prefix) and appear in `course_to_bank`. The VALUE should be the EE alternative (0044/0046 prefix) and appear ONLY in `catalog_replacements`, NOT in `course_to_bank`.

**General rule for all replacements**: The KEY appears in both `course_to_bank` and as a replacement key. The VALUE appears ONLY in the replacement — never in `course_to_bank`.

> **⚠️ WRONG** — bidirectional replacements, value in course_to_bank:
> ```json
> "course_to_bank": { "02360330": "ליבה", "00460197": "ליבה" },
> "catalog_replacements": { "02360330": ["00460197"], "00460197": ["02360330"] }
> ```
>
> **✅ CORRECT** — one-directional, value only in replacements:
> ```json
> "course_to_bank": { "02360330": "ליבה" },
> "catalog_replacements": { "02360330": ["00460197"] }
> ```

**For חובה (All rule) banks**: Only the KEY course appears in חובה. The replacement allows the VALUE course to substitute for it.

**For ליבה / specialization groups**: Only the KEY course appears in the bank. The replacement prevents double-counting if a student takes the VALUE version instead.

**Where to look for "or" patterns in the PDF**:
1. **Semester tables** — courses with "או" between them (e.g., `01040064 או 01040016`)
2. **Footnotes** — e.g., "סטודנט יוכל לבחור בין..." (student may choose between...)
3. **ליבה section** — alternatives listed with "או"
4. **Specialization groups** — courses paired with "או" or "/" separators
5. **Mandatory courses within groups** — listed as `XXXXX/YYYYY` or with "או"

**Example** (Computer Engineering 2024-2025): CS courses are keys, EE alternatives are values:
```json
"catalog_replacements": {
  "02360334": ["00440334"],         // Networks - CS key, EE value
  "02360927": ["00460212"],         // Robotics - CS key, EE value
  "02360703": ["00460271"],         // OOP - CS key, EE value
  "02360781": ["04600211"],         // Deep Learning - CS key, EE value
  "02360268": ["00460268"],         // Processor Eng
  "02360860": ["00460200"],         // Image Processing
  "02360873": ["00460746"],         // Computer Vision
  "02360766": ["00460195"],         // Machine Learning
  "02360360": ["00460266"],         // Compilation
  "02360278": ["00460278"]          // Accelerators
}
```

**How to systematically find all "or" pairs**: Scan the entire track section for the word "או" and for "/" between course numbers. Every such occurrence needs a `catalog_replacements` entry. Always prefer the CS course (0236/0234) as the key.

### Projects and Seminars

Projects and seminars come in **two patterns** depending on the track:

#### Pattern A: Single project, no credit requirement (3-year, 4-year CS, Bioinformatics)
- `credit: null` — the project has no standalone credit requirement
- Credits overflow to another bank (e.g., רשימה א or בחירה פקולטית)
- Rule: `AccumulateCourses: 1` (choose 1 project)
- Example: 3-year CS has פרויקט with `credit: null`, overflow to רשימה א

#### Pattern B: Multiple projects with minimum credit requirement (Computer Engineering)
- `credit: 6.0` — the projects require a minimum total of 6 credits
- Rule: `AccumulateCourses: 2` (must complete 2 projects)
- Each project is typically 3-4 credits; any excess beyond 6 overflows to בחירה פקולטית
- **How to detect**: When the PDF semester tables show projects in their own semesters (e.g., semesters 6 and 7 each dedicated to a project), and the PDF credit header counts projects within חובה but the projects clearly stand alone

**Key rule**: If the PDF includes project credits in the חובה total (e.g., "112.5-114.5 חובה" which includes 6-8 credits of projects), you must **subtract** project credits from חובה and assign them to the פרויקט bank. The חובה bank should only contain the non-project mandatory courses.

Similarly for seminars (סמינר):

## Common Extraction Pitfalls

These are real mistakes found during catalog validation. Keep these in mind when extracting any track.

### Pitfall 1: Including courses from the wrong track

**Problem**: The Technion PDF contains ALL tracks for a faculty (3-year, 4-year, SE, bioinformatics, etc.) in a single document. It's easy to accidentally include courses from a different track's semester table into חובה.

**Example** (Bioinformatics 2024-2025): Courses `02340125` (אלגוריתמים נומריים) and `02360360` (תורת הקומפילציה) were placed in חובה, but they belong to the general 4-year track, not the bioinformatics track. They should have been in רשימה א.

**How to avoid**: Carefully identify the exact pages/section for your target track. Cross-reference ONLY the semester table for that specific track when building the חובה bank. Verify the חובה credit total matches the PDF.

### Pitfall 2: Adding a פרויקט bank when the track doesn't need one

**Problem**: Most CS tracks have a separate "פרויקט" bank (AccumulateCourses: 1) where students choose one project. But some tracks (like bioinformatics) have their project as a **mandatory** course already in חובה, with no separate project selection.

**Example** (Bioinformatics 2024-2025): The track has `02360524` (פרויקט בביואינפורמטיקה) as a mandatory course in חובה. There should be no separate פרויקט bank — all project courses should go to רשימה א instead.

**How to avoid**: Check whether the track's semester table lists a specific project course. If yes, it's mandatory (חובה) and no פרויקט bank is needed. Only create a פרויקט bank when the PDF says "choose one project from the list".

### Pitfall 3: Lumping structured elective requirements into a single bank

**Problem**: Some tracks have elective sections with multiple sub-requirements (e.g., "complete one cluster AND at least 2 courses from another list AND accumulate X total credits"). Collapsing these into a single AccumulateCredit bank loses the sub-requirements.

**Example** (Bioinformatics 2024-2025): The PDF's "בחירה מביולוגיה" section requires:
1. Complete one of two course clusters (מקבץ מולקולרי OR מקבץ מיקרוביולוגיה ואבולוציה)
2. Complete at least 2 courses from רשימה ב
3. Total biology credits must reach 14.5

This was initially extracted as a single `"בחירה בביולוגיה"` bank with `AccumulateCredit: 14.5`, which doesn't enforce requirements 1 and 2.

**Correct approach** — Split into 3 banks connected by credit overflow:

```json
// Bank 1: Chain requirement — pick one cluster
{
  "name": "רשימה מביולוגיה א",
  "rule": {
    "Chains": [
      ["01250801", "01340082"],
      ["01340121", "01340133", "01340142"]
    ]
  },
  "credit": null
}

// Bank 2: Minimum course count
{
  "name": "רשימה מביולוגיה ב",
  "rule": {"AccumulateCourses": {"$numberLong": "2"}},
  "credit": null
}

// Bank 3: Overall credit target (overflow-only)
{
  "name": "בחירה מביולוגיה כללי",
  "rule": "AccumulateCredit",
  "credit": 14.5
}
```

With overflows: `רשימה מביולוגיה א → בחירה מביולוגיה כללי`, `רשימה מביולוגיה ב → בחירה מביולוגיה כללי`. This way all three sub-requirements are enforced: the chain, the minimum courses, and the total credit target.

**How to avoid**: Read the PDF elective section carefully. If it says things like "choose one of the following clusters", "at least N courses from list X", or "remaining credits from lists Y", these are separate requirements that need separate banks with overflow connections.

### Pitfall 4: Missing cross-faculty elective courses for Bioinformatics

**Problem**: The Bioinformatics track has a `בחירה מביולוגיה כללי` bank that accumulates 14.5 credits from Biology courses. The CS catalog PDF only lists the structured requirements (cluster choices and minimum course counts), but students can also take **any** course from the Biology faculty's רשימה א' and רשימה ב' to fill the remaining credits. These courses are listed in a **separate PDF** — the Biology faculty catalog — not in the CS catalog.

**How to populate**: Download the Biology faculty catalog PDF (e.g., `https://ugportal.technion.ac.il/wp-content/uploads/2025/09/13-ביולוגיה-תשפ״ו.pdf`) and extract all course IDs from:
1. **רשימה א'** — the main elective list (typically ~7 courses)
2. **רשימה ב'** — additional elective courses (typically ~13 courses)

Map all these courses to the `בחירה מביולוגיה כללי` bank, **unless** they are already assigned to `רשימה מביולוגיה א` or `רשימה מביולוגיה ב` (the structured sub-banks).

**Example courses** (from Biology faculty catalog 2025-2026):
- רשימה א': `01340069`, `01340153`, `01340039`, `01340156`, `01340155`, `01340157`, `02760413`
- רשימה ב': `00640615`, `00660418`, `01340049`, `01340088`, `01340140`, `01340141`, `01340147`, `01360042`, `01360088` (plus some that overlap with רשימה א')

**How to avoid**: When extracting the Bioinformatics track, always check the Biology faculty catalog for the full list of elective courses available to fill `בחירה מביולוגיה כללי`. Do not leave this bank empty.

### Pitfall 5: Missing "או" (or) course replacements in cross-faculty tracks

**Problem**: Cross-faculty tracks (e.g., Computer Engineering shared between CS and EE) list many courses with "או" (or) alternatives — the student can take the CS version OR the EE version. If these are not added to `catalog_replacements`, the system will either:
- **חובה (All rule)**: Require the student to take BOTH versions (since both are listed and "All" means take all)
- **ליבה / specialization groups**: Count both versions as separate courses, double-counting credits

**Example** (Computer Engineering 2024-2025): The PDF shows `01040064 או 01040016` for Algebra in חובה. Without a replacement, the system requires both. Similarly, `02360334 או 00440334` in ליבה would count as 2 courses if both are in the bank.

**How to avoid**:
1. Scan the entire track section for "או" between course numbers and "/" separators (e.g., `02360334/00440334`)
2. For EVERY "or" pair, add an entry to `catalog_replacements`: `"CS_COURSE": ["EE_COURSE"]` — prefer 0236/0234 as the key
3. Only the KEY course should be in `course_to_bank` — the VALUE course is handled via the replacement and must NOT be in `course_to_bank`
4. Pay special attention to cross-faculty tracks where this pattern is very common (10-20 pairs)

See the "Handling 'או' (Or) Course Alternatives" section above for detailed guidance and a full example.

### Pitfall 6: קבוצות התמחות having a credit requirement instead of group-only

**Problem**: In some tracks (e.g., Computer Engineering), the PDF lists a total credit requirement under "בחירה פקולטית" that **includes** credits from קבוצות התמחות courses. It's tempting to put a credit requirement on the קבוצות התמחות bank itself (e.g., 27.0), but the actual requirement is only to complete courses from 2 specialization groups — the credit target belongs to בחירה פקולטית.

**Example** (Computer Engineering 2024-2025): The PDF says 26.0-28.0 credits for "מקצועות בחירה פקולטית". This includes all specialization group courses. The correct setup is:
- `קבוצות התמחות`: `credit: null`, rule: `SpecializationGroups` with `groups_number: 2`
- `בחירה פקולטית`: `credit: 28.0`, rule: `AccumulateCredit`
- Overflow: `קבוצות התמחות → בחירה פקולטית` — all specialization credits count toward the 28

**Wrong approach**: Setting `קבוצות התמחות` credit to 27.0 and `בחירה פקולטית` to 0.0.

**How to detect**: Look at the PDF credit breakdown header. If the track does NOT list a separate line for "קבוצות התמחות" credits but instead has a "בחירה פקולטית" line, then specialization group credits flow into בחירה פקולטית.

**Rule of thumb**: קבוצות התמחות should generally have `credit: null` (only the group-count requirement matters). The credit target for elective courses including specialization belongs to בחירה פקולטית.

### Pitfall 7: Projects counted under חובה credit total in PDF

**Problem**: Some tracks (e.g., Computer Engineering) show projects within the חובה credit total in the PDF header (e.g., "112.5-114.5 חובה"), but the projects are actually separate from the regular mandatory courses and have their own selection rules.

**Example** (Computer Engineering 2024-2025): PDF shows 112.5-114.5 for חובה. But the actual mandatory (non-project) courses sum to 106.5, and the remaining 6-8 credits are from 2 projects. The correct setup is:
- `חובה`: `credit: 106.5`, rule: `All` (only non-project mandatory courses)
- `פרויקט`: `credit: 6.0`, rule: `AccumulateCourses: 2`
- Projects overflow to: `פרויקט → בחירה פקולטית`

**How to detect**:
1. Check if the semester tables have dedicated "project semesters" (e.g., semesters 6-7 showing only projects)
2. Sum the non-project mandatory course credits — if significantly less than the PDF's חובה total, the difference is projects
3. Look for variable credit ranges (112.5-114.5) — the range usually comes from projects having variable credits (3 or 4 each)

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
