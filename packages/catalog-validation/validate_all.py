"""
validate_all.py — Run all catalog validations: schema + PDF cross-validation.

Usage:
    python validate_all.py <catalog.json> <pdf_url_or_path> [--verbose] [--json-output findings.json]

Runs both validate_schema and validate_pdf, merges findings.
"""

import sys
import json
import argparse

from validate_schema import validate_schema
from validate_pdf import validate_against_pdf, format_findings
from pdf_utils import get_pdf_text


def main():
    parser = argparse.ArgumentParser(
        description="Run all catalog validations (schema + PDF cross-validation)"
    )
    parser.add_argument("catalog", help="Path to catalog JSON file")
    parser.add_argument("pdf", help="URL or local path to PDF")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="Show detailed info messages")
    parser.add_argument("--json-output", "-j", help="Write combined findings as JSON")
    parser.add_argument("--schema-only", action="store_true",
                        help="Run only schema validation (no PDF needed)")
    args = parser.parse_args()

    with open(args.catalog, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    all_findings = []

    # Phase 1: Schema validation
    print("Phase 1: Schema validation")
    print("─" * 40)
    schema_findings = validate_schema(catalog)
    all_findings.extend(schema_findings)
    print(format_findings(schema_findings))

    schema_errors = sum(1 for f in schema_findings if f["severity"] == "ERROR")
    if schema_errors > 0:
        print(f"\n⛔ {schema_errors} schema errors found — fix these before PDF validation.")
        if not args.schema_only:
            print("Skipping PDF cross-validation.")
        sys.exit(1)

    if args.schema_only:
        sys.exit(0)

    # Phase 2: PDF cross-validation
    print(f"\n\nPhase 2: PDF cross-validation")
    print("─" * 40)
    pdf_text = get_pdf_text(args.pdf)
    pdf_findings = validate_against_pdf(catalog, pdf_text, verbose=args.verbose)
    all_findings.extend(pdf_findings)
    print(format_findings(pdf_findings))

    # Combined output
    if args.json_output:
        with open(args.json_output, "w", encoding="utf-8") as f:
            json.dump(all_findings, f, ensure_ascii=False, indent=2)
        print(f"\nWrote {len(all_findings)} findings to {args.json_output}")

    total_errors = sum(1 for f in all_findings if f["severity"] == "ERROR")
    sys.exit(1 if total_errors > 0 else 0)


if __name__ == "__main__":
    main()
