"""
validate_schema.py — Validate a Sogrim catalog JSON file structure.

Checks:
- Required fields present
- All course IDs are 8-digit zero-padded
- Every course in course_to_bank maps to a valid bank name
- All banks in course_banks have courses in course_to_bank
- credit_overflows references valid bank names
- Replacement course IDs are well-formed

Usage:
    python validate_schema.py <catalog.json> [--json-output findings.json]
"""

import sys
import json
import re
import argparse


REQUIRED_FIELDS = [
    "_id", "name", "faculty", "total_credit", "description",
    "course_banks", "credit_overflows", "course_to_bank",
    "catalog_replacements", "common_replacements",
]

VALID_FACULTIES = ["ComputerScience", "DataAndDecisionScience", "Medicine", "Unknown"]

# Banks where having zero courses in course_to_bank is acceptable
SKIP_COURSE_CHECK_BANKS = {"בחירת העשרה", "חינוך גופני", "בחירה חופשית"}


def validate_schema(catalog: dict) -> list[dict]:
    """Validate a catalog dict structure.

    Returns list of findings: {severity, category, message, details}.
    """
    findings = []

    def add(severity: str, category: str, message: str, details: str = ""):
        findings.append({
            "severity": severity,
            "category": category,
            "message": message,
            "details": details,
        })

    # ── Required fields ───────────────────────────────────────────────────
    missing_fields = [f for f in REQUIRED_FIELDS if f not in catalog]
    if missing_fields:
        add("ERROR", "schema", f"Missing required fields: {missing_fields}")
    else:
        add("OK", "schema", "All required fields present")

    # ── Faculty ───────────────────────────────────────────────────────────
    faculty = catalog.get("faculty")
    if faculty not in VALID_FACULTIES:
        add("ERROR", "faculty", f"Invalid faculty: {faculty}", f"Must be one of {VALID_FACULTIES}")
    else:
        add("OK", "faculty", f"Faculty valid: {faculty}")

    # ── Total credit ──────────────────────────────────────────────────────
    tc = catalog.get("total_credit")
    if tc is not None and (not isinstance(tc, (int, float)) or tc <= 0):
        add("ERROR", "total_credit", f"total_credit should be a positive number, got: {tc}")
    elif tc is not None:
        add("OK", "total_credit", f"total_credit: {tc}")

    # ── Course banks ──────────────────────────────────────────────────────
    bank_names = set()
    for bank in catalog.get("course_banks", []):
        if "name" not in bank:
            add("ERROR", "banks", f"Course bank missing 'name': {bank}")
        else:
            bank_names.add(bank["name"])
        if "rule" not in bank:
            add("ERROR", "banks", f"Course bank '{bank.get('name', '?')}' missing 'rule'")

    if bank_names:
        add("OK", "banks", f"{len(bank_names)} course banks defined")

    # ── Course IDs: 8-digit format ────────────────────────────────────────
    course_to_bank = catalog.get("course_to_bank", {})
    bad_ids = []
    bad_bank_refs = []
    for cid, bank in course_to_bank.items():
        if not re.match(r"^\d{8}$", cid):
            bad_ids.append(cid)
        if bank not in bank_names:
            bad_bank_refs.append((cid, bank))

    if bad_ids:
        add("ERROR", "course_ids",
            f"{len(bad_ids)} course IDs not 8-digit zero-padded",
            f"Examples: {bad_ids[:5]}")
    else:
        add("OK", "course_ids", f"All {len(course_to_bank)} course IDs are 8-digit zero-padded")

    if bad_bank_refs:
        add("ERROR", "course_banks",
            f"{len(bad_bank_refs)} courses reference unknown banks",
            f"Examples: {bad_bank_refs[:5]}")

    # ── Banks have courses ────────────────────────────────────────────────
    banks_with_courses = set(course_to_bank.values())
    empty_banks = [
        bn for bn in bank_names
        if bn not in SKIP_COURSE_CHECK_BANKS and bn not in banks_with_courses
    ]
    if empty_banks:
        add("WARNING", "empty_banks",
            f"{len(empty_banks)} banks have no courses in course_to_bank",
            f"Banks: {empty_banks}")
    else:
        add("OK", "bank_coverage", "All non-special banks have courses")

    # ── Credit overflows ──────────────────────────────────────────────────
    overflow_errors = []
    for overflow in catalog.get("credit_overflows", []):
        if overflow.get("from") not in bank_names:
            overflow_errors.append(f"from='{overflow.get('from')}'")
        if overflow.get("to") not in bank_names:
            overflow_errors.append(f"to='{overflow.get('to')}'")

    if overflow_errors:
        add("ERROR", "overflows",
            f"credit_overflows reference unknown banks: {overflow_errors}")
    elif catalog.get("credit_overflows"):
        add("OK", "overflows",
            f"{len(catalog['credit_overflows'])} overflow rules valid")

    # ── Replacements ──────────────────────────────────────────────────────
    repl_errors = []
    repl_warnings = []
    course_to_bank = catalog.get("course_to_bank", {})
    for field in ["catalog_replacements", "common_replacements"]:
        for cid, replacements in catalog.get(field, {}).items():
            if not re.match(r"^\d{8}$", cid):
                repl_errors.append(f"{field}: key '{cid}'")
            if not isinstance(replacements, list):
                repl_errors.append(f"{field}: value for '{cid}' not a list")
            else:
                for rid in replacements:
                    if not re.match(r"^\d{8}$", rid):
                        repl_errors.append(f"{field}: replacement '{rid}'")
                    if rid in course_to_bank:
                        repl_warnings.append(
                            f"{field}: value '{rid}' (replaces '{cid}') "
                            f"should not be in course_to_bank "
                            f"(found in bank '{course_to_bank[rid]}')")

    if repl_errors:
        add("ERROR", "replacements",
            f"{len(repl_errors)} replacement ID issues",
            f"Examples: {repl_errors[:5]}")
    elif repl_warnings:
        add("WARNING", "replacements",
            f"Replacement values found in course_to_bank "
            f"(values should only appear in replacements, not in course_to_bank)",
            "\n    ".join(repl_warnings[:5]))
    else:
        cat_count = len(catalog.get("catalog_replacements", {}))
        com_count = len(catalog.get("common_replacements", {}))
        add("OK", "replacements",
            f"Replacements valid ({cat_count} catalog, {com_count} common)")

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
    parser = argparse.ArgumentParser(description="Validate a Sogrim catalog JSON schema")
    parser.add_argument("catalog", help="Path to catalog JSON file")
    parser.add_argument("--json-output", "-j", help="Write findings as JSON to file")
    args = parser.parse_args()

    with open(args.catalog, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    findings = validate_schema(catalog)
    print(format_findings(findings))

    if args.json_output:
        with open(args.json_output, "w", encoding="utf-8") as f:
            json.dump(findings, f, ensure_ascii=False, indent=2)
        print(f"\nWrote findings to {args.json_output}")

    errors = sum(1 for f in findings if f["severity"] == "ERROR")
    sys.exit(1 if errors > 0 else 0)


if __name__ == "__main__":
    main()
