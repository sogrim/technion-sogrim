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


# ── Track configurations ──────────────────────────────────────────────────────
# keywords: matched against catalog name/description to detect track type
# header_pattern: regex to find the track section header in the PDF
# expected_banks: banks that must appear in the JSON
# chova_includes: JSON banks whose credits the PDF counts under "חובה"
TRACK_CONFIGS = {
    "cyber": {
        "keywords": ["סייבר"],
        "header_pattern": re.compile(r"מגמת\s+סייבר\s+ואבטחת\s+מערכות\s+ממוחשבות"),
        "expected_banks": {
            "חובה", "שרשרת מדעית", "ליבה", "רשימה א", "רשימה ב",
            "פרויקט סייבר", "פרויקט/סמינר", "בחירת העשרה", "חינוך גופני", "בחירה חופשית",
        },
        "chova_includes": ["חובה", "שרשרת מדעית", "מתמטי נוסף"],
    },
    "se": {
        "keywords": ["הנדסת תוכנה", "תוכנה"],
        "header_pattern": re.compile(r"המסלול\s+להנדסת\s+תוכנה"),
        "expected_banks": {
            "חובה", "שרשרת מדעית", "ליבה", "רשימה א", "פרויקט",
            "רשימה ב", "בחירת העשרה", "חינוך גופני", "בחירה חופשית",
        },
        "chova_includes": ["חובה", "שרשרת מדעית"],
    },
    "ce": {
        "keywords": ["הנדסת מחשבים"],
        "header_pattern": re.compile(r"המסלול\s+להנדסת\s+מחשבים"),
        "expected_banks": {
            "חובה", "ליבה", "קבוצות התמחות", "בחירה פקולטית", "פרויקט",
            "בחירת העשרה", "חינוך גופני", "בחירה חופשית",
        },
        "chova_includes": ["חובה", "פרויקט"],
    },
    "data": {
        "keywords": ["למידה וניתוח מידע", "מידע"],
        "header_pattern": re.compile(r"המגמה\s+ללמידה\s+וניתוח\s+מידע"),
        "expected_banks": {
            "חובה", "שרשרת מדעית", "ליבה", "רשימה א", "פרויקט",
            "בחירת העשרה", "חינוך גופני", "בחירה חופשית",
        },
        "chova_includes": ["חובה", "שרשרת מדעית"],
    },
    "general_3yr": {
        "keywords": ["כללי תלת", "תלת שנתי", "תלת-שנתי"],
        "header_pattern": re.compile(r"תוכנית\s+לימודים\s+במסלול\s+כללי\s+תלת"),
        "expected_banks": {
            "חובה", "שרשרת מדעית", "מתמטי נוסף", "רשימה א", "פרויקט",
            "רשימה ב", "בחירת העשרה", "חינוך גופני", "בחירה חופשית",
        },
        "chova_includes": ["חובה", "שרשרת מדעית", "מתמטי נוסף"],
    },
    "general_4yr": {
        "keywords": ["כללי ארבע", "מסלול כללי"],
        "header_pattern": re.compile(r"תוכנית\s+לימודים\s+במסלול\s+כללי\s+ארבע"),
        "expected_banks": {
            "חובה", "שרשרת מדעית", "רשימה א", "פרויקט",
            "רשימה ב", "בחירת העשרה", "חינוך גופני", "בחירה חופשית",
        },
        "chova_includes": ["חובה", "שרשרת מדעית"],
    },
    "bioinfo": {
        "keywords": ["ביואינפורמטיקה"],
        "header_pattern": re.compile(r"המגמה\s+למדעי\s+המחשב\s+עם\s+התמקדות\s+בביואינפורמטיקה"),
        "expected_banks": {
            "חובה", "רשימה א", "רשימה מביולוגיה א", "רשימה מביולוגיה ב",
            "בחירה מביולוגיה כללי", "בחירת העשרה", "חינוך גופני", "בחירה חופשית",
        },
        "chova_includes": ["חובה"],
    },
}

# All known section headers used to detect section boundaries
ALL_SECTION_HEADERS = [
    "מגמת סייבר ואבטחת מערכות ממוחשבות",
    "המסלול להנדסת תוכנה",
    "המסלול להנדסת מחשבים",
    "תוכנית לימודים במסלול כללי תלת-שנתי",
    "תוכנית לימודים במסלול כללי ארבע-שנתי",
    "תוכנית משולבת לתואר במדעי המחשב ובמתמטיקה",
    "תוכנית משולבת לתואר במדעי המחשב ובפיזיקה",
    "תוכנית לימודים משולבת לתואר בוגר למדעים",
    "תוכנית לימודים משולבת לתואר מוסמך",
    "המגמה ללמידה וניתוח מידע",
    "המגמה למדעי המחשב עם התמקדות בביואינפורמטיקה",
    "מגמת מצוינות",
    "תוכנית לתואר כפול",
]


