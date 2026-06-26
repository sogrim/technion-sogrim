#!/usr/bin/env python3
"""derive_2024_catalog.py — Derive a 2024-2025 catalog from its 2025-2026 template.

Applies course removals (year-drift courses absent from the 2024-2025 PDF) and
course-ID swaps (courses that changed ID between years) across course_to_bank,
specialization-group course lists / mandatory lists, and catalog_replacements.

This is a generic helper; per-track removal/swap/rename data is passed via a
small JSON spec file or edited inline in build scripts that import it.
"""
import json
import copy


def load(path):
    return json.load(open(path, encoding="utf-8"))


def save(data, path):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def _swap_in_list(lst, swap):
    return [swap.get(x, x) for x in lst]


def derive(template, *, name, description, remove=None, swap=None,
           extra_repl=None, faculty="ComputerScience"):
    """Return a new catalog derived from `template`.

    remove: iterable of course IDs to delete everywhere.
    swap:   dict old_id -> new_id applied everywhere.
    extra_repl: dict merged into catalog_replacements (after swap of keys).
    """
    cat = copy.deepcopy(template)
    remove = set(remove or [])
    swap = dict(swap or {})

    cat["_id"] = {"$oid": ""}
    cat["name"] = name
    cat["description"] = description
    cat["faculty"] = faculty

    # course_to_bank: remove, then swap keys (preserve bank)
    c2b = {}
    for cid, bank in cat["course_to_bank"].items():
        if cid in remove:
            continue
        c2b[swap.get(cid, cid)] = bank
    cat["course_to_bank"] = dict(sorted(c2b.items()))

    # specialization groups: course_list + mandatory
    for bank in cat["course_banks"]:
        rule = bank.get("rule")
        if isinstance(rule, dict) and "SpecializationGroups" in rule:
            for g in rule["SpecializationGroups"]["groups_list"]:
                g["course_list"] = [swap.get(x, x) for x in g["course_list"]
                                    if x not in remove]
                if g.get("mandatory"):
                    new_mand = []
                    for opt in g["mandatory"]:
                        opt2 = [swap.get(x, x) for x in opt if x not in remove]
                        if opt2:
                            new_mand.append(opt2)
                    g["mandatory"] = new_mand or None

    # catalog_replacements: drop removed, swap keys
    repl = {}
    for k, v in cat.get("catalog_replacements", {}).items():
        if k in remove:
            continue
        v2 = [swap.get(x, x) for x in v if x not in remove]
        new_k = swap.get(k, k)
        # Drop replacements made meaningless by a swap (key == value) or emptied.
        v2 = [x for x in v2 if x != new_k]
        if not v2:
            continue
        repl[new_k] = v2
    if extra_repl:
        repl.update(extra_repl)
    cat["catalog_replacements"] = repl

    return cat
