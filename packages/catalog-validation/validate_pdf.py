"""
validate_pdf.py — Cross-validate a Sogrim catalog JSON against a Technion catalog PDF.

Downloads and parses the PDF, then compares courses and structure to the JSON catalog.
Reports mismatches: missing courses, extra courses, wrong banks, credit discrepancies.

Usage:
    python validate_pdf.py <catalog.json> <pdf_url_or_path> [--verbose]
"""

import sys
import json
import re
import argparse

from pdf_utils import get_pdf_text, pad_course_id


# ── Known bank name mappings from PDF Hebrew headers ──────────────────────────
BANK_HEADER_MAP = {
    "מקצועות חובה": "חובה",
    "מקצועות החובה": "חובה",
    "חובה": "חובה",
    "מקצועות ליבה": "ליבה",
    "רשימת ליבה": "ליבה",
    "ליבה": "ליבה",
    "רשימה א": "רשימה א",
    "רשימה ב": "רשימה ב",
    "פרויקט": "פרויקט",
    "שרשרת": "שרשרת מדעית",
    "שרשראות": "שרשרת מדעית",
    "מקצוע מדעי": "שרשרת מדעית",
    "מקצועות מדעיים": "שרשרת מדעית",
    "בחירת העשרה": "בחירת העשרה",
    "לימודי העשרה": "בחירת העשרה",
    "חינוך גופני": "חינוך גופני",
    "בחירה חופשית": "בחירה חופשית",
}


def extract_se_section(full_text: str) -> str:
    """Extract the Software Engineering track section from the full PDF text.

    Strategy: find the page containing "159.5" credits (SE total), then expand
    to include the full semester tables and elective lists that follow.
    """
    # Primary: find by 159.5 credits anchor (unique to SE track)
    idx_159 = full_text.find("159.5")
    if idx_159 >= 0:
        page_pattern = re.compile(r"=== PAGE (\d+) ===")
        pages = list(page_pattern.finditer(full_text))

        # Find which page contains 159.5
        start_page_pos = 0
        for p in pages:
            if p.start() <= idx_159:
                start_page_pos = p.start()
            else:
                break

        # The SE section spans from this page until the next track
        end_markers = [
            "המסלול להנדסת מחשבים",
            "תוכנית משולבת לתואר במדעי המחשב ובמתמטיקה",
        ]
        end_pos = len(full_text)
        for marker in end_markers:
            idx = full_text.find(marker, start_page_pos + 500)
            if idx >= 0 and idx < end_pos:
                end_pos = idx

        return full_text[start_page_pos:end_pos]

    # Fallback: look for SE track header with flexible spacing
    se_pattern = re.compile(r"המסלול\s+להנדסת\s+תוכנה")
    matches = list(se_pattern.finditer(full_text))

    if matches:
        start_idx = matches[-1].start()
        page_pattern = re.compile(r"=== PAGE (\d+) ===")
        start_page_pos = 0
        for p in page_pattern.finditer(full_text):
            if p.start() <= start_idx:
                start_page_pos = p.start()

        end_markers = [
            "המסלול להנדסת מחשבים",
            "תוכנית משולבת לתואר",
        ]
        end_pos = len(full_text)
        for marker in end_markers:
            idx = full_text.find(marker, start_page_pos + 500)
            if idx >= 0 and idx < end_pos:
                end_pos = idx

        return full_text[start_page_pos:end_pos]

    return ""


def extract_all_course_ids_from_text(text: str) -> set[str]:
    """Extract all 5-8 digit course IDs from text, padded to 8 digits."""
    ids = set()
    for match in re.finditer(r"\b(\d{5,8})\b", text):
        raw = match.group(1)
        if len(raw) >= 5:
            padded = pad_course_id(raw)
            if not padded.startswith("00000"):
                ids.add(padded)
    return ids