def detect_track_type(catalog: dict) -> str:
    """Detect the track type from catalog name and description."""
    text = catalog.get("name", "") + " " + catalog.get("description", "")
    for track_id, config in TRACK_CONFIGS.items():
        for keyword in config["keywords"]:
            if keyword in text:
                return track_id
    return "se"  # default fallback


def get_track_config(track_type: str) -> dict:
    """Get configuration for a track type, with SE as fallback."""
    return TRACK_CONFIGS.get(track_type, TRACK_CONFIGS["se"])


def _find_page_start(full_text: str, pos: int) -> int:
    """Find the start of the page containing the given position."""
    page_pattern = re.compile(r"=== PAGE (\d+) ===")
    page_start = 0
    for p in page_pattern.finditer(full_text):
        if p.start() <= pos:
            page_start = p.start()
        else:
            break
    return page_start


def _find_section_end(full_text: str, start_pos: int, own_header: str) -> int:
    """Find where the next track section begins after start_pos.

    Only considers markers that appear at the start of a line (preceded by
    newline + optional whitespace), to avoid matching incidental mentions
    within sentences.
    """
    end_pos = len(full_text)
    for marker in ALL_SECTION_HEADERS:
        if marker == own_header:
            continue
        search_from = start_pos + 500
        while True:
            idx = full_text.find(marker, search_from)
            if idx < 0 or idx >= end_pos:
                break
            # Check if this is at the start of a line
            pre = full_text[max(0, idx - 40):idx]
            last_nl = pre.rfind("\n")
            if last_nl >= 0 and pre[last_nl + 1:].strip() == "":
                # Marker is preceded by newline + only whitespace → real header
                end_pos = idx
                break
            elif idx == 0:
                end_pos = idx
                break
            # Not a line-start match, keep searching
            search_from = idx + 1
    return end_pos


def extract_track_section(full_text: str, catalog: dict) -> tuple[str, str]:
    """Extract the track section matching the given catalog from the PDF text.

    Returns (section_text, track_type).
    Uses catalog name/description to detect the track, then finds it in the PDF
    by matching the header pattern near the expected credit total.
    """
    track_type = detect_track_type(catalog)
    config = get_track_config(track_type)
    header_pattern = config["header_pattern"]
    total_credit = catalog.get("total_credit")

    # Find all occurrences of the track header
    matches = list(header_pattern.finditer(full_text))

    if not matches:
        # Fallback: try the legacy SE extraction
        return _extract_se_section_legacy(full_text), "se"

    # If multiple matches, prefer the one near the credit total
    best_match = matches[-1]  # default to last (section header, not intro mention)
    if total_credit and len(matches) > 1:
        credit_str = str(int(total_credit)) if total_credit == int(total_credit) else str(total_credit)
        # Iterate in reverse: later occurrences are more likely the actual section
        for m in reversed(matches):
            nearby = full_text[m.start():m.start() + 2000]
            if credit_str in nearby:
                best_match = m
                break

    start_pos = best_match.start()
    own_header = best_match.group()
    end_pos = _find_section_end(full_text, start_pos, own_header)

    return full_text[start_pos:end_pos], track_type


def _extract_se_section_legacy(full_text: str) -> str:
    """Legacy SE extraction for backward compatibility."""
    idx_159 = full_text.find("159.5")
    if idx_159 >= 0:
        start_page_pos = _find_page_start(full_text, idx_159)
        end_markers = [
            "המסלול להנדסת מחשבים",
            "תוכנית משולבת לתואר במדעי המחשב ובמתמטיקה",
        ]
        end_pos = len(full_text)
        for marker in end_markers:
            idx = full_text.find(marker, start_page_pos + 500)
            if 0 <= idx < end_pos:
                end_pos = idx
        return full_text[start_page_pos:end_pos]

    se_pattern = re.compile(r"המסלול\s+להנדסת\s+תוכנה")
    matches = list(se_pattern.finditer(full_text))
    if matches:
        start_pos = _find_page_start(full_text, matches[-1].start())
        end_markers = [
            "המסלול להנדסת מחשבים",
            "תוכנית משולבת לתואר",
        ]
        end_pos = len(full_text)
        for marker in end_markers:
            idx = full_text.find(marker, start_pos + 500)
            if 0 <= idx < end_pos:
                end_pos = idx
        return full_text[start_pos:end_pos]

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
            for match in re.finditer(r"\b(\d{7,8})\b", line):
                raw = match.group(1)
                padded = pad_course_id(raw)
                if not padded.startswith("00000"):
                    chova_ids.add(padded)

    return chova_ids


