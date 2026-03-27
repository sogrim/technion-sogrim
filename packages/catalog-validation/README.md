# Catalog Validation

Validate Sogrim catalog JSON files against their source Technion PDF catalogs.

## Scripts

| Script | Purpose |
|---|---|
| `validate_schema.py` | Validates JSON structure: required fields, course ID format, bank references, overflows, replacements |
| `validate_pdf.py` | Cross-validates JSON against source PDF: courses, credits, banks, chains, ליבה rule |
| `validate_all.py` | Runs both validations in sequence (schema first, then PDF) |
| `pdf_utils.py` | Shared utility: PDF download/extraction, course ID padding |

## Setup

```bash
cd packages/catalog-validation
pip install -r requirements.txt
```

## Usage

```bash
# Full validation (schema + PDF)
python validate_all.py <catalog.json> <pdf_url> --verbose

# Schema only (no PDF needed)
python validate_schema.py <catalog.json>

# PDF cross-validation only
python validate_pdf.py <catalog.json> <pdf_url> --verbose

# Save findings as JSON
python validate_all.py <catalog.json> <pdf_url> --json-output findings.json
```
