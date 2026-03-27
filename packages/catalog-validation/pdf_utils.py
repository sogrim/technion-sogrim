"""
pdf_utils.py — Download and extract text from a Technion catalog PDF.

Standalone utility for the catalog-validation package.
"""

import sys
import os
import re
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


def get_pdf_text(source: str) -> str:
    """Get full text from a PDF URL or local path. Returns formatted text with page markers."""
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
            raise FileNotFoundError(f"PDF file not found: {source}")
        pages = extract_text(source)
    return format_output(pages)


def pad_course_id(cid: str) -> str:
    """Zero-pad a course ID to 8 digits."""
    digits = re.sub(r"\D", "", cid)
    return digits.zfill(8)