def extract_liba_courses(track_text: str) -> set[str]:
    """Extract courses from the ליבה section of the track."""
    liba_ids = set()
    lines = track_text.split("\n")
    in_liba = False

    for line in lines:
        stripped = line.strip()
        if stripped == "מקצועות ליבה" or ("יש ללמוד" in stripped and "קורסים" in stripped):
            in_liba = True
            liba_ids.clear()  # Reset — only keep IDs from the LAST ליבה section
            continue
        if in_liba and (
            "מגמת מצוינות" in stripped
            or "המסלול להנדסת" in stripped
            or "המגמה ל" in stripped
            or "תוכנית לימודים" in stripped
            or stripped.startswith("=== PAGE")
            or "מקצועות בחירה" in stripped
            or "קבוצות התמחות" in stripped
        ):
            in_liba = False
            continue
        if in_liba:
            for match in re.finditer(r"\b(\d{5,8})\b", line):
                raw = match.group(1)
                if len(raw) >= 5:
                    padded = pad_course_id(raw)
                    if not padded.startswith("00000"):
                        liba_ids.add(padded)

    # Handle broken course IDs split across lines (e.g., "341\n0\n236\n0")
    # Re-scan the ליבה block as a single string to catch fragmented IDs
    # Use the LAST "מקצועות ליבה" occurrence (skip introduction mentions)
    liba_start = None
    liba_end = None
    for i, line in enumerate(lines):
        stripped = line.strip()
        if stripped == "מקצועות ליבה":
            liba_start = i
            liba_end = None
    if liba_start:
        for i in range(liba_start + 1, len(lines)):
            stripped = lines[i].strip()
            if (
                stripped.startswith("=== PAGE")
                or "המסלול להנדסת" in stripped
                or "המגמה ל" in stripped
                or "תוכנית לימודים" in stripped
                or "מקצועות בחירה" in stripped
                or "קבוצות התמחות" in stripped
            ):
                liba_end = i
                break
    if liba_start and liba_end:
        block = " ".join(lines[liba_start:liba_end])
        # RTL rendering splits IDs: "341 0 236 0" → read RTL as "0 236 0 341" → 02360341
        for match in re.finditer(r"\b(\d{3,4})\s+0\s+(\d{3})\s+0\b", block):
            reconstructed = "0" + match.group(2) + "0" + match.group(1)
            padded = pad_course_id(reconstructed)
            if len(padded) == 8 and not padded.startswith("00000"):
                liba_ids.add(padded)

    return liba_ids


