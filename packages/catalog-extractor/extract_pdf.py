"""
extract_pdf.py — Download and extract text from a Technion catalog PDF.

Usage:
    python extract_pdf.py <pdf_url_or_path> [--output raw_text.txt]

Outputs page-delimited text to stdout or a file.
"""

import sys
import os
import argparse
import tempfile

import requests
import fitz  # pymupdf


def download_pdf(url: str, dest: str) -> str:
    """Download a PDF from a URL to a local file."""
    print(f"Downloading PDF from {url}...", file=sys.stderr)
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    with open(dest, "wb") as f:
        f.write(resp.content)
    print(f"Downloaded {len(resp.content)} bytes.", file=sys.stderr)
    return dest


def extract_text(pdf_path: str) -> list[dict]:
    """Extract text from each page of a PDF. Returns list of {page, text}."""
    doc = fitz.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text("text")
        pages.append({"page": i + 1, "text": text})
    doc.close()
    return pages


def format_output(pages: list[dict]) -> str:
    """Format extracted pages into a single string with page markers."""
    parts = []
    for p in pages:
        parts.append(f"=== PAGE {p['page']} ===")
        parts.append(p["text"])
    return "\n".join(parts)


def main():
    parser = argparse.ArgumentParser(description="Extract text from a Technion catalog PDF")
    parser.add_argument("source", help="URL or local path to the PDF file")
    parser.add_argument("--output", "-o", help="Output file path (default: stdout)")
    args = parser.parse_args()

    source = args.source

    # If URL, download to temp file
    if source.startswith("http://") or source.startswith("https://"):
        tmp = tempfile.NamedTemporaryFile(suffix=".pdf", delete=False)
        tmp.close()
        try:
            download_pdf(source, tmp.name)
            pages = extract_text(tmp.name)
        finally:
            os.unlink(tmp.name)
    else:
        if not os.path.exists(source):
            print(f"Error: File not found: {source}", file=sys.stderr)
            sys.exit(1)
        pages = extract_text(source)

    output = format_output(pages)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output)
        print(f"Wrote {len(pages)} pages to {args.output}", file=sys.stderr)
    else:
        print(output)


if __name__ == "__main__":
    main()
