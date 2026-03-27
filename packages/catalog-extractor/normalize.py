"""
normalize.py — Utility functions for Technion catalog data normalization.

Provides helpers for:
- Course ID zero-padding (to 8 digits)
- Credit parsing from Hebrew text
- Section header detection
"""

import re


def pad_course_id(course_id: str) -> str:
    """Zero-pad a course ID to 8 digits.
    
    Examples:
        '234114'   -> '02340114'
        '02340114' -> '02340114'
        '114071'   -> '01140071'
    """
    digits = re.sub(r"\D", "", course_id)
    return digits.zfill(8)


def extract_course_ids(text: str) -> list[str]:
    """Find all course IDs (5-8 digit numbers) in text, return as 8-digit padded."""
    raw_ids = re.findall(r"\b(\d{5,8})\b", text)
    return [pad_course_id(cid) for cid in raw_ids]


def parse_credit(text: str) -> float | None:
    """Extract a credit value (e.g., '3.0', '2.5') from text."""
    match = re.search(r"(\d+(?:\.\d+)?)", text)
    if match:
        return float(match.group(1))
    return None


def is_section_header(line: str) -> bool:
    """Check if a line looks like a section header in a Technion catalog.
    
    Only matches lines that are primarily a section name, not lines where
    a keyword appears in regular prose.
    """
    stripped = line.strip()
    if not stripped or len(stripped) > 80:
        return False

    # Exact or near-exact matches for bank-style headers
    header_patterns = [
        r"^מקצועות\s+חובה",
        r"^קורסי\s+חובה",
        r"^מקצועות\s+בחירה",
        r"^רשימה\s+א",
        r"^רשימה\s+ב",
        r"^שרשרת\s+מדעית",
        r"^שרשראות\s+מדעיות",
        r"^קבוצות\s+התמחות",
        r"^בחירת\s+העשרה",
        r"^לימודי\s+העשרה",
        r"^חינוך\s+גופני",
        r"^בחירה\s+חופשית",
        r"^מתמטי\s+נוסף",
        r"^קורס\s+מתמטי\s+נוסף",
        r"^מקצוע\s+מדעי",
        r"^מקצועות\s+מדעיים",
        r"^פרויקט$",
        r"^סמינר$",
        r"^מקצועות\s+ליבה",
        r"^רשימת\s+ליבה",
    ]
    return any(re.search(p, stripped) for p in header_patterns)


def detect_bank_name(header: str) -> str | None:
    """Map a section header to a canonical bank name."""
    mappings = {
        "חובה": "חובה",
        "קורסי חובה": "חובה",
        "רשימה א": "רשימה א",
        "רשימה ב": "רשימה ב",
        "שרשרת מדעית": "שרשרת מדעית",
        "שרשראות מדעיות": "שרשרת מדעית",
        "קבוצות התמחות": "קבוצות התמחות",
        "פרויקט": "פרויקט",
        "סמינר": "סמינר",
        "מתמטי נוסף": "מתמטי נוסף",
        "בחירת העשרה": "בחירת העשרה",
        "לימודי העשרה": "בחירת העשרה",
        "חינוך גופני": "חינוך גופני",
        "בחירה חופשית": "בחירה חופשית",
    }
    for key, canonical in mappings.items():
        if key in header:
            return canonical
    return None


BANK_RULES = {
    "חובה": "All",
    "רשימה א": "AccumulateCredit",
    "רשימה ב": "AccumulateCredit",
    "שרשרת מדעית": None,  # Needs Chains structure
    "קבוצות התמחות": None,  # Needs SpecializationGroups structure
    "מתמטי נוסף": {"AccumulateCourses": {"$numberLong": "1"}},
    "פרויקט": {"AccumulateCourses": {"$numberLong": "1"}},
    "סמינר": {"AccumulateCourses": {"$numberLong": "1"}},
    "בחירת העשרה": "Malag",
    "חינוך גופני": "Sport",
    "בחירה חופשית": "Elective",
}


# Banks where credit should be null (credits flow via overflow)
NULL_CREDIT_BANKS = {"פרויקט", "סמינר"}
