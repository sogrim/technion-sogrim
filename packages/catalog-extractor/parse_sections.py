"""
parse_sections.py — Parse extracted PDF text into structured catalog sections.

Takes raw text (from extract_pdf.py) and splits it into sections by
detecting bank/section headers. Extracts course IDs and credits per section.

Usage:
    python parse_sections.py <raw_text.txt> [--output sections.json]
"""

import sys
import json
import re
import argparse

from normalize import (
    pad_course_id,
    extract_course_ids,
    is_section_header,
    detect_bank_name,
)


def parse_pages(raw_text: str) -> list[dict]:
    """Split raw text into pages."""
    pages = []
    current_page = None
    current_lines = []

    for line in raw_text.split("\n"):
        match = re.match(r"^=== PAGE (\d+) ===$", line)
        if match:
            if current_page is not None:
                pages.append({"page": current_page, "text": "\n".join(current_lines)})
            current_page = int(match.group(1))
            current_lines = []
        else:
            current_lines.append(line)

    if current_page is not None:
        pages.append({"page": current_page, "text": "\n".join(current_lines)})

    return pages


def extract_courses_from_block(text: str) -> list[dict]:
    """Extract course entries from a text block.
    
    Technion PDFs often have course data spread across lines:
        3.0          (credit)
         course name  (Hebrew name)
        02340118     (course ID)
    
    This function finds all course-ID-like numbers (5-8 digits appearing
    standalone or at line boundaries).
    """
    courses = []
    lines = text.split("\n")
    seen_ids = set()

    for i, line in enumerate(lines):
        # Look for course IDs: 5-8 digit numbers
        for match in re.finditer(r"\b(\d{5,8})\b", line):
            raw_id = match.group(1)
            padded = pad_course_id(raw_id)

            # Skip if it looks like a credit value (e.g., "3.0", "5.5")
            # or a page number or year
            if len(raw_id) <= 4:
                continue
            if raw_id in seen_ids:
                continue

            # Gather context: look at preceding lines for name/credit hints
            name_hint = ""
            credit_hint = None
            for j in range(max(0, i - 3), i):
                prev = lines[j].strip()
                # Credit hint: a line that's just a number like "3.0"
                credit_match = re.match(r"^(\d+(?:\.\d+)?)$", prev)
                if credit_match:
                    val = float(credit_match.group(1))
                    if 0.5 <= val <= 10.0:
                        credit_hint = val
                # Name hint: a Hebrew-text line near the ID
                elif re.search(r"[\u0590-\u05FF]", prev) and len(prev) > 3:
                    name_hint = prev

            seen_ids.add(raw_id)
            courses.append({
                "id": padded,
                "raw_id": raw_id,
                "name_hint": name_hint,
                "credit_hint": credit_hint,
            })

    return courses


def split_into_sections(raw_text: str) -> list[dict]:
    """Split the full text into sections based on detected headers.
    
    Returns list of:
    {
        "header": "original header line",
        "bank_name": "canonical bank name or null",
        "raw_text": "full text of section",
        "courses": [{id, name_hint, credit_hint}, ...]
    }
    """
    lines = raw_text.split("\n")
    sections = []
    current_section = None

    for line in lines:
        # Skip page markers
        if re.match(r"^=== PAGE \d+ ===$", line):
            continue

        if is_section_header(line):
            if current_section:
                current_section["courses"] = extract_courses_from_block(
                    current_section["raw_text"]
                )
                sections.append(current_section)

            current_section = {
                "header": line.strip(),
                "bank_name": detect_bank_name(line),
                "raw_text": "",
                "courses": [],
            }
        elif current_section:
            current_section["raw_text"] += line + "\n"

    if current_section:
        current_section["courses"] = extract_courses_from_block(
            current_section["raw_text"]
        )
        sections.append(current_section)

    return sections


def main():
    parser = argparse.ArgumentParser(
        description="Parse extracted PDF text into catalog sections"
    )
    parser.add_argument("input", help="Path to raw text file (from extract_pdf.py)")
    parser.add_argument("--output", "-o", help="Output JSON file (default: stdout)")
    args = parser.parse_args()

    with open(args.input, "r", encoding="utf-8") as f:
        raw_text = f.read()

    sections = split_into_sections(raw_text)

    # Summary
    print(f"Found {len(sections)} sections:", file=sys.stderr)
    for s in sections:
        bank = s["bank_name"] or "UNKNOWN"
        print(
            f"  [{bank}] {s['header'][:60]} — {len(s['courses'])} courses",
            file=sys.stderr,
        )

    result = json.dumps(sections, ensure_ascii=False, indent=2)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(result)
        print(f"Wrote sections to {args.output}", file=sys.stderr)
    else:
        print(result)


if __name__ == "__main__":
    main()
