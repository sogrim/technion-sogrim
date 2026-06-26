#!/usr/bin/env python3
"""
extract_all_tracks.py — Build 7 catalog JSONs for Technion CS Faculty 2024-2025.

Reads section text files and reference catalogs to produce complete catalog JSONs
for: Cyber Security, Data Analysis, Bioinformatics, Computer Engineering,
CS+Math, CS+Physics, and Medicine+CS.

Usage:
    python extract_all_tracks.py
"""

import json
import os
import sys
import copy

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DOCS_DIR = os.path.join(SCRIPT_DIR, "..", "docs")

REF_4YEAR = os.path.join(DOCS_DIR, "ComputerScience4years2024-2025.json")
REF_3YEAR = os.path.join(DOCS_DIR, "ComputerScience3years2024-2025.json")

OUTPUT_FILES = {
    "cyber": "ComputerScienceCyberSecurity2024-2025.json",
    "data": "ComputerScienceDataAnalysis2024-2025.json",
    "bioinfo": "ComputerScienceBioinformatics2024-2025.json",
    "compeng": "ComputerScienceComputerEngineering2024-2025.json",
    "csmath": "ComputerScienceMath2024-2025.json",
    "csphysics": "ComputerSciencePhysics2024-2025.json",
    "medicine": "ComputerScienceMedicine2024-2025.json",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def pad(cid):
    """Zero-pad course ID to 8 digits."""
    return str(cid).strip().zfill(8)


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  OK Wrote {os.path.basename(path)}")


def clean_c2b(c2b, valid_banks, remap=None):
    """Remove courses mapping to unknown banks or remap them.
    
    Args:
        c2b: course_to_bank dict
        valid_banks: set of valid bank names
        remap: dict mapping old bank name -> new bank name (or None to drop)
    """
    remap = remap or {}
    cleaned = {}
    for cid, bank in c2b.items():
        if bank in valid_banks:
            cleaned[cid] = bank
        elif bank in remap:
            new_bank = remap[bank]
            if new_bank is not None:
                cleaned[cid] = new_bank
        # else: silently drop courses from unknown banks
    return cleaned


def make_catalog(name, total_credit, description, course_banks, credit_overflows,
                 course_to_bank, catalog_replacements, common_replacements):
    """Build a catalog dict in the canonical format."""
    sorted_c2b = dict(sorted(course_to_bank.items()))
    return {
        "_id": {"$oid": ""},
        "name": name,
        "faculty": "ComputerScience",
        "total_credit": total_credit,
        "description": description,
        "course_banks": course_banks,
        "credit_overflows": credit_overflows,
        "course_to_bank": sorted_c2b,
        "catalog_replacements": catalog_replacements,
        "common_replacements": common_replacements,
    }


# ---------------------------------------------------------------------------
# Shared data from 4-year reference
# ---------------------------------------------------------------------------

COMMON_REPLACEMENTS = {
    "01040031": ["01040195"],
    "01040032": ["01040281"],
    "01040174": ["01040168"],
    "01140071": ["01140074", "01140051"],
    "01140075": ["01140076"],
    "02340114": ["02340117"],
    "02340141": ["01040286"],
    "00940412": ["01040222"],
}

CATALOG_REPLACEMENTS_4Y = {
    "01040134": ["01040158"],
    "00440252": ["02340252"],
    "02360216": ["02340325"],
    "02360330": ["00460197"],
    "02380790": ["02360790"],
}

CHAINS = [
    ["01140075"],
    ["01140052", "01140054"],
    ["01340058", "01340020"],
    ["01240120", "01250801"],
    ["01240120", "01240510"],
    ["01240120", "01140052"],
]

MATH_ADDITIONAL_COURSES = [
    "01040033", "01040122", "01040135", "01040142",
    "01040174", "01040279", "01040285", "01040295",
]

# Standard 4-year overflow pattern
OVERFLOW_4Y = [
    {"from": "חובה", "to": "רשימה ב"},
    {"from": "רשימה א", "to": "רשימה ב"},
    {"from": "פרויקט", "to": "סמינר"},
    {"from": "סמינר", "to": "רשימה א"},
    {"from": "פרויקט", "to": "רשימה א"},
    {"from": "קבוצות התמחות", "to": "רשימה א"},
    {"from": "מתמטי נוסף", "to": "רשימה ב"},
    {"from": "שרשרת מדעית", "to": "רשימה ב"},
    {"from": "רשימה ב", "to": "בחירה חופשית"},
    {"from": "בחירת העשרה", "to": "בחירה חופשית"},
    {"from": "חינוך גופני", "to": "בחירה חופשית"},
]


# ---------------------------------------------------------------------------
# Pull shared course lists from 4-year reference
# ---------------------------------------------------------------------------

def get_ref4_courses_by_bank(ref4):
    """Get all courses grouped by bank from the 4-year reference."""
    banks = {}
    for cid, bank in ref4["course_to_bank"].items():
        banks.setdefault(bank, []).append(cid)
    return banks


def get_spec_groups(ref4):
    """Extract specialization groups from 4-year reference."""
    for bank in ref4["course_banks"]:
        if bank["name"] == "קבוצות התמחות":
            return bank["rule"]["SpecializationGroups"]
    return None


# ---------------------------------------------------------------------------
# Track 1: Cyber Security (155 credits)
# ---------------------------------------------------------------------------

def build_cyber(ref4):
    ref_banks = get_ref4_courses_by_bank(ref4)
    spec_groups = get_spec_groups(ref4)

    # חובה courses from Cyber semester tables
    chova = [
        # Sem 1
        "01040031", "01040166", "02340114", "02340129", "03240033",
        # Sem 2
        "01040032", "01140071", "02340124", "02340125", "02340141", "02340493",
        # Sem 3
        "00940412", "01040134", "02340218", "00440252", "02340292", "02360491",
        # Sem 4 (fixed courses only; math additional and science are separate banks)
        "02340118", "02340123", "02340247",
        # Sem 5
        "02360267", "02360343", "02360360", "02360334", "02360350",
        # Sem 6
        "02360506", "02360490", "02360496",
    ]

    # ליבה courses
    liba = [
        "02360501", "02360342", "02360500", "02360508",
        "02360990", "02360376", "02360341",
    ]

    # Science chain courses
    chain_courses = [
        "01140075", "01140052", "01140054", "01340058",
        "01340020", "01240120", "01250801", "01250001", "01240510",
    ]

    # Build course_to_bank starting from 4-year reference
    c2b = dict(ref4["course_to_bank"])

    # Override: Cyber חובה courses
    for cid in chova:
        c2b[pad(cid)] = "חובה"

    # Override: ליבה courses
    for cid in liba:
        c2b[pad(cid)] = "ליבה"

    # Spec groups: only 1 group needed (vs 3 in 4-year)
    cyber_spec = copy.deepcopy(spec_groups)
    cyber_spec["groups_number"] = {"$numberLong": "1"}

    banks = [
        {"name": "חובה", "rule": "All", "credit": 95.5},
        {"name": "שרשרת מדעית", "rule": {"Chains": CHAINS}, "credit": 8.0},
        {"name": "מתמטי נוסף", "rule": {"AccumulateCourses": {"$numberLong": "1"}}, "credit": 2.5},
        {"name": "ליבה", "rule": {"AccumulateCourses": {"$numberLong": "3"}}, "credit": 8.0},
        {"name": "קבוצות התמחות", "rule": {"SpecializationGroups": cyber_spec}, "credit": 8.0},
        {"name": "רשימה א", "rule": "AccumulateCredit", "credit": 12.0},
        {"name": "רשימה ב", "rule": "AccumulateCredit", "credit": 9.0},
        {"name": "פרויקט", "rule": {"AccumulateCourses": {"$numberLong": "2"}}, "credit": None},
        {"name": "סמינר", "rule": {"AccumulateCourses": {"$numberLong": "1"}}, "credit": None},
        {"name": "בחירת העשרה", "rule": "Malag", "credit": 6.0},
        {"name": "חינוך גופני", "rule": "Sport", "credit": 2.0},
        {"name": "בחירה חופשית", "rule": "Elective", "credit": 4.0},
    ]

    overflows = [
        {"from": "חובה", "to": "רשימה ב"},
        {"from": "רשימה א", "to": "רשימה ב"},
        {"from": "פרויקט", "to": "סמינר"},
        {"from": "סמינר", "to": "רשימה א"},
        {"from": "פרויקט", "to": "רשימה א"},
        {"from": "קבוצות התמחות", "to": "רשימה א"},
        {"from": "ליבה", "to": "רשימה א"},
        {"from": "מתמטי נוסף", "to": "רשימה ב"},
        {"from": "שרשרת מדעית", "to": "רשימה ב"},
        {"from": "רשימה ב", "to": "בחירה חופשית"},
        {"from": "בחירת העשרה", "to": "בחירה חופשית"},
        {"from": "חינוך גופני", "to": "בחירה חופשית"},
    ]

    return make_catalog(
        name="מדמח מגמת סייבר 2024-2025",
        total_credit=155.0,
        description="מגמת סייבר ואבטחת מערכות ממוחשבות - מסלול ארבע-שנתי לתואר מוסמך למדעים (B.Sc.) במדעי המחשב 2024-2025",
        course_banks=banks,
        credit_overflows=overflows,
        course_to_bank=c2b,
        catalog_replacements=CATALOG_REPLACEMENTS_4Y,
        common_replacements=COMMON_REPLACEMENTS,
    )


# ---------------------------------------------------------------------------
# Track 2: Data Analysis & Learning (121 credits)
# ---------------------------------------------------------------------------

def build_data_analysis(ref3):
    # חובה courses from Data Analysis semester tables
    chova = [
        # Sem 1
        "01040031", "01040166", "02340114", "02340129", "03240033",
        # Sem 2
        "01040032", "01140071", "02340124", "02340141", "01040174",
        # Sem 3
        "00440252", "00940412", "02340125", "02340218", "02340292",
        # Sem 4
        "02340247", "02340118", "02340123", "02360766",
        # Sem 5
        "02360343", "02360201",
    ]

    # ליבה courses
    liba = [
        "00940423", "02360330", "02360299", "02360363", "02360370",
        "02360501", "02360667", "02360860", "02360777", "02360781",
        "02360767",
    ]

    # Start from 3-year reference
    c2b = dict(ref3["course_to_bank"])

    # Override חובה
    for cid in chova:
        c2b[pad(cid)] = "חובה"

    # Override ליבה
    for cid in liba:
        c2b[pad(cid)] = "ליבה"

    # 00460197 is an alternative for 02360330, add to ליבה too
    c2b[pad("00460197")] = "ליבה"

    banks = [
        {"name": "חובה", "rule": "All", "credit": 78.0},
        {"name": "שרשרת מדעית", "rule": {"Chains": CHAINS}, "credit": 8.0},
        {"name": "ליבה", "rule": {"AccumulateCourses": {"$numberLong": "4"}}, "credit": 12.0},
        {"name": "רשימה א", "rule": "AccumulateCredit", "credit": 13.0},
        {"name": "פרויקט", "rule": {"AccumulateCourses": {"$numberLong": "1"}}, "credit": None},
        {"name": "בחירת העשרה", "rule": "Malag", "credit": 6.0},
        {"name": "חינוך גופני", "rule": "Sport", "credit": 2.0},
        {"name": "בחירה חופשית", "rule": "Elective", "credit": 2.0},
    ]

    overflows = [
        {"from": "חובה", "to": "רשימה א"},
        {"from": "ליבה", "to": "רשימה א"},
        {"from": "פרויקט", "to": "רשימה א"},
        {"from": "שרשרת מדעית", "to": "רשימה א"},
        {"from": "רשימה א", "to": "בחירה חופשית"},
        {"from": "בחירת העשרה", "to": "בחירה חופשית"},
        {"from": "חינוך גופני", "to": "בחירה חופשית"},
    ]

    # Clean up: remap inherited banks to valid ones
    valid = {b["name"] for b in banks}
    c2b = clean_c2b(c2b, valid, remap={
        "רשימה ב": "רשימה א",
        "מתמטי נוסף": None,
        "סמינר": None,
        "קבוצות התמחות": "רשימה א",
    })

    return make_catalog(
        name="מדמח מגמת למידה וניתוח מידע 2024-2025",
        total_credit=121.0,
        description="המגמה ללמידה וניתוח מידע - מסלול תלת-שנתי לתואר בוגר למדעים (B.Sc.) במדעי המחשב 2024-2025",
        course_banks=banks,
        credit_overflows=overflows,
        course_to_bank=c2b,
        catalog_replacements={"01040134": ["01040158"], "00440252": ["02340252"]},
        common_replacements=COMMON_REPLACEMENTS,
    )


# ---------------------------------------------------------------------------
# Track 3: Bioinformatics (124 credits)
# ---------------------------------------------------------------------------

def build_bioinformatics(ref3):
    chova = [
        # Sem 1
        "01040031", "01040166", "02340114", "02340129", "01340058",
        # Sem 2
        "01040032", "01140071", "01340020", "02340124", "02340141",
        # Sem 3
        "00940412", "00440252", "02340218", "02340292", "01250001", "03240033",
        # Sem 4
        "00940423", "02340118", "02340247", "01340019",
        # Sem 5
        "01040134", "02340123", "02360523",
        # Sem 6
        "02360343", "02360522", "02360524",
    ]

    # Biology elective courses
    bio_courses = [
        # מקבץ מולקולרי
        "01250801", "01340082",
        # מקבץ מיקרוביולוגיה ואבולוציה
        "01340121", "01340133", "01340142",
        # רשימה ביולוגיה ב
        "01340119", "01340128", "01340113", "00660529", "01340156",
    ]

    # Start from 3-year reference
    c2b = dict(ref3["course_to_bank"])

    # Override חובה
    for cid in chova:
        c2b[pad(cid)] = "חובה"

    # Biology elective bank
    for cid in bio_courses:
        c2b[pad(cid)] = "בחירה בביולוגיה"

    # 01240120 as alternative to 01250001
    c2b[pad("01240120")] = "חובה"

    banks = [
        {"name": "חובה", "rule": "All", "credit": 91.5},
        {"name": "רשימה א", "rule": "AccumulateCredit", "credit": 8.0},
        {"name": "בחירה בביולוגיה", "rule": "AccumulateCredit", "credit": 14.5},
        {"name": "פרויקט", "rule": {"AccumulateCourses": {"$numberLong": "1"}}, "credit": None},
        {"name": "בחירת העשרה", "rule": "Malag", "credit": 6.0},
        {"name": "חינוך גופני", "rule": "Sport", "credit": 2.0},
        {"name": "בחירה חופשית", "rule": "Elective", "credit": 2.0},
    ]

    overflows = [
        {"from": "חובה", "to": "רשימה א"},
        {"from": "בחירה בביולוגיה", "to": "רשימה א"},
        {"from": "פרויקט", "to": "רשימה א"},
        {"from": "רשימה א", "to": "בחירה חופשית"},
        {"from": "בחירת העשרה", "to": "בחירה חופשית"},
        {"from": "חינוך גופני", "to": "בחירה חופשית"},
    ]

    # Clean up: remap inherited banks to valid ones
    valid = {b["name"] for b in banks}
    c2b = clean_c2b(c2b, valid, remap={
        "רשימה ב": "רשימה א",
        "שרשרת מדעית": None,  # bio has its own science in חובה
        "מתמטי נוסף": None,
        "סמינר": None,
        "קבוצות התמחות": "רשימה א",
    })

    return make_catalog(
        name="מדמח ביואינפורמטיקה 2024-2025",
        total_credit=124.0,
        description="המגמה למדעי המחשב עם התמקדות בביואינפורמטיקה - בשיתוף עם הפקולטה לביולוגיה 2024-2025",
        course_banks=banks,
        credit_overflows=overflows,
        course_to_bank=c2b,
        catalog_replacements={"01040134": ["01040158"], "00440252": ["02340252"], "01250001": ["01240120"]},
        common_replacements=COMMON_REPLACEMENTS,
    )


# ---------------------------------------------------------------------------
# Track 4: Computer Engineering (158.5 credits)
# ---------------------------------------------------------------------------

def build_compeng(ref4):
    chova = [
        # Sem 1
        "00440102", "01040012", "01040064", "02340129", "01140071", "02340114",
        # Sem 2
        "01040013", "02340125", "01040136", "01140075", "00440252",
        # Sem 3
        "02340124", "02340141", "00440105", "01040220", "01040215",
        "01040214", "03240033",
        # Sem 4
        "00440131", "01040034", "00440127", "02340218", "02340118", "01140073",
        # Sem 5
        "00440137", "00440157", "02340123", "01040134", "02340247", "02360267",
        # Sem 6-7 projects handled separately
    ]

    # Alternative courses (both counted as חובה options)
    chova_alternatives = ["01040016", "00460209", "00460210", "00460267"]

    # ליבה courses
    liba = [
        "00440198", "00440202", "02360334", "00440334",
        "02340292", "02360343",
    ]

    # CompEng specialization groups (12 groups)
    compeng_spec_groups = {
        "SpecializationGroups": {
            "groups_list": [
                {
                    "name": "רשתות מחשבים, מערכות מבוזרות ומבנה מחשבים",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "00440334", "02360334", "00460005", "02360341",
                        "02360755", "00460237", "02360351", "00460272",
                        "02360322", "02360370", "02360376", "02360490",
                        "02360491", "02360496", "02360350", "00460853",
                        "00460268", "02360268", "00460275", "00460278",
                        "02360278", "00460265", "00460279", "00460280",
                        "00460881", "00460864",
                    ],
                    "mandatory": [["00440334", "02360334"]]
                },
                {
                    "name": "תורת התקשורת",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "00440334", "02360334", "00460005", "02360341",
                        "00440202", "00460204", "00460206", "00460208",
                        "00440148", "00440198", "00460201", "00460205",
                        "00460868", "00460733", "00460734", "00460743",
                        "02360309", "02360525", "02360520",
                    ],
                    "mandatory": [["00440202"], ["00460206", "00460204"]]
                },
                {
                    "name": "אלגוריתמים, צפינה, קריפטוגרפיה וסיבוכיות",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "00460205", "02340129", "02360309", "02360313",
                        "02360343", "02360359", "02360374", "02360500",
                        "02360506", "02360525", "02360520", "02360522",
                        "02360719", "02360760", "02360990",
                    ],
                    "mandatory": [["02360343"]]
                },
                {
                    "name": "עיבוד אותות ותמונות",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "00440198", "00440202", "00460200", "02360860",
                        "00460010", "00460345", "02360216", "00460197",
                        "01040193", "02360330", "00460201", "00460332",
                        "00460745", "00460746", "02360873", "02360373",
                        "02360861", "00460733", "00460747", "00460831",
                        "00460195", "02360766", "02360329", "02360862",
                    ],
                    "mandatory": [["00440198"], ["00440202", "00460200", "02360860"]]
                },
                {
                    "name": "מערכות נבונות",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "00460345", "02360216", "02360501", "02360927",
                        "00460212", "00460010", "00460213", "02340292",
                        "02360372", "02360373", "02360716", "02360766",
                        "00460195", "02360760", "02360781", "04600211",
                        "00460203", "00460215", "02360329", "02360861",
                        "02360873", "00460746", "00460747", "00460853",
                        "00460200", "02360860", "02360862", "02360767",
                    ],
                    "mandatory": [["00460345", "02360216", "02360501", "02360927", "00460212"]]
                },
                {
                    "name": "מעגלים אלקטרוניים משולבים",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "00460045", "00440139", "00440231", "00460237",
                        "00460903", "00460265", "00460129", "00440140",
                        "00440148", "00460187", "00460189", "00460773",
                        "00460851", "00460864", "00460880", "00460881",
                    ],
                    "mandatory": [["00440231"], ["00460237"]]
                },
                {
                    "name": "מערכות תוכנה ותכנות מתקדם",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "02360319", "02360321", "02360322", "02360490",
                        "02360491", "02360496", "02360350", "00460266",
                        "02360360", "02360363", "02360370", "02360376",
                        "02360703", "00460271", "02360351", "02360501",
                        "02360700", "02360780", "02360781", "04600211",
                        "00460272", "00460275", "00460277", "00460278",
                        "02360278", "00460279", "00460280",
                    ],
                    "mandatory": None
                },
                {
                    "name": "בקרה ורובוטיקה",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "00440139", "00440191", "00460192", "00460203",
                        "00440198", "00440202", "00460042", "00460189",
                        "00460196", "00460197", "02360330", "01040193",
                        "02360766", "00460195", "02360767", "02360927",
                        "00460212", "00460213",
                    ],
                    "mandatory": [["00440191"]]
                },
                {
                    "name": "שפות תכנות, שפות פורמליות וטבעיות",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "02340129", "02340292", "02360319", "02360299",
                        "02360342", "02360345", "00460277", "00460266",
                        "02360360", "02360780",
                    ],
                    "mandatory": [["02340129"]]
                },
                {
                    "name": "טכנולוגיות קוונטיות",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "00460243", "01260604", "01260605", "02360990",
                        "01160031", "00460052", "00460054", "00460232",
                        "00460240", "00460241", "00460734", "01160037",
                    ],
                    "mandatory": [["00460243"], ["02360990", "01160031", "00460734"]]
                },
                {
                    "name": "אנרגיה ומערכות הספק",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "00460042", "00440139", "00340034", "00440191",
                        "00440198", "00460044", "00460045", "00460197",
                        "00340035",
                    ],
                    "mandatory": [["00460042"], ["00440139", "00340034"]]
                },
                {
                    "name": "יסודות פיזיקליים בהנדסת מחשבים",
                    "courses_sum": {"$numberLong": "3"},
                    "course_list": [
                        "00440124", "00460225", "00440231", "00460237",
                        "00460052", "00460129", "00460241", "00440239",
                        "00460012", "00460230", "00460235", "00460239",
                        "00460242", "00460243", "00460265", "00460773",
                        "00460968",
                    ],
                    "mandatory": [["00440124"]]
                },
            ],
            "groups_number": {"$numberLong": "2"}
        }
    }

    # Build course_to_bank
    c2b = {}

    for cid in chova:
        c2b[pad(cid)] = "חובה"
    for cid in chova_alternatives:
        c2b[pad(cid)] = "חובה"

    for cid in liba:
        c2b[pad(cid)] = "ליבה"

    # Project courses
    project_courses = [
        "00440167", "00440169",
        # All CS project courses from 4-year
        "02340302", "02340303", "02340304", "02340313", "02340326", "02340329",
        "02360125", "02360272", "02360303", "02360323", "02360328", "02360333",
        "02360340", "02360346", "02360349", "02360361", "02360366", "02360371",
        "02360381", "02360388", "02360499", "02360502", "02360503", "02360504",
        "02360512", "02360513", "02360524", "02360526", "02360729", "02360754",
        "02360757", "02360768", "02360828", "02360874", "02360991",
    ]
    for cid in project_courses:
        c2b[pad(cid)] = "פרויקט"

    # Collect ALL unique courses from spec groups into קבוצות התמחות
    all_spec_courses = set()
    for group in compeng_spec_groups["SpecializationGroups"]["groups_list"]:
        for cid in group["course_list"]:
            all_spec_courses.add(pad(cid))

    for cid in all_spec_courses:
        if cid not in c2b:
            c2b[cid] = "קבוצות התמחות"

    # Add CS elective courses from 4-year ref as בחירה פקולטית options
    ref_banks = get_ref4_courses_by_bank(ref4)
    for cid in ref_banks.get("רשימה א", []):
        if cid not in c2b:
            c2b[cid] = "בחירה פקולטית"
    for cid in ref_banks.get("רשימה ב", []):
        if cid not in c2b:
            c2b[cid] = "בחירה פקולטית"

    banks = [
        {"name": "חובה", "rule": "All", "credit": 113.5},
        {"name": "ליבה", "rule": {"AccumulateCourses": {"$numberLong": "2"}}, "credit": 6.0},
        {"name": "קבוצות התמחות", "rule": compeng_spec_groups, "credit": 27.0},
        {"name": "בחירה פקולטית", "rule": "AccumulateCredit", "credit": 0.0},
        {"name": "פרויקט", "rule": {"AccumulateCourses": {"$numberLong": "2"}}, "credit": None},
        {"name": "בחירת העשרה", "rule": "Malag", "credit": 6.0},
        {"name": "חינוך גופני", "rule": "Sport", "credit": 2.0},
        {"name": "בחירה חופשית", "rule": "Elective", "credit": 4.0},
    ]

    overflows = [
        {"from": "חובה", "to": "בחירה פקולטית"},
        {"from": "ליבה", "to": "בחירה פקולטית"},
        {"from": "קבוצות התמחות", "to": "בחירה פקולטית"},
        {"from": "פרויקט", "to": "בחירה פקולטית"},
        {"from": "בחירה פקולטית", "to": "בחירה חופשית"},
        {"from": "בחירת העשרה", "to": "בחירה חופשית"},
        {"from": "חינוך גופני", "to": "בחירה חופשית"},
    ]

    # Clean up: remap inherited banks to valid ones
    valid = {b["name"] for b in banks}
    c2b = clean_c2b(c2b, valid, remap={
        "רשימה א": "בחירה פקולטית",
        "רשימה ב": "בחירה פקולטית",
        "שרשרת מדעית": None,
        "מתמטי נוסף": None,
        "סמינר": None,
    })

    return make_catalog(
        name="מדמח הנדסת מחשבים 2024-2025",
        total_credit=158.5,
        description="המסלול להנדסת מחשבים - תואר מוסמך למדעים (B.Sc.) בהנדסת מחשבים, משותף לפקולטה להנדסת חשמל ומחשבים ולפקולטה למדעי המחשב 2024-2025",
        course_banks=banks,
        credit_overflows=overflows,
        course_to_bank=c2b,
        catalog_replacements={
            "01040134": ["01040158"],
            "00440252": ["02340252"],
            "02340123": ["00460209"],
            "02360267": ["00460267"],
        },
        common_replacements=COMMON_REPLACEMENTS,
    )


