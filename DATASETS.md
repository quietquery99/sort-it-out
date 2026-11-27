# Datasets

This inventory describes the data bundled with SortItOut NYC and the data collected by the live site. Counts refer to the snapshot checked into this repository.

## Home, Disposal and Map

The [production dataset](src/data/disposal.published.json) combines the Waste Knowledge Base v2 and Geospatial Database v1. Home and Disposal share 297 canonical items and 391 disposal rules. Each rule retains its controlled-testing status, official sources and conditions. The interface labels these rules **Testing guidance**. Of 406 source rules, 15 marked review-required were withheld. Of 310 source items, 13 have no included rule.

Map reads 469 publication-eligible facilities and 654 item-rule-to-facility mapping records from the same export. These are mapping records, not 654 distinct facilities. The [public litter basket layer](src/data/baskets.json) contains 20,206 locations.

To reproduce this authorized release from the two source directories:

```sh
python scripts/build-disposal.py path/to/waste_knowledge_base_v2 path/to/geospatial_database_v1/processed --publish-testing
```

## Directory and events

| Source | Records in the snapshot | Used for |
| --- | ---: | --- |
| [NYC Open Data · DSNY Special Waste Drop-off Sites](https://data.cityofnewyork.us/d/242c-ru4i) | 5 | Special waste map pins |
| [NYC Open Data · Food Scrap Drop-off Locations](https://data.cityofnewyork.us/d/if26-z6xq) | 321 | Compost map pins. The calendar uses 115 locations with parsed recurring schedules. |
| [Project donation sites spreadsheet](https://docs.google.com/spreadsheets/d/1aYAZ4aoioaOyQ9RGHfQc_KEMndDbQjjIG-cmyv2PRsA/edit#gid=187832181) | 420 | 368 listings categorized primarily as textiles and reuse, and 52 as food donation. Listings can appear in multiple categories. |
| [Sample map pins](src/data/sites.js) | 6 | Prototype examples excluded from the live directory. |
| [Manual locations](src/data/manual-sites.json) and [one-off events](src/data/events.json) | 0 | Files for adding manually curated locations and one-off events. |

The separate directory snapshot contains 746 imported listings. The directory excludes the six sample pins. Imported locations are stored in [`sites.generated.json`](src/data/sites.generated.json). The public site reads this bundled snapshot when visitors open the map.

## Reference and prototype data

| Dataset | Records | Repository file |
| --- | ---: | --- |
| Legacy item guides | 35 | [`items.js`](src/data/items.js) |
| Donation seed | 70 items in 9 categories | [Donation guide seed](src/data/donation.seed.json). Sixteen entries reference conditional Donate rules. Directory material tags provide contact leads. |
| Detailed guides | 2 | [`guides.js`](src/data/guides.js) |
| Sample pickup zones | 5 | [`zones.js`](src/data/zones.js). Confirm actual collection schedules with DSNY. |
| Illustrative community district profiles | 7 | [`districts.js`](src/data/districts.js). Diversion, refuse, and 311 complaint figures are placeholders. |

## Live user submissions

The Cloudflare D1 database `sortitout-db` stores user suggestions in the `submissions` table. See [`schema.sql`](schema.sql) for the table definition.

## Refresh the location snapshot

Run `npm run data` from the repository root to import the NYC Open Data datasets and donation spreadsheet again. Review changes to [`sites.generated.json`](src/data/sites.generated.json) before deploying. The importer is in [`scripts/build-sites.mjs`](scripts/build-sites.mjs).
