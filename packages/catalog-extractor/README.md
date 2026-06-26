# Catalog Extractor

Python scripts for extracting Technion academic catalogs from PDF into JSON format
compatible with the Sogrim degree-completion checker.

## Setup

```bash
pip install -r requirements.txt
```

## Usage

### Step 1: Extract text from PDF

```bash
python extract_pdf.py <pdf_url_or_path> [--output raw_text.txt]
```

### Step 2: Build catalog JSON

```bash
python build_catalog.py <raw_text.txt> --name "CatalogName" [--reference ../docs/existing.json]
```

### Step 3: Validate

```bash
python validate_catalog.py <catalog.json>
```

### All-in-one

```bash
python main.py <pdf_url_or_path> --name "ComputerScienceSoftwareEngineerCourse2024-2025" [--reference ../docs/ComputerScience3years2024-2025.json]
```
