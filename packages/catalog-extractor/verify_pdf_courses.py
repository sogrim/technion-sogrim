#!/usr/bin/env python3
"""verify_pdf_courses.py — Diff a catalog's courses against the raw PDF text.

Extracts all 8-digit course IDs present in the raw PDF text and reports which
courses in a catalog's course_to_bank are NOT found in the PDF (candidates for
removal due to year drift), grouped by bank. Also lists 8-digit IDs in the PDF
that are not mapped in the catalog (informational; the PDF is a superset across
all tracks).

Usage:
    python verify_pdf_courses.py <catalog.json> <raw_text.txt> [--bank BANK]
"""
import json
import re
import sys
import argparse
from collections import defaultdict


def pdf_course_ids(raw_path):
    text = open(raw_path, encoding="utf-8").read()
    # 8-digit standalone tokens
    ids = set(re.findall(r"(?<!\d)\d{8}(?!\d)", text))
    # Known PDF typos (OCR/transposition) -> real Technion course IDs.
    PDF_TYPOS = {
        "02368035": "02360835",  # סמינר בבינה מלאכותית (AI seminar)
    }
    for typo, real in PDF_TYPOS.items():
        if typo in ids:
            ids.add(real)
    return ids


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("catalog")
    ap.add_argument("raw")
    ap.add_argument("--bank", help="only show this bank")
    args = ap.parse_args()

    sys.stdout.reconfigure(encoding="utf-8")
    cat = json.load(open(args.catalog, encoding="utf-8"))
    pdf_ids = pdf_course_ids(args.raw)
    c2b = cat["course_to_bank"]

    missing = defaultdict(list)
    for cid, bank in c2b.items():
        if args.bank and bank != args.bank:
            continue
        if cid not in pdf_ids:
            missing[bank].append(cid)

    print(f"Catalog: {cat['name']}  ({len(c2b)} courses)")
    print(f"PDF distinct 8-digit IDs: {len(pdf_ids)}")
    print("\n== Courses in catalog NOT found in PDF (per bank) ==")
    total = 0
    for bank in sorted(missing):
        ids = sorted(missing[bank])
        total += len(ids)
        print(f"  [{bank}] {len(ids)}: {ids}")
    print(f"  TOTAL missing: {total}")


if __name__ == "__main__":
    main()