# ---------------------------------------------------------------------------
# Track 5: CS + Math (152.0 credits)
# ---------------------------------------------------------------------------

def build_csmath(ref4):
    chova = [
        # Sem 1
        "01040195", "01040066", "02340114", "02340129", "03240033",
        # Sem 2
        "01040281", "01040168", "02340124", "02340141", "01140071",
        # Sem 3
        "01040295", "01040293", "01040222", "02340218", "00440252",
        # Sem 4
        "01040142", "01040285", "01040158", "02340118", "02340247",
        # Sem 5
        "01040122", "01040279", "02360343", "01040294",
        # Sem 6
        "01040192", "01060156", "02340123", "02360360",
    ]

    # Alternative: 02340125 can replace 01040294
    chova_alt = ["02340125"]

    # Science chain courses (physics/bio/chem)
    chain_courses_phys = ["01140075", "01140052", "01140054"]
    chain_courses_bio = ["01340058", "01340020"]
    chain_courses_chem = ["01240120", "01250801", "01240510"]

    csmath_chains = [
        ["01140075"],
        ["01140052", "01140054"],
        ["01340058", "01340020"],
        ["01240120", "01250801"],
        ["01240120", "01240510"],
        ["01240120", "01140052"],
    ]

    # Build course_to_bank
    c2b = {}

    for cid in chova:
        c2b[pad(cid)] = "חובה"
    for cid in chova_alt:
        c2b[pad(cid)] = "חובה"

    # Science chain
    all_chain = set()
    for ch in csmath_chains:
        for cid in ch:
            all_chain.add(pad(cid))
    for cid in all_chain:
        c2b[cid] = "שרשרת מדעית"

    # CS elective courses from 4-year reference (for בחירה ממדעי המחשב)
    ref_banks = get_ref4_courses_by_bank(ref4)
    cs_electives = set()
    for bank_name in ["רשימה א", "קבוצות התמחות"]:
        for cid in ref_banks.get(bank_name, []):
            cs_electives.add(cid)

    for cid in cs_electives:
        if cid not in c2b:
            c2b[cid] = "בחירה פקולטית"

    # Projects from 4-year
    for cid in ref_banks.get("פרויקט", []):
        if cid not in c2b:
            c2b[cid] = "פרויקט"

    # Seminars from 4-year
    for cid in ref_banks.get("סמינר", []):
        if cid not in c2b:
            c2b[cid] = "סמינר מתמטיקה"

    # Math elective courses
    math_electives = [
        "01040157", "01040158", "01040165", "01040192", "01040221",
        "01040223", "01040293", "01040294",
    ]
    for cid in math_electives:
        if pad(cid) not in c2b:
            c2b[pad(cid)] = "בחירה פקולטית"

    banks = [
        {"name": "חובה", "rule": "All", "credit": 107.5},
        {"name": "שרשרת מדעית", "rule": {"Chains": csmath_chains}, "credit": 5.0},
        {"name": "בחירה פקולטית", "rule": "AccumulateCredit", "credit": 29.5},
        {"name": "פרויקט", "rule": {"AccumulateCourses": {"$numberLong": "1"}}, "credit": None},
        {"name": "סמינר מתמטיקה", "rule": {"AccumulateCourses": {"$numberLong": "1"}}, "credit": None},
        {"name": "בחירת העשרה", "rule": "Malag", "credit": 6.0},
        {"name": "חינוך גופני", "rule": "Sport", "credit": 2.0},
        {"name": "בחירה חופשית", "rule": "Elective", "credit": 2.0},
    ]

    overflows = [
        {"from": "חובה", "to": "בחירה פקולטית"},
        {"from": "שרשרת מדעית", "to": "בחירה פקולטית"},
        {"from": "פרויקט", "to": "בחירה פקולטית"},
        {"from": "סמינר מתמטיקה", "to": "בחירה פקולטית"},
        {"from": "בחירה פקולטית", "to": "בחירה חופשית"},
        {"from": "בחירת העשרה", "to": "בחירה חופשית"},
        {"from": "חינוך גופני", "to": "בחירה חופשית"},
    ]

    # Clean up: remap inherited banks to valid ones
    valid = {b["name"] for b in banks}
    c2b = clean_c2b(c2b, valid, remap={
        "רשימה א": "בחירה פקולטית",
        "רשימה ב": "בחירה פקולטית",
        "מתמטי נוסף": "בחירה פקולטית",
        "סמינר": None,
        "קבוצות התמחות": "בחירה פקולטית",
    })

    return make_catalog(
        name="מדמח ומתמטיקה 2024-2025",
        total_credit=152.0,
        description="תוכנית לימודים משולבת לתואר בוגר למדעים במדעי המחשב ובמתמטיקה - בשיתוף עם הפקולטה למתמטיקה 2024-2025",
        course_banks=banks,
        credit_overflows=overflows,
        course_to_bank=c2b,
        catalog_replacements={
            "01040285": ["01040135"],
            "01040294": ["02340125"],
            "00440252": ["02340252"],
        },
        common_replacements=COMMON_REPLACEMENTS,
    )


