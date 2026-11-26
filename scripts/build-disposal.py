"""Build the app's compact guide export from the reviewed KB and geospatial CSVs."""
import argparse
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
FIELDS = {
    "condition": "Conditions", "preparation": "Preparation", "restriction": "Restrictions",
    "special_handling": "Special handling", "quantity_size_restriction": "Quantity or size",
    "collection_requirement": "Collection requirements", "legal_requirement": "Legal requirements",
}
TOPICS = {
    "electronics": ("Electronics", "Devices and accessories"),
    "ink-and-toner-cartridges": ("Electronics", "Ink and toner"),
    "appliances": ("Appliances", "Household appliances"),
    "batteries": ("Special waste", "Batteries"),
    "harmful-household-products": ("Special waste", "Paint and household chemicals"),
    "light-bulbs": ("Special waste", "Light bulbs"),
    "mercury": ("Special waste", "Mercury-containing items"),
    "gas-cylinders-fire-extinguishers": ("Special waste", "Cylinders and extinguishers"),
    "medical-waste": ("Special waste", "Medication and sharps"),
    "automotive-waste": ("Special waste", "Automotive waste"),
    "curbside-composting": ("Food and yard", "Food scraps and soiled paper"),
    "plant-yard-waste": ("Food and yard", "Plants and yard waste"),
    "oil-grease": ("Food and yard", "Cooking oil and grease"),
    "mixed-paper-cardboard": ("Recyclables", "Paper and cardboard"),
    "metal-glass-plastic-cartons": ("Recyclables", "Metal, glass, plastic and cartons"),
    "clothing-household-fabrics-accessories": ("Household goods", "Clothing and textiles"),
    "furniture-mattresses": ("Household goods", "Furniture and bedding"),
    "construction-debris": ("Household goods", "Renovation debris"),
    "animals": ("Other waste", "Animal waste"),
}
OFFICIAL = {"www.nyc.gov", "portal.311.nyc.gov", "www.dec.ny.gov", "dec.ny.gov"}
SCHEDULE = "https://portal.311.nyc.gov/article/?kanumber=KA-01801"

def rows(folder, name):
    with (folder / (name + ".csv")).open(encoding="utf-8-sig", newline="") as source:
        return list(csv.DictReader(source))

def https(url):
    return url if urlparse(url).scheme == "https" and urlparse(url).hostname else ""

