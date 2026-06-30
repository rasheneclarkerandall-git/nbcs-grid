"""
batch_run.py
------------
Runs detect_ticks.py + fit_transform.py across all 13 St. Elizabeth PDO
map images, producing one consolidated transforms.json. Flags any map
where tick detection came up short so it can be fixed manually rather
than silently producing a bad transform.

Usage: python3 batch_run.py
"""
import json
import subprocess
import sys

MAPS = {
    "map1_parish_overview": "/tmp/maps/map-363.jpg",
    "map2_density": "/tmp/maps/map-364.jpg",
    "black_river": "/tmp/maps/inset-365.jpg",
    "black_river_urban_core_1_1": "/tmp/maps/inset-366.jpg",
    "santa_cruz": "/tmp/maps/inset-367.jpg",
    "junction_bull_savanna": "/tmp/maps/inset-368.jpg",
    "treasure_beach": "/tmp/maps/inset-369.jpg",
    "balaclava": "/tmp/maps/inset-370.jpg",
    "southfield": "/tmp/maps/inset-371.jpg",
    "malvern": "/tmp/maps/inset-372.jpg",
    "lacovia": "/tmp/maps/inset-373.jpg",
    "maggotty": "/tmp/maps/inset-374.jpg",
    "elderslie": "/tmp/maps/inset-375.jpg",
    "new_market": "/tmp/maps/inset-376.jpg",
    "middle_quarters": "/tmp/maps/inset-377.jpg",
}

from detect_ticks import detect
from fit_transform import fit

all_transforms = {}
report = []

for name, path in MAPS.items():
    try:
        ticks = detect(path)
        n_x, n_y = len(ticks["x_ticks"]), len(ticks["y_ticks"])
        if n_x < 2 or n_y < 2:
            report.append((name, "FAILED", f"only {n_x} x-ticks, {n_y} y-ticks detected"))
            continue
        transform = fit(ticks)
        all_transforms[name] = transform
        status = "OK" if (transform["easting_r2"] > 0.999 and transform["northing_r2"] > 0.999) else "LOW_R2"
        report.append((name, status, f"R2_e={transform['easting_r2']:.5f} R2_n={transform['northing_r2']:.5f} (x={n_x},y={n_y} ticks)"))
    except Exception as ex:
        report.append((name, "ERROR", str(ex)))

with open("transforms.json", "w") as f:
    json.dump(all_transforms, f, indent=2)

print(f"{'MAP':<28} {'STATUS':<8} DETAIL")
print("-" * 90)
for name, status, detail in report:
    print(f"{name:<28} {status:<8} {detail}")

print(f"\nSaved {len(all_transforms)}/{len(MAPS)} transforms to transforms.json")
print("""
KNOWN EXCEPTION — black_river_urban_core_1_1:
  This map (Inset No. 1.1, the Black River urban-core zoom) only prints
  easting tick labels (659000 / 660000) on its top and bottom margins.
  No northing labels appear anywhere on the page (confirmed by checking
  top, bottom, left, and right margins). This is a property of the source
  map, not a detection bug.

  Fallback method (do NOT skip georeferencing this map -- it's the most
  parcel-detailed Black River inset and covers the urban core lots BR2/BR3):
    1. Assume square pixel scale (every other map in this set has
       |easting_per_px| == |northing_per_py| to 3 decimal places, since
       these are unrotated north-up engineering plots at fixed print scale).
       Derive northing_per_py = -easting_per_px using the 2 detected x-ticks.
    2. Anchor the offset using ONE shared ground-truth point rather than a
       second tick: Inset 1.1 is explicitly a zoomed crop of Inset 1 (see
       the "See Map Inset 1.1" callout box drawn on Inset 1 itself, and the
       parcel polygons are continuous between the two maps -- e.g. the
       Black River Court House / Magdala House cluster appears in both).
       Pick one identifiable feature visible in both rasters, get its
       already-georeferenced JAD2001 coordinate from the black_river
       transform (which IS fully validated), then solve for the inset 1.1
       northing_offset using that single point + the assumed scale from
       step 1.
    3. Validate the result the same way as every other map: reproject a
       known LV_NUMBER parcel centroid and visually confirm alignment.
""")