def extract_liba_course_count_from_pdf(track_text: str) -> int | None:
    """Extract the required number of ליבה courses from the PDF text."""
    m = re.search(r"יש ללמוד\s+(\d+)\s+קורסים", track_text)
    if m:
        return int(m.group(1))
    return None


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

    # ── 1. Extract track section from PDF ─────────────────────────────────
    track_text, track_type = extract_track_section(pdf_text, catalog)
    track_config = get_track_config(track_type)

    if not track_text:
        add("ERROR", "extraction", "Could not find track section in PDF")
        return findings

    if verbose:
        add("INFO", "extraction",
            f"Extracted {track_type} section: {len(track_text)} chars")

    # ── 2. Total credits ──────────────────────────────────────────────────
    pdf_total = extract_total_credits(track_text)
    json_total = catalog.get("total_credit")

    if pdf_total is not None:
        if json_total != pdf_total:
            add("ERROR", "total_credit",
                f"Total credits mismatch: JSON={json_total}, PDF={pdf_total}")
        else:
            add("OK", "total_credit", f"Total credits match: {json_total}")

    # ── 3. Credit breakdown ───────────────────────────────────────────────
    breakdown = extract_credit_breakdown(track_text)
    if verbose and breakdown:
        add("INFO", "breakdown", f"PDF breakdown: {breakdown}")

    json_banks = {b["name"]: b.get("credit") for b in catalog.get("course_banks", [])}

    # PDF's "חובה" may include multiple JSON banks (e.g., שרשרת + מתמטי נוסף)
    chova_bank_names = track_config.get("chova_includes", ["חובה", "שרשרת מדעית"])

    if "חובה" in breakdown and "חובה" in json_banks:
        pdf_chova = breakdown["חובה"]
        json_combined = sum(json_banks.get(b, 0) or 0 for b in chova_bank_names)
        json_chova_only = json_banks.get("חובה", 0) or 0
        if json_combined == pdf_chova or json_chova_only == pdf_chova:
            details = ""
            if json_combined != json_chova_only and json_combined == pdf_chova:
                parts = [f"{b}={json_banks.get(b, 0) or 0}" for b in chova_bank_names]
                details = f"JSON {' + '.join(parts)} = {json_combined}"
            add("OK", "credits", f"חובה credits consistent: {pdf_chova}",
                details)
        else:
            parts = [f"{b}={json_banks.get(b, 0) or 0}" for b in chova_bank_names]
            add("WARNING", "credits",
                f"חובה credits: JSON {' + '.join(parts)} = {json_combined}, PDF={pdf_chova}",
                "PDF 'חובה' may include scientific chain / math credits")

    # ── 4. Course-level comparison: חובה ──────────────────────────────────
    json_courses = catalog.get("course_to_bank", {})
    pdf_chova_ids = extract_chova_courses(track_text)
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
    pdf_liba = extract_liba_courses(track_text)
    json_liba = {cid for cid, bank in json_courses.items() if bank == "ליבה"}

    # Build reverse replacement map: value → key
    reverse_replacements = {}
    for field in ["catalog_replacements", "common_replacements"]:
        for key_cid, vals in catalog.get(field, {}).items():
            for val_cid in vals:
                reverse_replacements[val_cid] = key_cid

    # A PDF ליבה course is covered if it's in json_liba OR its replacement key is
    missing_liba = set()
    covered_by_repl_liba = set()
    for cid in pdf_liba:
        if cid in json_liba:
            continue
        if cid in reverse_replacements and reverse_replacements[cid] in json_liba:
            covered_by_repl_liba.add(cid)
        else:
            missing_liba.add(cid)

    extra_liba = json_liba - pdf_liba

    if covered_by_repl_liba and verbose:
        for cid in sorted(covered_by_repl_liba):
            add("INFO", "ליבה_replacement",
                f"PDF ליבה course {cid} covered by replacement → {reverse_replacements[cid]}")

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
        add("OK", "ליבה_courses",
            f"All {len(pdf_liba)} PDF ליבה courses match JSON"
            + (f" ({len(covered_by_repl_liba)} via replacements)" if covered_by_repl_liba else ""))

    if extra_liba:
        add("WARNING", "ליבה_courses",
            f"{len(extra_liba)} JSON ליבה courses not found in PDF ליבה section",
            f"IDs: {sorted(extra_liba)}")

    # ── 6. Overall course presence check ──────────────────────────────────
    all_pdf_ids = extract_all_course_ids_from_text(track_text)

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
            f"{len(json_only_important)} JSON חובה/ליבה courses not found in {track_type} PDF section",
            f"IDs: {sorted(json_only_important)}")

    if json_only_chain and verbose:
        add("INFO", "coverage",
            f"{len(json_only_chain)} שרשרת מדעית courses not in {track_type} section (expected, defined in general track)",
            f"IDs: {sorted(json_only_chain)}")

    if verbose:
        add("INFO", "coverage",
            f"JSON total courses: {len(all_json_ids)}, "
            f"PDF {track_type} section IDs: {len(all_pdf_ids)}, "
            f"JSON-only: {len(json_only)}")

    # ── 7. Bank structure check ───────────────────────────────────────────
    expected_banks = track_config.get("expected_banks", set())
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
            pdf_liba_count = extract_liba_course_count_from_pdf(track_text)
            if pdf_liba_count is not None:
                if count == pdf_liba_count:
                    add("OK", "ליבה_rule",
                        f"ליבה requires {count} courses (PDF says {pdf_liba_count})")
                else:
                    add("WARNING", "ליבה_rule",
                        f"ליבה requires {count} courses but PDF says {pdf_liba_count}")
            else:
                add("OK", "ליבה_rule",
                    f"ליבה requires {count} courses (could not extract PDF count)")
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
