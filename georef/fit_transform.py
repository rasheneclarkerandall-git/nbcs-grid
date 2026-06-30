"""
fit_transform.py
-----------------
Takes the x_ticks/y_ticks output from detect_ticks.py and fits a pixel <->
JAD2001 affine transform. Because these are standard north-up engineering
plots (no rotation/skew), x and y scale independently — this reduces to two
simple linear regressions, which is more robust than a general affine fit
when tick counts are uneven between axes.

Saves a small transform record per map that downstream code (e.g. the D2
zoning panel) can use to convert any pixel coordinate on that raster into
real-world JAD2001 (easting, northing), and vice versa.

Usage:
    python3 fit_transform.py ticks_black_river.json --name black_river --out transforms.json
"""
import json
import argparse
import numpy as np


def linear_fit(pixels, values):
    """Fit value = a*pixel + b via least squares; return (a, b, r2)."""
    pixels = np.array(pixels, dtype=float)
    values = np.array(values, dtype=float)
    A = np.vstack([pixels, np.ones_like(pixels)]).T
    (a, b), residuals, rank, sv = np.linalg.lstsq(A, values, rcond=None)
    pred = a * pixels + b
    ss_res = np.sum((values - pred) ** 2)
    ss_tot = np.sum((values - values.mean()) ** 2)
    r2 = 1 - ss_res / ss_tot if ss_tot > 0 else 1.0
    return float(a), float(b), float(r2)


def fit(tick_data):
    x_ticks = tick_data["x_ticks"]
    y_ticks = tick_data["y_ticks"]

    if len(x_ticks) < 2 or len(y_ticks) < 2:
        raise ValueError(
            f"Not enough ticks to fit a transform (got {len(x_ticks)} x, "
            f"{len(y_ticks)} y). Need >=2 per axis, 3+ recommended for QA."
        )

    a_e, b_e, r2_e = linear_fit([t["px"] for t in x_ticks], [t["value"] for t in x_ticks])
    a_n, b_n, r2_n = linear_fit([t["py"] for t in y_ticks], [t["value"] for t in y_ticks])

    return {
        "easting_per_px": a_e,
        "easting_offset": b_e,
        "easting_r2": r2_e,
        "northing_per_py": a_n,
        "northing_offset": b_n,
        "northing_r2": r2_n,
        "n_x_ticks": len(x_ticks),
        "n_y_ticks": len(y_ticks),
        "image_size": tick_data["image_size"],
    }


def pixel_to_jad2001(transform, px, py):
    e = transform["easting_per_px"] * px + transform["easting_offset"]
    n = transform["northing_per_py"] * py + transform["northing_offset"]
    return e, n


def jad2001_to_pixel(transform, easting, northing):
    px = (easting - transform["easting_offset"]) / transform["easting_per_px"]
    py = (northing - transform["northing_offset"]) / transform["northing_per_py"]
    return px, py


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("ticks_json", help="output of detect_ticks.py")
    ap.add_argument("--name", required=True, help="LPA identifier, e.g. black_river")
    ap.add_argument("--out", default="transforms.json")
    args = ap.parse_args()

    with open(args.ticks_json) as f:
        tick_data = json.load(f)

    transform = fit(tick_data)

    try:
        with open(args.out) as f:
            all_transforms = json.load(f)
    except FileNotFoundError:
        all_transforms = {}

    all_transforms[args.name] = transform
    with open(args.out, "w") as f:
        json.dump(all_transforms, f, indent=2)

    print(f"Fit for '{args.name}':")
    print(f"  Easting:  {transform['easting_per_px']:.5f} m/px  (R2={transform['easting_r2']:.6f})")
    print(f"  Northing: {transform['northing_per_py']:.5f} m/px (R2={transform['northing_r2']:.6f})")
    print(f"  Saved to {args.out}")