def extract_total_credits(text: str) -> float | None:
    """Try to find total credit requirement from PDF text."""
    patterns = [
        r"(\d+(?:\.\d+)?)\s*נקודות\s*לפי הפירוט",
        r"יש לצבור\s*(\d+(?:\.\d+)?)\s*נקודות",
        r"(\d+(?:\.\d+)?)\s*נקודות.*?הפירוט הבא",
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            return float(m.group(1))
    return None


def extract_credit_breakdown(text: str) -> dict[str, float]:
    """Extract the credit breakdown from the SE section header."""
    breakdown = {}
    patterns = [
        (r"(\d+(?:\.\d+)?)\s*נק['\u2019]?\s*מקצועות\s*חובה", "חובה"),
        (r"(\d+(?:\.\d+)?)\s*נק['\u2019]?\s*מקצועות\s*ליבה", "ליבה"),
        (r"(\d+(?:\.\d+)?)\s*נק['\u2019]?\s*מקצועות\s*בחירה\s*פקולטית", "בחירה פקולטית"),
        (r"(\d+(?:\.\d+)?)\s*נק['\u2019]?\s*מקצועות\s*בחירה\s*כלל", "בחירה כלל-טכניונית"),
    ]
    for pat, name in patterns:
        m = re.search(pat, text)
        if m:
            breakdown[name] = float(m.group(1))
    return breakdown


def extract_chova_courses(se_text: str) -> set[str]:
    """Extract course IDs from the חובה semester tables."""
    chova_ids = set()
    lines = se_text.split("\n")
    in_chova = False

    for line in lines:
        stripped = line.strip()
        if "מקצועות החובה" in stripped:
            in_chova = True
            continue
        if in_chova and re.match(r"^מקצועות\s+בחירה$", stripped):
            in_chova = False
            continue
        if in_chova and stripped == "מקצועות ליבה":
            in_chova = False
            continue

        if in_chova:
            for match in re.finditer(r"\b(\d{5,8})\b", line):
                raw = match.group(1)
                if len(raw) >= 5:
                    padded = pad_course_id(raw)
                    if not padded.startswith("00000"):
                        chova_ids.add(padded)

    return chova_ids


def extract_liba_courses(se_text: str) -> set[str]:
    """Extract courses from the ליבה section of the SE track."""
    liba_ids = set()
    lines = se_text.split("\n")
    in_liba = False

    for line in lines:
        stripped = line.strip()
        if stripped == "מקצועות ליבה" or "יש ללמוד 3 קורסים" in stripped:
            in_liba = True
            continue
        if in_liba and (
            "מגמת מצוינות" in stripped
            or "המסלול להנדסת" in stripped
            or stripped.startswith("=== PAGE")
        ):
            break
        if in_liba:
            for match in re.finditer(r"\b(\d{5,8})\b", line):
                raw = match.group(1)
                if len(raw) >= 5:
                    padded = pad_course_id(raw)
                    if not padded.startswith("00000"):
                        liba_ids.add(padded)

    return liba_ids


def validate_against_pdf(catalog: dict, pdf_text: str, verbose: bool = False) -> list[dict]:
    """Cross-validate a catalog JSON against PDF text.

    Returns list of findings: {severity, category, message, details}
    """
    findings = []

    def add(severity: str, category: str, message: str, details: str = ""):
        findings.append({
            "severity": severity,
            "category": category,
            "message": message,
            "details": details,
        })

    # ── 1. Extract SE section from PDF ────────────────────────────────────
    se_text = extract_se_section(pdf_text)
    if not se_text:
        add("ERROR", "extraction", "Could not find SE track section in PDF")
        return findings

    if verbose:
        add("INFO", "extraction", f"Extracted SE section: {len(se_text)} chars")

    # ── 2. Total credits ──────────────────────────────────────────────────
    pdf_total = extract_total_credits(se_text)
    json_total = catalog.get("total_credit")

    if pdf_total is not None:
        if json_total != pdf_total:
            add("ERROR", "total_credit",
                f"Total credits mismatch: JSON={json_total}, PDF={pdf_total}")
        else:
            add("OK", "total_credit", f"Total credits match: {json_total}")

    # ── 3. Credit breakdown ───────────────────────────────────────────────
    breakdown = extract_credit_breakdown(se_text)
    if verbose and breakdown:
        add("INFO", "breakdown", f"PDF breakdown: {breakdown}")

    json_banks = {b["name"]: b.get("credit") for b in catalog.get("course_banks", [])}

    if "חובה" in breakdown and "חובה" in json_banks:
        pdf_chova = breakdown["חובה"]
        json_chova = json_banks.get("חובה", 0) or 0
        json_chain = json_banks.get("שרשרת מדעית", 0) or 0
        combined = json_chova + json_chain
        if combined != pdf_chova and json_chova != pdf_chova:
            add("WARNING", "credits",
                f"חובה credits: JSON חובה={json_chova} + שרשרת={json_chain} = {combined}, PDF={pdf_chova}",
                "PDF 'חובה' often includes scientific chain credits")
        else:
            add("OK", "credits", f"חובה credits consistent: {pdf_chova}")

    # ── 4. Course-level comparison: חובה ──────────────────────────────────
    json_courses = catalog.get("course_to_bank", {})
    pdf_chova_ids = extract_chova_courses(se_text)
    json_chova_ids = {cid for cid, bank in json_courses.items() if bank == "חובה"}

    missing_in_json_chova = pdf_chova_ids - json_chova_ids
    json_chain_ids = {cid for cid, bank in json_courses.items() if bank == "שרשרת מדעית"}
    missing_after_chain = missing_in_json_chova - json_chain_ids
    all_json_ids = set(json_courses.keys())
    truly_missing = missing_after_chain - all_json_ids

    # Check replacement coverage
    all_replacements = {}
    for field in ["catalog_replacements", "common_replacements"]:
        for cid, replacements in catalog.get(field, {}).items():
            for rid in replacements:
                all_replacements[rid] = cid
            all_replacements[cid] = cid

    covered_by_replacement = set()
    still_missing = set()
    for cid in truly_missing:
        if cid in all_replacements:
            covered_by_replacement.add(cid)
        else:
            found = False
            for field in ["catalog_replacements", "common_replacements"]:
                for orig, repls in catalog.get(field, {}).items():
                    if cid in repls or cid == orig:
                        covered_by_replacement.add(cid)
                        found = True
                        break
                if found:
                    break
            if not found:
                still_missing.add(cid)

    if still_missing:
        add("ERROR", "חובה_courses",
            f"{len(still_missing)} חובה courses in PDF but missing from JSON entirely",
            f"IDs: {sorted(still_missing)}")

    if covered_by_replacement and verbose:
        for cid in sorted(covered_by_replacement):
            add("INFO", "חובה_replacement",
                f"PDF חובה course {cid} covered by catalog replacement")

    reclassified = missing_in_json_chova & all_json_ids - json_chova_ids
    if reclassified and verbose:
        for cid in sorted(reclassified):
            json_bank = json_courses.get(cid, "N/A")
            add("INFO", "חובה_reclassified",
                f"PDF חובה course {cid} is in JSON bank '{json_bank}'")

    if not still_missing:
        details = []
        if reclassified:
            details.append(f"{len(reclassified)} in different banks")
        if covered_by_replacement:
            details.append(f"{len(covered_by_replacement)} covered by replacements")
        extra = f" ({', '.join(details)})" if details else ""
        add("OK", "חובה_courses",
            f"All {len(pdf_chova_ids)} PDF חובה courses accounted for{extra}")

    # ── 5. ליבה courses ───────────────────────────────────────────────────
    pdf_liba = extract_liba_courses(se_text)
    json_liba = {cid for cid, bank in json_courses.items() if bank == "ליבה"}

    missing_liba = pdf_liba - json_liba
    extra_liba = json_liba - pdf_liba

    if missing_liba:
        missing_entirely = missing_liba - all_json_ids
        in_wrong_bank = missing_liba & all_json_ids
        if missing_entirely:
            add("ERROR", "ליבה_courses",
                f"{len(missing_entirely)} ליבה courses in PDF missing from JSON",
                f"IDs: {sorted(missing_entirely)}")
        if in_wrong_bank:
            for cid in sorted(in_wrong_bank):
                add("WARNING", "ליבה_courses",
                    f"PDF ליבה course {cid} is in JSON bank '{json_courses[cid]}' instead of 'ליבה'")
    else:
        add("OK", "ליבה_courses", f"All {len(pdf_liba)} PDF ליבה courses match JSON")

    if extra_liba:
        add("WARNING", "ליבה_courses",
            f"{len(extra_liba)} JSON ליבה courses not found in PDF ליבה section",
            f"IDs: {sorted(extra_liba)}")

    # ── 6. Overall course presence check ──────────────────────────────────
    all_pdf_ids = extract_all_course_ids_from_text(se_text)

    json_only = all_json_ids - all_pdf_ids
    json_only_important = {
        cid for cid in json_only
        if json_courses.get(cid) in {"חובה", "ליבה"}
    }
    json_only_chain = {
        cid for cid in json_only
        if json_courses.get(cid) == "שרשרת מדעית"
    }

    if json_only_important:
        add("WARNING", "coverage",
            f"{len(json_only_important)} JSON חובה/ליבה courses not found in SE PDF section",
            f"IDs: {sorted(json_only_important)}")

    if json_only_chain and verbose:
        add("INFO", "coverage",
            f"{len(json_only_chain)} שרשרת מדעית courses not in SE section (expected, defined in general track)",
            f"IDs: {sorted(json_only_chain)}")

    if verbose:
        add("INFO", "coverage",
            f"JSON total courses: {len(all_json_ids)}, "
            f"PDF SE section IDs: {len(all_pdf_ids)}, "
            f"JSON-only: {len(json_only)}")

    # ── 7. Bank structure check ───────────────────────────────────────────
    expected_banks = {"חובה", "שרשרת מדעית", "ליבה", "רשימה א", "פרויקט",
                      "רשימה ב", "בחירת העשרה", "חינוך גופני", "בחירה חופשית"}
    actual_banks = set(json_banks.keys())

    missing_banks = expected_banks - actual_banks
    extra_banks = actual_banks - expected_banks

    if missing_banks:
        add("ERROR", "banks", f"Missing expected banks: {missing_banks}")
    if extra_banks:
        add("INFO", "banks", f"Extra banks in JSON (may be OK): {extra_banks}")
    if not missing_banks:
        add("OK", "banks", "All expected banks present in JSON")

    # ── 8. Scientific chain structure ─────────────────────────────────────
    chain_bank = next((b for b in catalog.get("course_banks", []) if b["name"] == "שרשרת מדעית"), None)
    if chain_bank:
        rule = chain_bank.get("rule", {})
        if isinstance(rule, dict) and "Chains" in rule:
            chains = rule["Chains"]
            add("OK", "chains", f"Scientific chain has {len(chains)} chain options")
        else:
            add("WARNING", "chains",
                f"שרשרת מדעית rule is not Chains type: {type(rule)}")

    # ── 9. Credit overflows ───────────────────────────────────────────────
    overflows = catalog.get("credit_overflows", [])
    if overflows:
        add("OK", "overflows", f"{len(overflows)} credit overflow rules defined")
    else:
        add("WARNING", "overflows", "No credit overflow rules defined")

    # ── 10. ליבה rule check ───────────────────────────────────────────────
    liba_bank = next((b for b in catalog.get("course_banks", []) if b["name"] == "ליבה"), None)
    if liba_bank:
        rule = liba_bank.get("rule", {})
        if isinstance(rule, dict) and "AccumulateCourses" in rule:
            req = rule["AccumulateCourses"]
            count = int(req.get("$numberLong", req) if isinstance(req, dict) else req)
            add("OK", "ליבה_rule", f"ליבה requires {count} courses (PDF says 3)")
            if count != 3:
                add("WARNING", "ליבה_rule",
                    f"ליבה requires {count} courses but PDF says 3")
        else:
            add("WARNING", "ליבה_rule", f"ליבה rule unexpected format: {rule}")

    return findings


def format_findings(findings: list[dict]) -> str:
    """Format findings for console output."""
    icons = {"ERROR": "❌", "WARNING": "⚠️", "OK": "✅", "INFO": "ℹ️"}
    lines = []

    for severity in ["ERROR", "WARNING", "OK", "INFO"]:
        group = [f for f in findings if f["severity"] == severity]
        if group:
            lines.append(f"\n{'=' * 60}")
            lines.append(f" {icons[severity]}  {severity} ({len(group)})")
            lines.append(f"{'=' * 60}")
            for f in group:
                lines.append(f"  [{f['category']}] {f['message']}")
                if f.get("details"):
                    lines.append(f"    → {f['details']}")

    errors = sum(1 for f in findings if f["severity"] == "ERROR")
    warnings = sum(1 for f in findings if f["severity"] == "WARNING")
    oks = sum(1 for f in findings if f["severity"] == "OK")

    lines.append(f"\n{'─' * 60}")
    lines.append(f"Summary: {errors} errors, {warnings} warnings, {oks} passed")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="Cross-validate catalog JSON against Technion PDF"
    )
    parser.add_argument("catalog", help="Path to catalog JSON file")
    parser.add_argument("pdf", help="URL or local path to PDF")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Show detailed info messages")
    parser.add_argument("--json-output", "-j", help="Write findings as JSON to file")
    args = parser.parse_args()

    with open(args.catalog, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    pdf_text = get_pdf_text(args.pdf)

    findings = validate_against_pdf(catalog, pdf_text, verbose=args.verbose)

    print(format_findings(findings))

    if args.json_output:
        with open(args.json_output, "w", encoding="utf-8") as f:
            json.dump(findings, f, ensure_ascii=False, indent=2)
        print(f"\nWrote findings to {args.json_output}")

    errors = sum(1 for f in findings if f["severity"] == "ERROR")
    sys.exit(1 if errors > 0 else 0)


if __name__ == "__main__":
    main()
