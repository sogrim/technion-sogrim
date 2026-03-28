---
name: catalog-search
description: Search for a Technion faculty catalog PDF, discover all degree tracks, extract each into JSON, and validate. Use when asked to find, search for, or batch-extract Technion catalogs.
allowed-tools: Read, Write, Edit, Bash(uv run *), Bash(cd *), Glob, Grep, WebSearch, WebFetch, Agent, TeamCreate, SendMessage
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

   The CS catalog PDF is typically hosted under `wp-content/uploads/` on the CS undergraduate site. The filename contains the Hebrew faculty name and Hebrew academic year abbreviation (e.g., `הפקולטה-למדעי-המחשב-תשפ״ה`).

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

| Faculty (English) | Faculty (Hebrew) | Search term |
|---|---|---|
| Computer Science | מדעי המחשב | מדעי המחשב |

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

1. **Extract the raw text**:
   ```bash
   uv run --project packages/catalog-extractor extract_pdf.py "<pdf_url>" --output raw_text.txt
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

## Step 3: Extract Each Track (via Teammate Agents)

**IMPORTANT**: Use **TeamCreate** to spawn teammate agents for extraction — do NOT use regular background agents. Teammates provide a shared task list, the user can cycle through them with Shift+Down, and they can coordinate via SendMessage.

For **each track** found in Step 2, spawn a **teammate** that runs the catalog-extractor skill:

1. **Determine the track parameters**:
   - `name`: Hebrew catalog name (e.g., `"מדמח תלת שנתי 2024-2025"`)
   - `output`: File path following the naming convention: `packages/docs/{Faculty}{Track}{Year}.json`
   - `reference`: Use the most recent existing catalog of the same track as a reference (if available in `packages/docs/`)

2. **Spawn extraction teammates** — one per track, all in parallel. Each teammate prompt MUST include:
   - A pointer to read `.claude/skills/catalog-extractor/SKILL.md` for extraction guidelines
   - The PDF URL or raw text path (`/tmp/<name>_raw.txt`)
   - The reference catalog path
   - The output file path
   - The relevant line range in the raw text for this track's section
   ```
   Create an agent team. Spawn an extractor teammate for each track:
   - Extractor-4yr: "Read .claude/skills/catalog-extractor/SKILL.md for guidelines. Extract the 4-year track. Raw text at /tmp/cs_raw.txt lines 418-3044. Reference: packages/docs/ComputerScience4years2024-2025.json. Output: packages/docs/ComputerScience4years2025-2026.json"
   - Extractor-3yr: "Read .claude/skills/catalog-extractor/SKILL.md for guidelines. Extract the 3-year track ..."
   - (one per track)
   ```

3. Each teammate should **start from the reference catalog** and update it based on the new PDF, following the catalog-extractor skill guidelines (from the SKILL.md file) to fill in:
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

## Step 4: Validate Each Track (Agent Team)

### CRITICAL: Context Isolation via Agent Teams

Validation **MUST** run with no history from the extraction phase to prevent bias. Use **agent teams** to spawn a validator teammate — each teammate gets a completely fresh context window with zero extraction history.

**How to do this:**

After all tracks are extracted in Steps 1-3, create an agent team for validation:

1. **Spawn a validator teammate** for each extracted catalog. Each prompt MUST include a pointer to read `.claude/skills/catalog-validation/SKILL.md` for validation guidelines:
   ```
   Create an agent team. Spawn a validator teammate for each catalog:
   - Validator-3yr: "Read .claude/skills/catalog-validation/SKILL.md for guidelines. Validate packages/docs/ComputerScience3years2025-2026.json against <pdf_url>. Run uv run --project packages/catalog-validation validate_all.py ... --verbose. Fix any ERRORs and re-validate until clean."
   - Validator-4yr: "Read .claude/skills/catalog-validation/SKILL.md for guidelines. Validate packages/docs/ComputerScience4years2025-2026.json against <pdf_url> ..."
   - (one per catalog)
   ```

2. **Each teammate runs independently** — they read the JSON and PDF with fresh eyes, no extraction context leaking in. They can fix ERRORs autonomously and re-validate.

3. **Wait for all validators to complete**, then collect their findings.

4. **Cross-check between tracks**: After all tracks are validated individually, do a quick sanity check:
   - חובה (mandatory) courses for 3-year should be a subset of 4-year (4-year has more requirements)
   - Common replacements should be consistent across tracks of the same year
   - Credit overflows should follow the standard patterns for each track type

### Monitoring Validation

- Press **Shift+Down** to cycle through validator teammates
- Press **Ctrl+T** to see the shared task list
- Send direct messages to steer a teammate: `Message Validator-3yr: "The שרשרת מדעית warning is a false positive, skip it"`

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

### Phase 1 — Search & Extract via Teammate Agents (Steps 1-3)
1. Browse `https://undergraduate.cs.technion.ac.il/` for PDF links -> find the catalog PDF
2. Extract PDF text -> discover tracks: 3-year, 4-year, Software Engineering, Data Science
3. Create an agent team with one extractor teammate per track (all run in parallel)
4. Each extractor reads its reference catalog + relevant PDF sections, builds updated JSON

### Phase 2 — Validate via Agent Team (Step 4, same conversation)
4. Create an agent team with one validator teammate per extracted catalog
5. Each validator runs in a fresh context — reads the JSON and PDF independently, fixes errors, re-validates
6. Wait for all validators to finish, collect findings
7. Cross-check between tracks for consistency
8. Produce summary report
