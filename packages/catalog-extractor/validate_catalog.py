"""
validate_catalog.py — Validate a Sogrim catalog JSON file.

Checks:
- Required fields present
- All course IDs are 8-digit zero-padded
- Every course in course_to_bank maps to a valid bank name
- All banks in course_banks have courses in course_to_bank
- credit_overflows references valid bank names
- JSON is well-formed

Usage:
    python validate_catalog.py <catalog.json>
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


def validate(catalog: dict) -> list[str]:
    """Validate a catalog dict. Returns list of error messages."""
    errors = []

    # Check required fields
    for field in REQUIRED_FIELDS:
        if field not in catalog:
            errors.append(f"Missing required field: {field}")

    # Faculty
    if catalog.get("faculty") not in VALID_FACULTIES:
        errors.append(f"Invalid faculty: {catalog.get('faculty')}. Must be one of {VALID_FACULTIES}")

    # total_credit
    tc = catalog.get("total_credit")
    if tc is not None and (not isinstance(tc, (int, float)) or tc <= 0):
        errors.append(f"total_credit should be a positive number, got: {tc}")

    # Course banks
    bank_names = set()
    for bank in catalog.get("course_banks", []):
        if "name" not in bank:
            errors.append(f"Course bank missing 'name': {bank}")
        else:
            bank_names.add(bank["name"])
        if "rule" not in bank:
            errors.append(f"Course bank '{bank.get('name', '?')}' missing 'rule'")

    # Course IDs: 8-digit check
    course_to_bank = catalog.get("course_to_bank", {})
    for cid, bank in course_to_bank.items():
        if not re.match(r"^\d{8}$", cid):
            errors.append(f"Course ID not 8-digit zero-padded: '{cid}' (bank: {bank})")
        if bank not in bank_names:
            errors.append(f"Course '{cid}' maps to unknown bank '{bank}'. Known banks: {bank_names}")

    # Check all banks have at least one course (except special ones)
    skip_banks = {"בחירת העשרה", "חינוך גופני", "בחירה חופשית"}
    banks_with_courses = set(course_to_bank.values())
    for bank_name in bank_names:
        if bank_name not in skip_banks and bank_name not in banks_with_courses:
            errors.append(f"Bank '{bank_name}' has no courses in course_to_bank")

    # Credit overflows reference valid banks
    for overflow in catalog.get("credit_overflows", []):
        if overflow.get("from") not in bank_names:
            errors.append(f"credit_overflow 'from' unknown bank: '{overflow.get('from')}'")
        if overflow.get("to") not in bank_names:
            errors.append(f"credit_overflow 'to' unknown bank: '{overflow.get('to')}'")

    # Replacements: check course ID format
    for field in ["catalog_replacements", "common_replacements"]:
        for cid, replacements in catalog.get(field, {}).items():
            if not re.match(r"^\d{8}$", cid):
                errors.append(f"{field}: key '{cid}' not 8-digit zero-padded")
            if not isinstance(replacements, list):
                errors.append(f"{field}: value for '{cid}' should be a list")
            else:
                for rid in replacements:
                    if not re.match(r"^\d{8}$", rid):
                        errors.append(f"{field}: replacement '{rid}' for '{cid}' not 8-digit")

    return errors


def main():
    parser = argparse.ArgumentParser(description="Validate a Sogrim catalog JSON")
    parser.add_argument("catalog", help="Path to catalog JSON file")
    args = parser.parse_args()

    with open(args.catalog, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    errors = validate(catalog)

    if errors:
        print(f"❌ Found {len(errors)} validation error(s):", file=sys.stderr)
        for e in errors:
            print(f"  • {e}", file=sys.stderr)
        sys.exit(1)
    else:
        print("✅ Catalog JSON is valid!", file=sys.stderr)


if __name__ == "__main__":
    main()
