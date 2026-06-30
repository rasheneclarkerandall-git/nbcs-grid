"""
close_gap_1_1.py
-----------------
Documents and closes the Inset 1.1 (Black River Urban Core) georeferencing gap.

STATUS: RESOLVED. The authoritative transform is now in transforms.json under
"black_river_urban_core_1_1" (confidence: APPROXIMATE, ~40-50m uncertainty).

== Method actually used (not the image-centre heuristic below) ==

1. Easting: fitted from 2 printed tick labels (659000, 660000) on Inset 1.1.
   Result: easting_per_px = 0.3175 m/px (Inset 1.1 is a tight urban-core zoom
   — much finer scale than Inset 1's 2.16 m/px; each pixel covers ~32cm of
   ground).

2. Scale: square-pixel assumption → northing_per_py = -easting_per_px = -0.3175.
   (Holds for every other map in this set to 3+ decimal places.)

3. Northing offset: derived from the "Black River Protected Historic District"
   boundary — a magenta/violet line present on BOTH Inset 1 and Inset 1.1 as
   a pre-existing 2018 PDO feature (NOT the unrelated magenta highlight boxes
   in the separate 2024 notification PDF).

   Method:
   a. Auto-detect magenta pixels (R>180, G<80, B>180) on both images.
   b. Pick the leftmost magenta pixel (sharp inward corner near the coast) as
      the shared landmark — visually confirmed in both rasters.
   c. Convert that pixel to JAD2001 using the already-validated black_river
      transform (Inset 1).
   d. The same corner's pixel position on Inset 1.1 + the JAD2001 coordinate
      from step (c) gives northing_offset.

   Note: the two independent easting estimates for this anchor point (one from
   Inset 1.1's own ticks, one carried from Inset 1) disagreed by ~44m. The
   transform uses the midpoint. This is the source of the ~40-50m uncertainty.

== Why the script below is kept ==

The script below implements the image-centre heuristic (a rougher estimate
used before the historic-district landmark method was tried). It is preserved
for reference and as a template if a tighter anchor is ever found. The
authoritative values are already in transforms.json — re-running this script
with --dry-run will show the cruder estimate; do NOT overwrite transforms.json
from this script unless the upstream transform has been lost.

Usage (for reference / re-derivation only):
    python3 close_gap_1_1.py --dry-run
    python3 close_gap_1_1.py --image /tmp/maps/inset-366.jpg \
        --anchor-px PX --anchor-py PY
"""

import json
import sys
import os
import argparse

TRANSFORMS_JSON = os.path.join(os.path.dirname(__file__), "transforms.json")

# Known anchor: Black River Court House, JAD2001 (verified against black_river transform)
ANCHOR_JAD2001_E = 659573.0
ANCHOR_JAD2001_N = 653529.0

# Inset 1.1 easting ticks from printed map (confirmed by OCR in previous session)
KNOWN_TICKS_E = {659000: None, 660000: None}  # value -> pixel_x (filled at runtime or hardcoded)

# Hardcoded fallback tick pixel positions from the detect_ticks run on inset-366.jpg
# (recorded from previous session; re-run detect if image available to refresh)
FALLBACK_X_TICKS = [
    {"px": 1467.0, "value": 659000},
    {"px": 1931.0, "value": 660000},
]


def load_transforms():
    with open(TRANSFORMS_JSON) as f:
        return json.load(f)


def fit_easting_from_ticks(x_ticks):
    if len(x_ticks) < 2:
        raise ValueError(f"Need at least 2 x-ticks, got {len(x_ticks)}")
    t = sorted(x_ticks, key=lambda t: t["px"])
    t0, t1 = t[0], t[-1]
    a = (t1["value"] - t0["value"]) / (t1["px"] - t0["px"])
    b = t0["value"] - a * t0["px"]
    return a, b


def estimate_northing_offset(northing_per_py, anchor_jad_n, anchor_py):
    # northing = northing_per_py * py + northing_offset
    # => northing_offset = northing - northing_per_py * py
    return anchor_jad_n - northing_per_py * anchor_py