# ---------------------------------------------------------------------------
# Track 6: CS + Physics (163.5 credits)
# ---------------------------------------------------------------------------

def build_csphysics(ref4):
    chova = [
        # Sem 1
        "00440102", "01040031", "01040166", "02340114", "02340129", "03240033",
        # Sem 2
        "00440252", "01040032", "02340124", "02340141",
        # Sem 3
        "00940412", "01040134", "01040033", "01140020", "01140074", "02340218", "02340292",
        # Sem 4
        "01040285", "01140021", "01140076", "02340118", "02340123", "02340247",
        # Sem 5
        "01040214", "01040220", "01040215", "01140101", "01140086",
        # Sem 6
        "01140035", "01150203", "01140246", "01140036",
        # Sem 7
        "02340125", "01150204", "02360343", "01240108",
        # Sem 8
        "01140037",
    ]

    # Physics elective list (רשימה 1מ"פ)
    physics_electives = [
        "01140210", "01160029", "01160027", "01160031", "02360990",
        "01160354", "01160004", "01140250", "01140252", "01160217",
    ]

    c2b = {}
    for cid in chova:
        c2b[pad(cid)] = "חובה"

    for cid in physics_electives:
        c2b[pad(cid)] = "בחירה מפיזיקה"

    # CS elective courses from 4-year reference
    ref_banks = get_ref4_courses_by_bank(ref4)
    for bank_name in ["רשימה א", "קבוצות התמחות"]:
        for cid in ref_banks.get(bank_name, []):
            if cid not in c2b:
                c2b[cid] = "בחירה ממדעי המחשב"

    for cid in ref_banks.get("פרויקט", []):
        if cid not in c2b:
            c2b[cid] = "פרויקט"

    # רשימה ב from 4-year for wider electives
    for cid in ref_banks.get("רשימה ב", []):
        if cid not in c2b:
            c2b[cid] = "בחירה פקולטית"

    # 02360267 is mentioned as השלמה requirement
    c2b[pad("02360267")] = "בחירה ממדעי המחשב"
    # 02360823 mentioned for quantum info
    c2b[pad("02360823")] = "בחירה פקולטית"

    banks = [
        {"name": "חובה", "rule": "All", "credit": 127.5},
        {"name": "בחירה ממדעי המחשב", "rule": "AccumulateCredit", "credit": 10.0},
        {"name": "בחירה מפיזיקה", "rule": "AccumulateCredit", "credit": 10.0},
        {"name": "בחירה פקולטית", "rule": "AccumulateCredit", "credit": 6.0},
        {"name": "פרויקט", "rule": {"AccumulateCourses": {"$numberLong": "1"}}, "credit": None},
        {"name": "בחירת העשרה", "rule": "Malag", "credit": 6.0},
        {"name": "חינוך גופני", "rule": "Sport", "credit": 2.0},
        {"name": "בחירה חופשית", "rule": "Elective", "credit": 2.0},
    ]

    overflows = [
        {"from": "חובה", "to": "בחירה פקולטית"},
        {"from": "בחירה ממדעי המחשב", "to": "בחירה פקולטית"},
        {"from": "בחירה מפיזיקה", "to": "בחירה פקולטית"},
        {"from": "פרויקט", "to": "בחירה ממדעי המחשב"},
        {"from": "בחירה פקולטית", "to": "בחירה חופשית"},
        {"from": "בחירת העשרה", "to": "בחירה חופשית"},
        {"from": "חינוך גופני", "to": "בחירה חופשית"},
    ]

    # Clean up: remap inherited banks to valid ones
    valid = {b["name"] for b in banks}
    c2b = clean_c2b(c2b, valid, remap={
        "רשימה א": "בחירה פקולטית",
        "רשימה ב": "בחירה פקולטית",
        "שרשרת מדעית": None,
        "מתמטי נוסף": None,
        "סמינר": None,
        "קבוצות התמחות": "בחירה ממדעי המחשב",
    })

    return make_catalog(
        name="מדמח ופיזיקה 2024-2025",
        total_credit=163.5,
        description="תוכנית לימודים משולבת לתואר מוסמך למדעים במדעי המחשב ובפיזיקה - בשיתוף עם הפקולטה לפיזיקה 2024-2025",
        course_banks=banks,
        credit_overflows=overflows,
        course_to_bank=c2b,
        catalog_replacements={
            "01040285": ["01040135"],
            "00440252": ["02340252"],
            "01140074": ["01140071"],
        },
        common_replacements=COMMON_REPLACEMENTS,
    )


