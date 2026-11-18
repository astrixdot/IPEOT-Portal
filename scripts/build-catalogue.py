#!/usr/bin/env python3
"""Turn the consolidate workbook into ipeot-crudservice/catalogue-data.js."""

import json
import zipfile
from xml.etree import ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
XLSX = ROOT / "Consolidate Sheet Data_For_IPEOT_Portal-D1.xlsx"
OUT = ROOT / "ipeot-crudservice" / "catalogue-data.js"

NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def col_index(letters):
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n


def load_sheets():
    with zipfile.ZipFile(XLSX) as z:
        shared = []
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root.findall("m:si", NS):
            shared.append("".join((t.text or "") for t in si.findall(".//m:t", NS)))
        wb = ET.fromstring(z.read("xl/workbook.xml"))
        rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
        rid = {rel.get("Id"): rel.get("Target") for rel in rels}
        sheets = {}
        for sheet in wb.findall("m:sheets/m:sheet", NS):
            target = rid[sheet.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")]
            if not target.startswith("xl/"):
                target = "xl/" + target
            xml = ET.fromstring(z.read(target))
            rows = {}
            for row in xml.findall("m:sheetData/m:row", NS):
                cells = {}
                for cell in row.findall("m:c", NS):
                    ref = cell.get("r") or ""
                    letters = "".join(ch for ch in ref if ch.isalpha())
                    value = cell.find("m:v", NS)
                    if value is None or value.text is None:
                        continue
                    text = shared[int(value.text)] if cell.get("t") == "s" else value.text
                    text = " ".join(text.split())
                    if text:
                        cells[col_index(letters)] = text
                if cells:
                    rows[int(row.get("r"))] = cells
            sheets[sheet.get("name")] = rows
    return sheets


def bucket():
    return {
        "sampleReport": "",
        "inputs": [],
        "specimens": [],
        "equipment": [],
        "tests": [],
        "software": [],
        "formSchema": None,
    }


def add(items, value):
    value = " ".join((value or "").split())
    if not value or value.upper() == "NA":
        return
    if value not in items:
        items.append(value)


def split_list(value):
    if not value or value.strip().upper() == "NA":
        return []
    return [part.strip() for part in value.split(",") if part.strip() and part.strip().upper() != "NA"]


def tokens(value):
    if not value:
        return []
    cleaned = value.replace(".", ",").replace(";", ",")
    out = []
    for part in cleaned.split(","):
        token = part.strip().strip(".").upper()
        if token:
            out.append(token)
    return out


def ensure(studies, code):
    studies.setdefault(code, bucket())
    return studies[code]


DECK = ["Main deck", "Cellar deck", "Lower deck", "Middle deck", "Top deck"]
FACE4 = ["South", "East", "West", "North"]
FACE8 = FACE4 + ["North West", "South West", "South East", "North East"]


def structure_schema():
    def text(key, label):
        return {"key": key, "label": label, "type": "text"}

    def number(key, label, repeat=False, per_item=False):
        return {"key": key, "label": label, "type": "number", "repeat": repeat, "perItem": per_item}

    def select(key, label, options, per_item=False):
        return {"key": key, "label": label, "type": "select", "options": options, "perItem": per_item}

    def upload(key, label, per_item=False):
        return {"key": key, "label": label, "type": "upload", "perItem": per_item}

    scheme = text("scheme", "Project or scheme under which the modification is proposed")
    sia = {
        "kind": "structure-sia",
        "categories": ["scheduled", "unscheduled"],
        "platform": {
            "key": "platform",
            "label": "Jacket or platform name",
            "type": "text",
            "pattern": "^[A-Za-z0-9]+$",
            "hint": "Letters and numbers only, with no spaces or special characters.",
        },
        "modifications": [
            {
                "code": "new_risers",
                "name": "New risers",
                "sampleReport": "PB",
                "fields": [
                    scheme,
                    number("count", "Number of risers", repeat=True),
                    number("size", "Riser size in inch", per_item=True),
                    text("service", "Service of riser") | {"perItem": True},
                    select("riserType", "Type of riser", ["Flexi", "Normal", "J/I Tube", "Other"], per_item=True),
                    select("face", "Face of the jacket", FACE4, per_item=True),
                ],
            },
            {
                "code": "deck_extension",
                "name": "Deck extension",
                "sampleReport": "TCPP",
                "fields": [
                    scheme,
                    number("count", "Number of deck extensions", repeat=True),
                    text("size", "Size of deck extension in metres (length x breadth)") | {"perItem": True},
                    select("level", "Deck extension level", DECK, per_item=True),
                    select("face", "Location of deck extension", FACE4, per_item=True),
                    upload("drawing", "Marked-up drawing of the deck extension", per_item=True),
                ],
            },
            {
                "code": "clamp_on",
                "name": "Clamp-on",
                "sampleReport": "WI8",
                "fields": [
                    scheme,
                    number("count", "Number of clamp-ons", repeat=True),
                    number("size", "Size of clamp-on conductors in inch", per_item=True),
                ],
            },
            {
                "code": "new_bridge",
                "name": "New bridge",
                "sampleReport": "B12-11",
                "fields": [
                    scheme,
                    number("length", "Bridge length in metres"),
                    number("load", "Intensity of bridge load in tonnes per metre"),
                    select("tier", "Tier of bridge", ["One tier", "Two tier"]),
                    select("deck", "Deck on which the bridge is placed", DECK),
                    select("face", "Location of the bridge on the deck", FACE8),
                    upload("drawing", "Marked-up drawing of the bridge support"),
                ],
            },
            {
                "code": "new_equipment",
                "name": "New equipment without deck extension",
                "sampleReport": "B192-5",
                "fields": [
                    scheme,
                    text("equipmentType", "Type of equipment"),
                    text("footprint", "Footprint of equipment in metres"),
                    select("location", "Location of the new equipment", DECK),
                    text("load", "Load intensity or load of the new equipment in tonnes"),
                    text("removed", "Any existing facilities or load removed"),
                    upload("drawing", "Marked-up drawing of the new equipment layout"),
                ],
            },
            {
                "code": "life_boat",
                "name": "Life boat",
                "sampleReport": "NLW",
                "fields": [
                    scheme,
                    number("count", "Number of life boats", repeat=True),
                    number("weight", "Weight of life boat in kg", per_item=True),
                    select("level", "Life boat level", DECK, per_item=True),
                    number("capacity", "Capacity of the new life boat", per_item=True),
                    upload("drawing", "Marked-up drawing of the new life boat", per_item=True),
                ],
            },
            {
                "code": "new_crane",
                "name": "New crane",
                "sampleReport": "B-173-AB",
                "fields": [
                    scheme,
                    number("count", "Number of cranes", repeat=True),
                    number("capacity", "Crane capacity in tonnes", per_item=True),
                    select("level", "Crane location level", DECK, per_item=True),
                    number("deadLoad", "Crane dead load in tonnes", per_item=True),
                    number("boomRest", "Boom rest load in tonnes", per_item=True),
                    upload("drawing", "Marked-up drawing of the crane and boom rest", per_item=True),
                ],
            },
            {
                "code": "enhanced_crane",
                "name": "Enhanced crane capacity",
                "sampleReport": "PL",
                "fields": [
                    scheme,
                    number("capacity", "Enhanced crane capacity in tonnes"),
                    select("level", "Crane location level", DECK),
                    number("load", "Crane load in tonnes"),
                    number("boomRest", "Boom rest load in tonnes"),
                    upload("drawing", "Marked-up drawing of the crane and boom rest"),
                ],
            },
            {
                "code": "damage",
                "name": "Damage",
                "sampleReport": "NU",
                "fields": [scheme, upload("memo", "Memo regarding damage from IMR")],
            },
            {
                "code": "sump_caisson",
                "name": "External sump caisson",
                "sampleReport": "SHP",
                "fields": [
                    scheme,
                    number("count", "Number of sump caissons", repeat=True),
                    number("diameter", "Diameter of sump caisson in inch", per_item=True),
                    text("leg", "Location of sump caisson — leg") | {"perItem": True},
                ],
            },
            {
                "code": "riser_protector",
                "name": "Riser protector",
                "sampleReport": "SP",
                "fields": [
                    scheme,
                    number("count", "Number of riser protectors", repeat=True),
                    select("face", "Face of the jacket", FACE4, per_item=True),
                ],
            },
            {
                "code": "modular_rig",
                "name": "Modular rig",
                "sampleReport": "NLM-3",
                "fields": [
                    scheme,
                    number("load", "Modular rig load in tonnes"),
                    upload("drawing", "Marked-up drawing of the modular rig"),
                ],
            },
            {
                "code": "boat_landing",
                "name": "Boat landing",
                "sampleReport": "PK",
                "fields": [
                    scheme,
                    number("count", "Number of boat landings", repeat=True),
                    number("stage", "Stage of boat landing", per_item=True),
                    select("face", "Face of the jacket", FACE4, per_item=True),
                ],
            },
            {
                "code": "scour",
                "name": "Scour",
                "sampleReport": "B-55",
                "fields": [scheme, upload("memo", "Memo regarding scour from IMR")],
            },
            {
                "code": "other",
                "name": "Any other",
                "sampleReport": "HQ",
                "fields": [
                    scheme,
                    {"key": "brief", "label": "Brief about the modification, addition, or issue", "type": "textarea", "maxLength": 500},
                    upload("attachment", "Attachment"),
                ],
            },
        ],
    }
    life = {
        "kind": "structure-life",
        "categories": ["scheduled", "unscheduled"],
        "sampleReport": "BB",
        "fields": [
            {
                "key": "platform",
                "label": "Jacket or platform name",
                "type": "text",
                "pattern": "^[A-Za-z0-9]+$",
                "hint": "Letters and numbers only, with no spaces or special characters.",
            },
            scheme,
        ],
    }
    return sia, life


def fill_standard(studies, rows, serial_to_code, code_map, study_rows, extra_rows, software_rows, equipment_is_software=False):
    for row_no in study_rows:
        cells = rows.get(row_no, {})
        serial = cells.get(2, "")
        code = serial_to_code.get(serial)
        if not code:
            continue
        study = ensure(studies, code)
        study["sampleReport"] = cells.get(4, study["sampleReport"])
        targets = [code]
        for token in tokens(cells.get(7, "")):
            mapped = code_map.get(token)
            if mapped and mapped not in targets:
                targets.append(mapped)
        for target in targets:
            add(ensure(studies, target)["inputs"], cells.get(6, ""))
        for specimen in split_list(cells.get(9, "")):
            add(study["specimens"], specimen)
        if not equipment_is_software:
            for item in split_list(cells.get(11, "")):
                add(study["equipment"], item)
            for item in split_list(cells.get(12, "")):
                add(study["tests"], item)
    for row_no in extra_rows:
        cells = rows.get(row_no, {})
        targets = [code_map[token] for token in tokens(cells.get(7, "")) if token in code_map]
        if not targets:
            continue
        for target in targets:
            add(ensure(studies, target)["inputs"], cells.get(6, ""))
            for item in split_list(cells.get(11, "")):
                if item.lower() != "software":
                    add(ensure(studies, target)["equipment"], item)
            for item in split_list(cells.get(12, "")):
                add(ensure(studies, target)["tests"], item)
    for row_no in software_rows:
        cells = rows.get(row_no, {})
        name = cells.get(11, "")
        use = cells.get(12, "")
        if not name or name.lower() == "software":
            continue
        for code in serial_to_code.values():
            add_software(ensure(studies, code), name, use)


def add_software(study, name, use):
    if any(item["name"] == name for item in study["software"]):
        return
    study["software"].append({"name": name, "use": use})


def main():
    sheets = load_sheets()
    studies = {}

    d1 = {str(i): code for i, code in enumerate(
        ["D1-ACID", "D1-SAND", "D1-SOLVENT", "D1-AFRAC", "D1-WOBRINE", "D1-WINTEG"], 1
    )}
    fill_standard(studies, sheets["Department-I Production"], d1, {}, range(7, 13), [], [17, 18])
    # Software on this sheet is specific, not department-wide. Rebuild those two links.
    for code in d1.values():
        studies[code]["software"] = []
    add_software(studies["D1-AFRAC"], "Gohfer", "Acid fracturing")
    add_software(studies["D1-WINTEG"], "WellCat", "Well integrity analysis")

    rre = sheets["Department II RRE"]
    rre_codes = {2: "D2-HAZOP", 3: "D2-QRA-ON", 4: "D2-QRA-OFF", 5: "D2-EERA"}
    for col, code in rre_codes.items():
        study = ensure(studies, code)
        study["sampleReport"] = rre.get(4, {}).get(col, "")
        for row_no in range(5, 23):
            add(study["inputs"], rre.get(row_no, {}).get(col, ""))
        add_software(study, rre.get(23, {}).get(col, ""), "Study software")

    process_codes = {
        "1": "D2-FGR", "2": "D2-ADEQ-PROC", "3": "D2-ADEQ-HX", "4": "D2-ADEQ-FLARE",
        "5": "D2-GDU", "6": "D2-SCHEME", "7": "D2-MERGE", "8": "D2-SHRINK",
        "9": "D2-FLOW", "10": "D2-PPD", "11": "D2-GAS",
    }
    process = sheets["Department II Process"]
    for row_no in list(range(7, 15)) + [27, 28, 29]:
        cells = process.get(row_no, {})
        code = process_codes.get(cells.get(2, ""))
        if not code:
            continue
        study = ensure(studies, code)
        study["sampleReport"] = cells.get(4, "")
        targets = [code]
        for token in tokens(cells.get(7, "")):
            mapped = process_codes.get(token)
            if mapped and mapped not in targets and token in {"1", "2", "3", "4", "5", "6", "7", "8"}:
                targets.append(mapped)
        for target in targets:
            add(ensure(studies, target)["inputs"], cells.get(6, ""))
        for specimen in split_list(cells.get(9, "")):
            add(study["specimens"], specimen)
        for item in split_list(cells.get(11, "")):
            add(study["equipment"], item)
        for item in split_list(cells.get(12, "")):
            add(study["tests"], item)
    for row_no, name in [(18, None)]:
        pass
    for row_no in (18, 19, 20, 21):
        cells = process.get(row_no, {})
        for code in ["D2-FGR", "D2-ADEQ-PROC", "D2-ADEQ-HX", "D2-ADEQ-FLARE", "D2-GDU", "D2-SCHEME", "D2-MERGE", "D2-SHRINK"]:
            add_software(ensure(studies, code), cells.get(11, ""), cells.get(12, ""))

    d3 = {
        "CA": "D3-CA", "MOC": "D3-MOC", "RCA": "D3-RCA", "MT": "D3-MT",
        "SM": "D3-SM", "CP": "D3-CP", "PAINT": "D3-PAINT",
    }
    serial_d3 = {str(i): code for i, code in enumerate(d3.values(), 1)}
    fill_standard(studies, sheets["Department-III Corrosion- Scale"], serial_d3, d3, range(7, 14), [14, 15, 16], [17, 18, 19, 20])

    d4 = {
        "CGL": "D4-CGL", "IGL": "D4-IGL", "SRP": "D4-SRP", "ESP": "D4-ESP",
        "PCP": "D4-PCP", "PLF": "D4-PLF", "JP": "D4-JP", "GLNO": "D4-GLNO", "LMS": "D4-LMS",
    }
    serial_d4 = {str(i): code for i, code in enumerate(d4.values(), 1)}
    artificial = sheets["Department -IV Artificial Lift"]
    fill_standard(studies, artificial, serial_d4, d4, range(7, 16), range(16, 24), [])
    for row_no in range(14, 19):
        cells = artificial.get(row_no, {})
        name = cells.get(11, "")
        if not name or name.lower() == "software":
            continue
        for code in d4.values():
            add_software(ensure(studies, code), name, cells.get(12, ""))

    d5_names = [
        ("D5-LH", "Liquid holdup estimation and liquid management strategy for trunklines"),
        ("D5-SA", "Surge analysis"),
        ("D5-FH", "Flow hydraulic study (offshore lines)"),
        ("D5-FR", "Field development scheme or feasibility report (offshore)"),
        ("D5-NA", "Nodal analysis study (offshore networks)"),
        ("D5-TS", "Transient simulation for deepwater networks"),
        ("D5-VL", "VLP studies for upcoming offshore fields"),
        ("D5-SU", "Field start-up studies"),
    ]
    d5 = {"LH": "D5-LH", "SA": "D5-SA", "FH": "D5-FH", "FR": "D5-FR", "NA": "D5-NA", "TS": "D5-TS", "VL": "D5-VL", "SU": "D5-SU"}
    deep = sheets["Department V Deep Water"]
    for index, (code, _name) in enumerate(d5_names, 1):
        cells = deep.get(5 + index, {})
        study = ensure(studies, code)
        study["sampleReport"] = cells.get(3, "")
    for row_no in range(6, 18):
        cells = deep.get(row_no, {})
        targets = [d5[token] for token in tokens(cells.get(8, "")) if token in d5]
        for target in targets:
            add(ensure(studies, target)["inputs"], cells.get(7, ""))
        software_name = cells.get(11, "")
        if software_name and software_name.lower() not in {"oil sample"} and not software_name[:1].isdigit():
            for code in d5.values():
                add_software(ensure(studies, code), software_name, cells.get(12, ""))
        if software_name.lower() == "oil sample":
            for target in targets or d5.values():
                add(ensure(studies, target)["specimens"], "Oil sample")

    geo = {"SIR_PL": "D6-SOIL-JKT", "SIR_JCK": "D6-SOIL-JU", "SIR_MB": "D6-SOIL-MOOR", "SSA": "D6-SSA", "OTH": "D6-GEOTECH"}
    serial_geo = {str(i): code for i, code in enumerate(geo.values(), 1)}
    fill_standard(studies, sheets["Department VI Geotech"], serial_geo, geo, range(7, 12), [12], range(17, 24))

    sia, life = structure_schema()
    ensure(studies, "D6-SIA")["formSchema"] = sia
    ensure(studies, "D6-SIA")["sampleReport"] = "SIA"
    ensure(studies, "D6-LIFE")["formSchema"] = life
    ensure(studies, "D6-LIFE")["sampleReport"] = "BB"

    extra_types = [
        {"code": code, "name": name, "department": "D5", "workCentre": None}
        for code, name in d5_names
    ]
    payload = {"extraTypes": extra_types, "studies": studies}
    text = "export const catalogue = " + json.dumps(payload, indent=2) + ";\n"
    OUT.write_text(text)
    print(f"wrote {OUT} studies={len(studies)} extra={len(extra_types)}")


if __name__ == "__main__":
    main()
