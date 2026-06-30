"""
build_zone_data.py
-------------------
Converts the 7 Bybrook parcel WGS84 polygon vertices from mapt.html into
JAD2001 centroids, verifies they fall within the santa_cruz transform extent,
and writes parcel_data.json.

Also writes zone_polygons_stub.geojson — geometry stubs (empty coordinates)
for all amendment zones referenced in the 2018 PDO + 2024 Confirmation
Notification. These stubs are ready for digitizing: fill in the "coordinates"
arrays from the rasterized inset images using transforms.json.

Usage:
    python3 build_zone_data.py
Outputs:
    parcel_data.json       — per-parcel JAD2001 centroid + pixel on santa_cruz
    zone_polygons_stub.geojson — empty zone polygon stubs ready for digitizing
"""

import json
import os
from pyproj import Transformer

GEOREF_DIR = os.path.dirname(os.path.abspath(__file__))
TRANSFORMS_JSON = os.path.join(GEOREF_DIR, "transforms.json")
OUT_PARCEL = os.path.join(GEOREF_DIR, "parcel_data.json")
OUT_ZONES = os.path.join(GEOREF_DIR, "zone_polygons_stub.geojson")

# WGS84 -> JAD2001 (EPSG:4326 -> EPSG:3448)
wgs84_to_jad = Transformer.from_crs("EPSG:4326", "EPSG:3448", always_xy=True)

# Parcels from mapt.html (id, lv, coords in [lat, lon] order)
PARCELS = [
    {
        "id": "p1", "lv": "14204012097", "lot": "112", "scheme": "112 Bybrook",
        "coords_wgs84": [[18.062348,-77.675672],[18.062257,-77.675953],[18.062386,-77.676008],[18.062466,-77.675728],[18.062348,-77.675672]]
    },
    {
        "id": "p2", "lv": "14204014035", "lot": "55", "scheme": "55 Bybrook",
        "coords_wgs84": [[18.058169,-77.672584],[18.058004,-77.672603],[18.058025,-77.672839],[18.058076,-77.672833],[18.058334,-77.672565],[18.058169,-77.672584]]
    },
    {
        "id": "p3", "lv": "14204012036", "lot": "", "scheme": "Bybrook large parcel",
        "coords_wgs84": [[18.067732,-77.676334],[18.066171,-77.675959],[18.066210,-77.676630],[18.066709,-77.677230],[18.067029,-77.677614],[18.067231,-77.677291],[18.067361,-77.677125],[18.067655,-77.676824],[18.067735,-77.676697],[18.067769,-77.676544],[18.067757,-77.676430],[18.067732,-77.676334]]
    },
    {
        "id": "p4", "lv": "14204014013", "lot": "32", "scheme": "32 Bybrook",
        "coords_wgs84": [[18.059148,-77.673492],[18.059005,-77.673508],[18.059035,-77.673866],[18.059073,-77.673862],[18.059173,-77.673851],[18.059148,-77.673492]]
    },
    {
        "id": "p5", "lv": "14204014031", "lot": "51", "scheme": "51 Bybrook",
        "coords_wgs84": [[18.057991,-77.673049],[18.057714,-77.673082],[18.057728,-77.673223],[18.058007,-77.673195],[18.057991,-77.673049]]
    },
    {
        "id": "p6", "lv": "14204012085", "lot": "100", "scheme": "100 Bybrook",
        "coords_wgs84": [[18.061880,-77.675864],[18.061766,-77.675859],[18.061657,-77.675926],[18.061778,-77.676175],[18.061815,-77.676151],[18.061885,-77.676154],[18.061880,-77.675864]]
    },
    {
        "id": "p7", "lv": "14204012073", "lot": "88", "scheme": "88 Bybrook",
        "coords_wgs84": [[18.062617,-77.676562],[18.062520,-77.676863],[18.062674,-77.676935],[18.062739,-77.676618],[18.062617,-77.676562]]
    },
]


def centroid_wgs84(coords):
    """Simple average centroid of polygon vertices (excluding repeated closing point)."""
    pts = coords[:-1] if coords[0] == coords[-1] else coords
    lat = sum(p[0] for p in pts) / len(pts)
    lon = sum(p[1] for p in pts) / len(pts)
    return lat, lon


def pixel_from_transform(transform, e, n):
    px = (e - transform["easting_offset"]) / transform["easting_per_px"]
    py = (n - transform["northing_offset"]) / transform["northing_per_py"]
    return round(px, 1), round(py, 1)


def in_extent(transform, e, n):
    W, H = transform["image_size"]
    px, py = pixel_from_transform(transform, e, n)
    return 0 <= px <= W and 0 <= py <= H


