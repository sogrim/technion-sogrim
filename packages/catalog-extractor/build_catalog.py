"""
build_catalog.py — Build a Sogrim catalog JSON from parsed sections and raw text.

Takes extracted text (or parsed sections JSON) and produces the final catalog JSON.
Can optionally use an existing catalog as reference for common_replacements and
stable fields.

Usage:
    python build_catalog.py <raw_text.txt> --name "CatalogName" [--reference existing.json] [--output catalog.json]
"""

import sys
import json
import argparse
import os

from normalize import pad_course_id, BANK_RULES, NULL_CREDIT_BANKS
from parse_sections import split_into_sections


def load_reference(path: str) -> dict | None:
    """Load an existing catalog JSON as a reference."""
    if not path or not os.path.exists(path):
        return None
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def build_course_to_bank(sections: list[dict]) -> dict[str, str]:
    """Build course_to_bank mapping from parsed sections."""
    mapping = {}
    for section in sections:
        bank = section.get("bank_name")
        if not bank:
            continue
        for course in section.get("courses", []):
            cid = course["id"]
            if cid not in mapping:
                mapping[cid] = bank
    return mapping


def build_course_banks(sections: list[dict]) -> list[dict]:
    """Build course_banks array from parsed sections."""
    banks = []
    seen = set()
    for section in sections:
        bank_name = section.get("bank_name")
        if not bank_name or bank_name in seen:
            continue
        seen.add(bank_name)

        rule = BANK_RULES.get(bank_name)
        if rule is None:
            # Placeholder for complex rules that need manual construction
            rule = f"TODO: Set rule for {bank_name}"

        credit = None if bank_name in NULL_CREDIT_BANKS else 0.0  # Needs manual setting

        banks.append({
            "name": bank_name,
            "rule": rule,
            "credit": credit,
        })
    return banks


def build_catalog_skeleton(
    name: str,
    sections: list[dict],
    reference: dict | None = None,
    faculty: str = "ComputerScience",
) -> dict:
    """Build a catalog JSON skeleton from sections.
    
    Fields that need manual review are marked with TODO comments.
    """
    course_to_bank = build_course_to_bank(sections)
    course_banks = build_course_banks(sections)

    # Carry forward replacements from reference if available
    common_replacements = {}
    if reference and "common_replacements" in reference:
        common_replacements = reference["common_replacements"]

    catalog = {
        "_id": {"$oid": ""},
        "name": name,
        "faculty": faculty,
        "total_credit": 0.0,  # TODO: Set from PDF
        "description": "",  # TODO: Set Hebrew description
        "course_banks": course_banks,
        "credit_overflows": [],  # TODO: Set overflow rules
        "course_to_bank": course_to_bank,
        "catalog_replacements": {},  # TODO: Extract from PDF
        "common_replacements": common_replacements,
    }

    return catalog


def main():
    parser = argparse.ArgumentParser(
        description="Build a Sogrim catalog JSON from extracted PDF text"
    )
    parser.add_argument("input", help="Path to raw text file (from extract_pdf.py)")
    parser.add_argument("--name", required=True, help="Catalog name (Hebrew)")
    parser.add_argument(
        "--reference", "-r",
        help="Path to an existing catalog JSON to carry forward common fields",
    )
    parser.add_argument("--output", "-o", help="Output JSON file (default: stdout)")
    parser.add_argument(
        "--faculty", default="ComputerScience",
        help="Faculty name (default: ComputerScience)",
    )
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        raw_text = f.read()

    reference = load_reference(args.reference)
    sections = split_into_sections(raw_text)

    catalog = build_catalog_skeleton(
        name=args.name,
        sections=sections,
        reference=reference,
        faculty=args.faculty,
    )

    # Report what was found
    print(f"Built catalog skeleton:", file=sys.stderr)
    print(f"  Banks: {len(catalog['course_banks'])}", file=sys.stderr)
    print(f"  Courses mapped: {len(catalog['course_to_bank'])}", file=sys.stderr)
    print(f"  Common replacements: {len(catalog['common_replacements'])}", file=sys.stderr)
    print(f"", file=sys.stderr)
    print(f"  ⚠️  Review TODOs in the output — credits, rules, overflows need manual setting.", file=sys.stderr)

    result = json.dumps(catalog, ensure_ascii=False, indent=2)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(result)
        print(f"Wrote catalog to {args.output}", file=sys.stderr)
    else:
        print(result)


if __name__ == "__main__":
    main()