# ---------------------------------------------------------------------------
# Track 7: Medicine + CS (223.5 credits)
# ---------------------------------------------------------------------------

def build_medicine(ref4):
    # Semesters 1-3 same as 4-year general track
    chova_cs = [
        # Sem 1 (same as 4-year)
        "01040031", "01040166", "02340114", "02340129", "03240033",
        # Sem 2
        "01040032", "01140071", "02340124", "02340125", "02340141",
        # Sem 3
        "00940412", "01040134", "02340218", "00440252", "02340292",
        # Sem 4
        "01140249", "02340118", "02340123", "02340247", "02360201",
        # Sem 5
        "01240507", "02360501", "02360523",
        # Sem 6
        "02360343", "02360360", "02360503",
    ]

    # Medicine courses (חובה)
    chova_med = [
        # Sem 5
        "02740167", "02740142", "02740257",
        # Sem 6
        "01250803", "02740143", "02740165", "02740266", "02740320",
        # Semesters 7-10 are medicine only (not listed in section, but implied)
    ]

    # CS elective courses (8.5 credits)
    cs_electives_built_in = ["02360201", "02360501", "02360523"]

    c2b = {}
    for cid in chova_cs:
        c2b[pad(cid)] = "חובה"
    for cid in chova_med:
        c2b[pad(cid)] = "חובה"

    # Math additional (from sem 4 "קורס מתמטי נוסף")
    for cid in MATH_ADDITIONAL_COURSES:
        if pad(cid) not in c2b:
            c2b[pad(cid)] = "מתמטי נוסף"

    # CS electives from 4-year
    ref_banks = get_ref4_courses_by_bank(ref4)
    for bank_name in ["רשימה א", "קבוצות התמחות"]:
        for cid in ref_banks.get(bank_name, []):
            if cid not in c2b:
                c2b[cid] = "בחירה בהנדסה"

    for cid in ref_banks.get("פרויקט", []):
        if cid not in c2b:
            c2b[cid] = "פרויקט"

    # Science chain courses -> map to בחירה בהנדסה (no separate chain bank in medicine)
    all_chain = set()
    for ch in CHAINS:
        for cid in ch:
            all_chain.add(pad(cid))
    for cid in all_chain:
        if cid not in c2b:
            c2b[cid] = "בחירה בהנדסה"

    banks = [
        {"name": "חובה", "rule": "All", "credit": 210.0},
        {"name": "מתמטי נוסף", "rule": {"AccumulateCourses": {"$numberLong": "1"}}, "credit": 2.5},
        {"name": "בחירה בהנדסה", "rule": "AccumulateCredit", "credit": 8.5},
        {"name": "פרויקט", "rule": {"AccumulateCourses": {"$numberLong": "1"}}, "credit": None},
        {"name": "חינוך גופני", "rule": "Sport", "credit": 2.0},
        {"name": "בחירה חופשית", "rule": "Elective", "credit": 0.5},
    ]

    overflows = [
        {"from": "חובה", "to": "בחירה בהנדסה"},
        {"from": "מתמטי נוסף", "to": "בחירה בהנדסה"},
        {"from": "פרויקט", "to": "בחירה בהנדסה"},
        {"from": "בחירה בהנדסה", "to": "בחירה חופשית"},
        {"from": "חינוך גופני", "to": "בחירה חופשית"},
    ]

    # Clean up: ensure no courses map to banks that don't exist
    valid = {b["name"] for b in banks}
    c2b = clean_c2b(c2b, valid)

    return make_catalog(
        name="רפואה ומדמח 2024-2025",
        total_credit=223.5,
        description="תוכנית לתואר כפול ברפואה ובמדעי המחשב - מסלול לימודים משותף לפקולטה לרפואה ולפקולטה למדעי המחשב 2024-2025",
        course_banks=banks,
        credit_overflows=overflows,
        course_to_bank=c2b,
        catalog_replacements={
            "01040134": ["01040158"],
            "00440252": ["02340252"],
        },
        common_replacements=COMMON_REPLACEMENTS,
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("Loading reference catalogs...")
    ref4 = load_json(REF_4YEAR)
    ref3 = load_json(REF_3YEAR)

    tracks = [
        ("cyber", "Cyber Security", lambda: build_cyber(ref4)),
        ("data", "Data Analysis", lambda: build_data_analysis(ref3)),
        ("bioinfo", "Bioinformatics", lambda: build_bioinformatics(ref3)),
        ("compeng", "Computer Engineering", lambda: build_compeng(ref4)),
        ("csmath", "CS + Math", lambda: build_csmath(ref4)),
        ("csphysics", "CS + Physics", lambda: build_csphysics(ref4)),
        ("medicine", "Medicine + CS", lambda: build_medicine(ref4)),
    ]

    results = {}
    for key, label, builder in tracks:
        print(f"\nBuilding {label}...")
        catalog = builder()
        out_path = os.path.join(DOCS_DIR, OUTPUT_FILES[key])
        save_json(catalog, out_path)
        n_courses = len(catalog["course_to_bank"])
        n_banks = len(catalog["course_banks"])
        results[label] = {
            "file": OUTPUT_FILES[key],
            "credits": catalog["total_credit"],
            "banks": n_banks,
            "courses": n_courses,
        }

    # Validate all outputs
    print("\n" + "="*60)
    print("VALIDATION")
    print("="*60)

    from validate_catalog import validate

    all_ok = True
    for key, label, _ in tracks:
        out_path = os.path.join(DOCS_DIR, OUTPUT_FILES[key])
        catalog = load_json(out_path)
        errors = validate(catalog)
        if errors:
            all_ok = False
            print(f"\n❌ {label}: {len(errors)} error(s)")
            for e in errors:
                print(f"    • {e}")
        else:
            print(f"  ✅ {label}: valid")

    # Summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    for label, info in results.items():
        print(f"  {label:30s}  {info['credits']:6.1f} credits  {info['banks']:2d} banks  {info['courses']:3d} courses  → {info['file']}")

    if all_ok:
        print("\n✅ All 7 catalogs generated and validated successfully!")
    else:
        print("\n⚠️  Some catalogs have validation errors — review above.")

    return 0 if all_ok else 1


if __name__ == "__main__":
    sys.exit(main())