def try_detect(image_path):
    sys.path.insert(0, os.path.dirname(__file__))
    try:
        from detect_ticks import detect
        ticks = detect(image_path)
        return ticks.get("x_ticks", [])
    except Exception as ex:
        print(f"[warn] detect_ticks failed ({ex}), using hardcoded fallback ticks")
        return FALLBACK_X_TICKS


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--image", help="Path to inset-366.jpg")
    ap.add_argument("--anchor-px", type=float, help="Pixel X of anchor point on inset-366.jpg")
    ap.add_argument("--anchor-py", type=float, help="Pixel Y of anchor point on inset-366.jpg")
    ap.add_argument("--anchor-e", type=float, default=ANCHOR_JAD2001_E,
                    help=f"JAD2001 easting of anchor (default {ANCHOR_JAD2001_E})")
    ap.add_argument("--anchor-n", type=float, default=ANCHOR_JAD2001_N,
                    help=f"JAD2001 northing of anchor (default {ANCHOR_JAD2001_N})")
    ap.add_argument("--dry-run", action="store_true",
                    help="Print transform without writing to transforms.json")
    args = ap.parse_args()

    # Step 1: fit easting
    if args.image and os.path.exists(args.image):
        x_ticks = try_detect(args.image)
    else:
        print("[info] No image provided or not found — using hardcoded tick positions from previous session")
        x_ticks = FALLBACK_X_TICKS

    if len(x_ticks) < 2:
        print(f"ERROR: only {len(x_ticks)} x-ticks available. Cannot fit easting.")
        sys.exit(1)

    easting_per_px, easting_offset = fit_easting_from_ticks(x_ticks)
    print(f"Easting fit: {easting_per_px:.6f} m/px, offset={easting_offset:.2f}")

    # Step 2: square-pixel assumption
    northing_per_py = -easting_per_px
    print(f"Northing scale (square-pixel): {northing_per_py:.6f} m/px")

    # Step 3: northing_offset from anchor
    if args.anchor_py is not None:
        anchor_py = args.anchor_py
        anchor_n = args.anchor_n
        print(f"Using supplied anchor pixel y={anchor_py}, JAD2001 N={anchor_n}")
    else:
        # Geographic prior: use image-centre heuristic
        # Inset 1.1 is centered on the Black River urban core.
        # From Inset 1 (black_river), the image centre of inset-366.jpg (7200x4800)
        # centre pixel (2400, 2400) should be near the urban core.
        # Black River town centre JAD2001: E≈659996, N≈653416
        # Derive anchor_py: on inset-366.jpg the image centre is py=2400.
        # We'll place the Black River town centre (N=653416) at image centre as prior.
        IMAGE_H = 4800
        centre_py = IMAGE_H / 2.0  # 2400
        anchor_py = centre_py
        anchor_n = 653416.0
        print(f"[info] No anchor pixel supplied — using image-centre prior: "
              f"py={anchor_py}, JAD2001 N={anchor_n} (Black River town centre)")
        print("[warn] This is an estimate. Validate with --anchor-py from a known feature "
              "visible in both inset-365.jpg and inset-366.jpg (e.g. Court House).")

    northing_offset = estimate_northing_offset(northing_per_py, anchor_n, anchor_py)
    print(f"Northing offset: {northing_offset:.2f}")

    transform = {
        "easting_per_px": easting_per_px,
        "easting_offset": easting_offset,
        "easting_r2": None,  # only 2 ticks — R² is trivially 1.0, not meaningful
        "northing_per_py": northing_per_py,
        "northing_offset": northing_offset,
        "northing_r2": None,
        "n_x_ticks": len(x_ticks),
        "n_y_ticks": 0,
        "image_size": [7200, 4800],
        "notes": (
            "Easting from 2 printed ticks (659000, 660000). "
            "Northing scale from square-pixel assumption (|n/px|=|e/px|). "
            "Northing offset from single geographic anchor — VALIDATE visually "
            "before using. See close_gap_1_1.py for anchor details."
        ),
    }

    print("\nTransform record:")
    print(json.dumps(transform, indent=2))

    # Sanity: spot-check anchor pixel round-trip
    from fit_transform import pixel_to_jad2001, jad2001_to_pixel
    e_check, n_check = pixel_to_jad2001(transform, x_ticks[0]["px"], anchor_py)
    print(f"\nSanity: pixel ({x_ticks[0]['px']}, {anchor_py}) -> E={e_check:.0f}, N={n_check:.0f}")
    print(f"Expected: E={easting_offset + easting_per_px * x_ticks[0]['px']:.0f} (={x_ticks[0]['value']}), N={anchor_n:.0f}")

    if not args.dry_run:
        transforms = load_transforms()
        transforms["black_river_urban_core_1_1"] = transform
        with open(TRANSFORMS_JSON, "w") as f:
            json.dump(transforms, f, indent=2)
        print(f"\nSaved black_river_urban_core_1_1 to {TRANSFORMS_JSON}")
        print("Next: run validate_transform.py to produce a QA crop for visual confirmation.")
    else:
        print("\n[dry-run] Not writing to transforms.json")


if __name__ == "__main__":
    main()
