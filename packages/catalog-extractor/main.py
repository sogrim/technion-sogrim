"""
main.py — All-in-one catalog extraction pipeline.

Downloads a PDF, extracts text, parses sections, builds a skeleton catalog JSON,
and optionally validates it.

Usage:
    python main.py <pdf_url_or_path> --name "CatalogName" [--reference existing.json] [--output catalog.json]
"""

import sys
import os
import argparse
import tempfile
import json

from extract_pdf import download_pdf, extract_text, format_output
from parse_sections import split_into_sections
from build_catalog import build_catalog_skeleton, load_reference
from validate_catalog import validate


def main():
    parser = argparse.ArgumentParser(
        description="Extract a Technion catalog PDF into Sogrim JSON format"
    )
    parser.add_argument("source", help="URL or local path to the PDF file")
    parser.add_argument("--name", required=True, help="Catalog name (Hebrew)")
    parser.add_argument(
        "--reference", "-r",
        help="Path to existing catalog JSON for carrying forward stable fields",
    )
    parser.add_argument(
        "--output", "-o",
        help="Output catalog JSON file path",
    )
    parser.add_argument(
        "--save-text",
        help="Also save extracted raw text to this path",
    )
    parser.add_argument(
        "--save-sections",
        help="Also save parsed sections JSON to this path",
    )
    parser.add_argument(
        "--faculty", default="ComputerScience",
        help="Faculty name (default: ComputerScience)",
    )
    parser.add_argument(
        "--validate", action="store_true", default=True,
        help="Run validation on the output (default: True)",
    )
    args = parser.parse_args()

    source = args.source

    # Step 1: Get PDF text
    print("=" * 60, file=sys.stderr)
    print("Step 1: Extracting text from PDF", file=sys.stderr)
    print("=" * 60, file=sys.stderr)

    if source.startswith("http://") or source.startswith("https://"):
        tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        tmp.close()
        try:
            download_pdf(source, tmp.name)
            pages = extract_text(tmp.name)
        finally:
            os.unlink(tmp.name)
    else:
        pages = extract_text(source)

    raw_text = format_output(pages)
    print(f"Extracted {len(pages)} pages.", file=sys.stderr)

    if args.save_text:
        with open(args.save_text, "w", encoding="utf-8") as f:
            f.write(raw_text)
        print(f"Saved raw text to {args.save_text}", file=sys.stderr)

    # Step 2: Parse sections
    print("\n" + "=" * 60, file=sys.stderr)
    print("Step 2: Parsing sections", file=sys.stderr)
    print("=" * 60, file=sys.stderr)

    sections = split_into_sections(raw_text)
    print(f"Found {len(sections)} sections:", file=sys.stderr)
    for s in sections:
        bank = s["bank_name"] or "UNKNOWN"
        print(f"  [{bank}] {len(s['courses'])} courses", file=sys.stderr)

    if args.save_sections:
        with open(args.save_sections, "w", encoding="utf-8") as f:
            json.dump(sections, f, ensure_ascii=False, indent=2)
        print(f"Saved sections to {args.save_sections}", file=sys.stderr)

    # Step 3: Build catalog skeleton
    print("\n" + "=" * 60, file=sys.stderr)
    print("Step 3: Building catalog skeleton", file=sys.stderr)
    print("=" * 60, file=sys.stderr)

    reference = load_reference(args.reference)
    if reference:
        print(f"Using reference catalog: {args.reference}", file=sys.stderr)

    catalog = build_catalog_skeleton(
        name=args.name,
        sections=sections,
        reference=reference,
        faculty=args.faculty,
    )

    print(f"Banks: {len(catalog['course_banks'])}", file=sys.stderr)
    print(f"Courses mapped: {len(catalog['course_to_bank'])}", file=sys.stderr)

    # Step 4: Validate
    if args.validate:
        print("\n" + "=" * 60, file=sys.stderr)
        print("Step 4: Validation", file=sys.stderr)
        print("=" * 60, file=sys.stderr)

        errors = validate(catalog)
        if errors:
            print(f"⚠️  {len(errors)} validation issue(s) (expected for skeleton):", file=sys.stderr)
            for e in errors[:10]:
                print(f"  • {e}", file=sys.stderr)
            if len(errors) > 10:
                print(f"  ... and {len(errors) - 10} more", file=sys.stderr)
        else:
            print("✅ Catalog passes all validation checks!", file=sys.stderr)

    # Output
    result = json.dumps(catalog, ensure_ascii=False, indent=2)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(result)
        print(f"\n📄 Wrote catalog to {args.output}", file=sys.stderr)
    else:
        print(result)

    print("\n💡 Next steps:", file=sys.stderr)
    print("  1. Review and set total_credit, bank credits, and description", file=sys.stderr)
    print("  2. Set rules for שרשרת מדעית (Chains) and קבוצות התמחות (SpecializationGroups)", file=sys.stderr)
    print("  3. Set credit_overflows", file=sys.stderr)
    print("  4. Review catalog_replacements", file=sys.stderr)
    print("  5. Run: python validate_catalog.py <output.json>", file=sys.stderr)


if __name__ == "__main__":
    main()
