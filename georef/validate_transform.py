"""
validate_transform.py
----------------------
Final QA step: for each georeferenced map, reproject a known JAD2001
coordinate (e.g. an LV_NUMBER parcel centroid pulled from
ST_ELIZABETH.shp, or one of the Land Valuation Numbers explicitly named
in the 2024 Confirmation Notification boundary text -- 16104002009 and
14204012164 are both anchor points already used in the gazetted Black
River and Santa Cruz boundary descriptions) onto the map image's pixel
space, then crop a small window around that pixel and save it so a human
(or Claude) can visually confirm the point lands on the correct parcel.

This is the step that turns "the math checks out" into "this is actually
correctly aligned to the real world" -- R²=1.0 only proves the tick labels
are internally consistent, not that the whole map is geolocated correctly
(e.g. it would not catch a map that was scanned mirrored, or where the
title block claims one inset but the image is actually a different one).

Usage:
    python3 validate_transform.py transforms.json black_river \
        --shapefile /path/to/ST_ELIZABETH.shp \
        --lv 16104002009 \
        --image /tmp/maps/inset-365.jpg

If you don't have geopandas/the shapefile in this environment, you can
also pass a coordinate directly:
    python3 validate_transform.py transforms.json black_river \
        --easting 660500 --northing 654200 \
        --image /tmp/maps/inset-365.jpg
"""
import json
import argparse
from fit_transform import jad2001_to_pixel
from PIL import Image, ImageDraw


def get_centroid_from_shapefile(shapefile_path, lv_number):
    import geopandas as gpd
    gdf = gpd.read_file(shapefile_path)
    # adjust 'LV_NUMBER' to match actual field name if different
    match = gdf[gdf["LV_NUMBER"].astype(str) == str(lv_number)]
    if match.empty:
        raise ValueError(f"LV_NUMBER {lv_number} not found in shapefile")
    centroid = match.geometry.iloc[0].centroid
    return centroid.x, centroid.y


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("transforms_json")
    ap.add_argument("map_name")
    ap.add_argument("--image", required=True)
    ap.add_argument("--shapefile")
    ap.add_argument("--lv", help="LV_NUMBER to look up in the shapefile")
    ap.add_argument("--easting", type=float)
    ap.add_argument("--northing", type=float)
    ap.add_argument("--crop-radius", type=int, default=400,
                     help="half-width in px of the QA crop window")
    ap.add_argument("--out", default="/tmp/validation_crop.png")
    args = ap.parse_args()

    with open(args.transforms_json) as f:
        transform = json.load(f)[args.map_name]

    if args.shapefile and args.lv:
        easting, northing = get_centroid_from_shapefile(args.shapefile, args.lv)
        label = f"LV {args.lv}"
    elif args.easting is not None and args.northing is not None:
        easting, northing = args.easting, args.northing
        label = f"({easting},{northing})"
    else:
        raise SystemExit("Provide either --shapefile + --lv, or --easting + --northing")

    px, py = jad2001_to_pixel(transform, easting, northing)
    print(f"{label} -> JAD2001 ({easting:.1f}, {northing:.1f}) -> pixel ({px:.1f}, {py:.1f})")

    img = Image.open(args.image)
    W, H = img.size
    if not (0 <= px <= W and 0 <= py <= H):
        print(f"WARNING: pixel ({px:.0f},{py:.0f}) is OUTSIDE image bounds ({W}x{H}) "
              f"-- point likely falls outside this map's extent, or the transform is wrong.")

    r = args.crop_radius
    box = (max(0, int(px - r)), max(0, int(py - r)), min(W, int(px + r)), min(H, int(py + r)))
    crop = img.crop(box).copy()
    draw = ImageDraw.Draw(crop)
    cx, cy = px - box[0], py - box[1]
    cross = 30
    draw.line((cx - cross, cy, cx + cross, cy), fill="red", width=6)
    draw.line((cx, cy - cross, cx, cy + cross), fill="red", width=6)
    crop.save(args.out)
    print(f"Saved QA crop with marker to {args.out} -- view it to confirm alignment.")


if __name__ == "__main__":
    main()