def location(item, rule):
    for url in (rule["dsny_url"], rule["source_url"]):
        topic = Path(urlparse(url).path).stem
        if topic in TOPICS:
            category, subcategory = TOPICS[topic]
            if topic == "electronics":
                name = item["item_name"].lower()
                if any(word in name for word in ("phone", "tablet", "reader")):
                    subcategory = "Mobile devices"
                elif any(word in name for word in ("computer", "laptop", "monitor", "keyboard", "mouse")):
                    subcategory = "Computers and accessories"
            return category, subcategory
    return "Other waste", "Other household items"

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("knowledge", type=Path)
    parser.add_argument("geo", type=Path)
    parser.add_argument("--preview", action="store_true")
    args = parser.parse_args()
    kb, geo = args.knowledge, args.geo
    rules = rows(kb, "item_disposal_rules")
    approved = {"publication_eligible", "publication_approved"}
    if args.preview:
        approved.add("controlled_testing_ready")
    selected = defaultdict(list)
    excluded = Counter()
    for rule in rules:
        status = rule["publication_status"]
        if status not in approved or rule["verification_status"] in {
            "unverified", "outdated", "conflicting", "inferred_from_general_rule"
        }:
            excluded[status] += 1
            continue
        selected[rule["item_id"]].append(rule)

    official = defaultdict(dict)
    for evidence in rows(kb, "rule_source_evidence"):
        url = evidence["source_url"]
        if evidence["evidence_role"] == "supports" and https(url) and urlparse(url).hostname in OFFICIAL:
            official[evidence["rule_id"]][url] = evidence["source_section"]

    aliases = defaultdict(list)
    for alias in rows(kb, "item_aliases"):
        aliases[alias["item_id"]].append(alias["alias"])
    taxonomy = {row["taxonomy_id"]: row for row in rows(kb, "waste_taxonomy")}
    mappings = {row["item_id"]: taxonomy[row["taxonomy_id"]]["Subcategory"]
                for row in rows(kb, "item_taxonomy_mapping")
                if row["review_status"] == "mapped" and row["taxonomy_id"] in taxonomy}

    included = {}
    items = []
    all_items = rows(kb, "waste_items")
    for item in all_items:
        item_id = item["item_id"]
        if item_id not in selected:
            continue
        options = selected[item_id]
        category, subcategory = max(
            (location(item, rule) for rule in options), key=lambda pair: pair[0] != "Other waste"
        )
        exported = []
        for rule in options:
            rid = rule["rule_id"]
            sources = official[rid]
            primary = rule["source_url"]
            if https(primary) and urlparse(primary).hostname in OFFICIAL:
                sources.setdefault(primary, rule["source_section"])
            if not sources:
                excluded["missing_official_source"] += 1
                continue
            details = {label: rule[key] for key, label in FIELDS.items() if rule[key]}
            if details.get("Special handling") == details.get("Preparation"):
                details.pop("Special handling", None)
            record = dict(id=rid, methodId=rule["method_id"], method=rule["method"],
                          status=rule["pathway_status"], details=details,
                          sources=list(sources.items()), reviewed=rule["reviewed_date"])
            if rule["pathway_status"] != "prohibited":
                if rule["method"] == "Appointment-Based Collection" and rule["nyc311_url"].endswith("=KA-01792"):
                    record["collection"] = ["Schedule an Appointment", rule["nyc311_url"]]
                elif rule["method"] in {"Bulk Collection", "Curbside Composting", "MGP Recycling", "Paper Recycling"}:
                    record["collection"] = ["Check Collection Schedule", SCHEDULE]
                if rule["facility_type"]:
                    record["facilityType"] = rule["facility_type"]
            exported.append(record)
            included[rid] = rule
        if exported:
            record = dict(id=item_id, name=item["item_name"], category=category, subcategory=subcategory,
                          aliases=sorted(set(aliases[item_id] + [item["official_item_name"]]
                                             + [a.strip() for r in options for a in r["aliases"].split(";")]) - {""}),
                          rules=exported)
            if item_id in mappings:
                record["material"] = mappings[item_id]
            items.append(record)

    sites = {}
    for site in rows(geo, "facilities"):
        if site["publication_status"] != "publication_eligible" or site["location_verification_status"] != "within_nyc_boundary":
            continue
        sites[site["facility_id"]] = dict(id=site["facility_id"], name=site["facility_name"],
                                          type=site["facility_type"], zip=site["zip_code"],
                                          nta=site["nta_name"], operator=site["operator_name"],
                                          hours=site["operating_source_text"],
                                          address=site["address"], borough=site["borough"],
                                          lat=float(site["latitude"]), lng=float(site["longitude"]),
                                          website=https(site["website"]), phone=site["phone"],
                                          verified=site["last_verified"])
    acceptance = {r["acceptance_rule_id"]: r for r in rows(geo, "facility_acceptance_rules")}
    services = {r["facility_service_id"]: r for r in rows(geo, "facility_services")}
    hours = {}
    for h in rows(geo, "facility_operating_hours"):
        if h["original_schedule_text"]:
            hours.setdefault(h["facility_service_id"], h["original_schedule_text"])
    matches = defaultdict(list)
    used = {}
    for match in rows(geo, "item_facility_mapping"):
        rule = included.get(match["part1_rule_id"])
        site = sites.get(match["facility_id"])
        acc = acceptance.get(match["acceptance_rule_id"])
        service = services.get(match["facility_service_id"])
        if (not rule or not site or not service or not acc or rule["pathway_status"] == "prohibited"
            or (rule["item_id"], rule["method_id"]) != (match["item_id"], match["method_id"])
            or acc["item_id"] != rule["item_id"] or acc["facility_service_id"] != service["facility_service_id"]
            or service["facility_id"] != site["id"] or service["method_id"] != rule["method_id"]
            or acc["acceptance_status"] not in {"accepted", "conditionally_accepted"}
            or match["mapping_status"] not in {"verified_listing", "conditional_verified_listing"}):
            continue
        used[site["id"]] = site
        notes = [value for value in (match["applicable_conditions"], acc["preparation_requirements"],
                 acc["restrictions"], service["eligibility"], service["quantity_limit"],
                 hours.get(service["facility_service_id"])) if value]
        matches[rule["rule_id"]].append([site["id"], notes, https(acc["source_reference"]),
                                            hours.get(service["facility_service_id"], "")])

    suffix = "preview" if args.preview else "published"
    facilities = sites
    dest = ROOT / "src" / "data" / f"disposal.{suffix}.json"
    baskets = [[round(float(row["latitude"]), 6), round(float(row["longitude"]), 6),
                row["address"], row["original_basket_type"]]
               for row in rows(geo, "public_infrastructure")
               if row["infrastructure_type"] == "Public Litter Basket"
               and row["location_verification_status"] == "within_nyc_boundary"]
    dest.with_name("baskets.json").write_text(
        json.dumps(baskets, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    dest.write_text(json.dumps(dict(items=items, facilities=facilities, matches=matches), ensure_ascii=False,
                               separators=(",", ":")) + "\n", encoding="utf-8")
    print(json.dumps(dict(items=len(items), rules=len(included), facilities=len(facilities),
                          matches=sum(map(len, matches.values())), excludedItems=len(all_items)-len(items),
                          excludedRules=excluded, bytes=dest.stat().st_size)))

if __name__ == "__main__":
    main()