def main():
    with open(TRANSFORMS_JSON) as f:
        transforms = json.load(f)
    sc = transforms["santa_cruz"]

    results = []
    print(f"{'ID':<4} {'LV':<15} {'E (JAD2001)':<14} {'N (JAD2001)':<14} {'px':<8} {'py':<8} IN_EXTENT")
    print("-" * 80)
    for p in PARCELS:
        lat, lon = centroid_wgs84(p["coords_wgs84"])
        e, n = wgs84_to_jad.transform(lon, lat)
        px, py = pixel_from_transform(sc, e, n)
        ok = in_extent(sc, e, n)
        print(f"{p['id']:<4} {p['lv']:<15} {e:<14.1f} {n:<14.1f} {px:<8.1f} {py:<8.1f} {'OK' if ok else 'OUT-OF-EXTENT'}")
        results.append({
            "id": p["id"],
            "lv": p["lv"],
            "lot": p["lot"],
            "scheme": p["scheme"],
            "centroid_jad2001": {"easting": round(e, 2), "northing": round(n, 2)},
            "centroid_wgs84": {"lat": round(lat, 6), "lon": round(lon, 6)},
            "santa_cruz_pixel": {"px": px, "py": py},
            "in_santa_cruz_extent": ok,
        })

    with open(OUT_PARCEL, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nSaved {OUT_PARCEL}")

    # Zone polygon stubs — empty coordinates, ready for digitizing
    # Sources: 2018 PDO Inset maps + 2024 Confirmation Notification
    zone_stubs = {
        "type": "FeatureCollection",
        "crs": {"type": "name", "properties": {"name": "EPSG:3448"}},
        "notes": (
            "JAD2001 (EPSG:3448) coordinates. All coordinate arrays are empty stubs. "
            "Digitize from the rasterized PDO inset images using transforms.json: "
            "click polygon vertices on the image, convert pixel->JAD2001 via pixel_to_jad2001()."
        ),
        "features": [
            # --- Santa Cruz LPA (Inset 2) ---
            _zone("SC1", "Santa Cruz", "Residential", "SC H1", "santa_cruz",
                  "Amendment zone SC1 — residential, north of Malvern–Santa Cruz Rd"),
            _zone("SC2", "Santa Cruz", "Residential (rezoned 2024)", "SC H2", "santa_cruz",
                  "Large parcel rezoned from Agricultural to Residential in 2024 Confirmation Notification"),
            _zone("SC3", "Santa Cruz", "Commercial", "SC H3", "santa_cruz",
                  "Town-centre commercial strip"),
            _zone("SC4", "Santa Cruz", "Residential", "SC H4", "santa_cruz",
                  "Residential zone east of town centre"),
            _zone("SC5", "Santa Cruz", "Open Space", "SC H5", "santa_cruz",
                  "Open space / recreation buffer"),
            # --- Black River LPA (Inset 1) ---
            _zone("BR1", "Black River", "Residential", "BR H1", "black_river",
                  "Residential zone, northern Black River"),
            _zone("BR2", "Black River", "Commercial / Mixed", "BR H2", "black_river",
                  "Urban-core commercial zone — see also Inset 1.1"),
            _zone("BR3", "Black River", "Industrial / Port", "BR H3", "black_river",
                  "Port and light-industrial zone, Black River waterfront"),
            # --- Junction / Bull Savanna LPA (Inset 3) ---
            _zone("JBS1", "Junction / Bull Savanna", "Residential", "JBS H1", "junction_bull_savanna",
                  "Residential zone, Junction"),
            _zone("JBS2", "Junction / Bull Savanna", "Commercial", "JBS H2", "junction_bull_savanna",
                  "Commercial strip, Junction main road"),
            _zone("JBS3", "Junction / Bull Savanna", "Residential", "JBS H3", "junction_bull_savanna",
                  "Residential zone, Bull Savanna"),
            _zone("JBS4", "Junction / Bull Savanna", "Agricultural", "JBS H4", "junction_bull_savanna",
                  "Agricultural buffer, outskirts"),
            # --- Treasure Beach LPA (Inset 4) ---
            _zone("TB1", "Treasure Beach", "Tourist / Resort", "TB H1", "treasure_beach",
                  "Coastal tourist zone, Treasure Beach"),
            _zone("TB2", "Treasure Beach", "Residential", "TB H2", "treasure_beach",
                  "Residential zone behind coast"),
            _zone("TB3", "Treasure Beach", "Open Space / Beach", "TB H3", "treasure_beach",
                  "Beach and open-space buffer"),
            _zone("TB4", "Treasure Beach", "Agricultural", "TB H4", "treasure_beach",
                  "Agricultural hinterland"),
            _zone("TB5", "Treasure Beach", "Residential", "TB H5", "treasure_beach",
                  "Residential, inland Treasure Beach"),
            _zone("TB6", "Treasure Beach", "Tourist / Resort", "TB H6", "treasure_beach",
                  "Secondary tourist zone"),
            _zone("TB7", "Treasure Beach", "Commercial", "TB H7", "treasure_beach",
                  "Small commercial node"),
            _zone("TB8", "Treasure Beach", "Conservation", "TB H8", "treasure_beach",
                  "Coastal conservation zone"),
            # --- Southfield LPA (Inset 6) ---
            _zone("S1", "Southfield", "Residential", "S H1", "southfield",
                  "Southfield residential zone"),
            # --- Maggotty / Elderslie (legend-only changes, no separate polygon) ---
        ]
    }

    with open(OUT_ZONES, "w") as f:
        json.dump(zone_stubs, f, indent=2)
    print(f"Saved zone polygon stubs to {OUT_ZONES}")
    print("\nNext steps:")
    print("  1. Digitize each zone by clicking polygon vertices on the raster insets")
    print("     and converting pixel coords using pixel_to_jad2001() from fit_transform.py.")
    print("  2. Fill in the 'coordinates' arrays in zone_polygons_stub.geojson.")
    print("  3. Run parcel_zone_lookup.py to test point-in-polygon for the 7 pilot parcels.")


def _zone(zone_id, lpa, zone_type, do_ref, map_key, description):
    return {
        "type": "Feature",
        "properties": {
            "zone_id": zone_id,
            "lpa": lpa,
            "zone_type": zone_type,
            "do_ref": do_ref,
            "map_key": map_key,
            "description": description,
            "digitized": False,
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[]]  # empty — fill by digitizing
        }
    }


if __name__ == "__main__":
    main()
