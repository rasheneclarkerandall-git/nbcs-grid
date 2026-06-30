"""
parcel_zone_lookup.py
----------------------
Given a JAD2001 point (easting, northing) and zone_polygons.geojson,
returns the matching zone via point-in-polygon test.

Also usable as a batch checker: pass --all to test all 7 pilot parcels
from parcel_data.json against the digitized zone polygons.

Usage:
    python3 parcel_zone_lookup.py --easting 678450 --northing 657032
    python3 parcel_zone_lookup.py --all
"""

import json
import os
import argparse

GEOREF_DIR = os.path.dirname(os.path.abspath(__file__))
ZONES_JSON = os.path.join(GEOREF_DIR, "zone_polygons_stub.geojson")
PARCELS_JSON = os.path.join(GEOREF_DIR, "parcel_data.json")


def point_in_polygon(px, py, ring):
    """
    Ray-casting point-in-polygon for a single exterior ring.
    ring: list of [x, y] pairs (JAD2001), first == last.
    """
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i]
        xj, yj = ring[j]
        if ((yi > py) != (yj > py)) and (px < (xj - xi) * (py - yi) / (yj - yi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def lookup_zone(easting, northing, features):
    """Return list of matching zone feature properties, or []."""
    matches = []
    for feat in features:
        geom = feat.get("geometry", {})
        if geom.get("type") != "Polygon":
            continue
        rings = geom.get("coordinates", [[]])
        if not rings or not rings[0]:
            continue  # not digitized yet
        exterior = rings[0]
        if point_in_polygon(easting, northing, exterior):
            matches.append(feat["properties"])
    return matches


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--zones", default=ZONES_JSON,
                    help="Path to zone_polygons.geojson (default: zone_polygons_stub.geojson)")
    ap.add_argument("--easting", type=float)
    ap.add_argument("--northing", type=float)
    ap.add_argument("--all", action="store_true",
                    help="Test all parcels in parcel_data.json")
    args = ap.parse_args()

    with open(args.zones) as f:
        geojson = json.load(f)
    features = geojson["features"]

    digitized = [f for f in features if f["properties"].get("digitized") and f["geometry"]["coordinates"][0]]
    print(f"Loaded {len(features)} zone stubs, {len(digitized)} digitized.\n")

    if not digitized:
        print("No zones are digitized yet — fill in coordinates in zone_polygons_stub.geojson first.")
        print("Run build_zone_data.py to see the stub structure.")
        return

    if args.all:
        with open(PARCELS_JSON) as f:
            parcels = json.load(f)
        print(f"{'ID':<5} {'LV':<15} {'Zone found'}")
        print("-" * 50)
        for p in parcels:
            e = p["centroid_jad2001"]["easting"]
            n = p["centroid_jad2001"]["northing"]
            matches = lookup_zone(e, n, features)
            if matches:
                for m in matches:
                    print(f"{p['id']:<5} {p['lv']:<15} {m['zone_id']} ({m['zone_type']}, {m['lpa']})")
            else:
                print(f"{p['id']:<5} {p['lv']:<15} NO MATCH — point not inside any digitized zone")
    elif args.easting is not None and args.northing is not None:
        matches = lookup_zone(args.easting, args.northing, features)
        if matches:
            for m in matches:
                print(f"Zone: {m['zone_id']} | {m['zone_type']} | {m['lpa']} | {m['do_ref']}")
        else:
            print(f"No zone match for E={args.easting}, N={args.northing}")
    else:
        ap.print_help()


if __name__ == "__main__":
    main()
