"""
detect_ticks.py
----------------
Detects printed JAD2001 grid-tick labels (e.g. "654000", "658000") along the
top/bottom/left/right margins of a rasterized St. Elizabeth PDO map page, and
returns their pixel coordinates paired with their real-world values.

These maps are standard north-up engineering plots: the grid is axis-aligned,
so each tick gives a (pixel, real-world) pair that is independently usable on
the x-axis (for eastings, found along top/bottom) or y-axis (for northings,
found along left/right). You do NOT need pixel rotation/skew correction for
these — see fit_transform.py for how the pairs become an affine transform.

Usage:
    python3 detect_ticks.py /tmp/maps/inset-365.jpg
    python3 detect_ticks.py /tmp/maps/inset-365.jpg --debug   # saves crops for visual QA

Output: JSON to stdout:
{
  "x_ticks": [{"px": 123, "value": 654000}, ...],   # from top margin OCR
  "y_ticks": [{"py": 456, "value": 632000}, ...]     # from left margin OCR
}

NOTE: OCR on small rotated text (especially the vertical y-axis labels) is
unreliable. This script is a *first pass* — always sanity-check output
against the image before trusting it. Falling back to manually reading tick
pixel coords (by eye, via the `view` tool) and hardcoding them into a GCP
table is equally valid and was in fact how the 13 maps in this project were
verified to have grids at all.
"""
import sys
import json
import argparse
import re
import pytesseract
from PIL import Image


def ocr_strip(img, box, psm=11):
    """OCR a cropped strip and return list of (text, left, top, width, height) boxes."""
    crop = img.crop(box)
    data = pytesseract.image_to_data(
        crop, config=f"--psm {psm} -c tessedit_char_whitelist=0123456789",
        output_type=pytesseract.Output.DICT
    )
    results = []
    for i, text in enumerate(data["text"]):
        text = text.strip()
        if re.fullmatch(r"\d{5,7}", text):  # JAD2001 6-digit-ish coords
            # convert crop-local box back to full-image pixel coords
            left = box[0] + data["left"][i]
            top = box[1] + data["top"][i]
            w, h = data["width"][i], data["height"][i]
            results.append((int(text), left, top, w, h))
    return results


def detect(path, debug=False):
    img = Image.open(path)
    W, H = img.size

    # Margin strip heuristics — tuned for the 200 DPI / 7200x4800 renders used
    # in this project. Top/bottom strips capture eastings (x ticks); left
    # strip captures northings (y ticks, often rotated 90deg so OCR is weaker).
    top_strip = (0, 0, W, int(H * 0.05))
    bottom_strip = (0, int(H * 0.95), W, H)
    left_strip = (0, 0, int(W * 0.04), H)

    top_hits = ocr_strip(img, top_strip)
    bottom_hits = ocr_strip(img, bottom_strip)

    x_ticks = []
    for value, left, top, w, h in top_hits + bottom_hits:
        x_ticks.append({"px": left + w / 2, "value": value})

    # Northing labels on the left margin are printed rotated 90 deg (reading
    # bottom-to-top). Rotate the strip so OCR sees horizontal text, then map
    # coordinates back to the original (unrotated) image's y-pixel space.
    y_ticks = []
    left_crop = img.crop(left_strip)
    Lw, Lh = left_crop.size
    rotated = left_crop.rotate(-90, expand=True)  # now text reads horizontally
    data = pytesseract.image_to_data(
        rotated, config="--psm 11 -c tessedit_char_whitelist=0123456789",
        output_type=pytesseract.Output.DICT
    )
    for i, text in enumerate(data["text"]):
        text = text.strip()
        if re.fullmatch(r"\d{5,7}", text):
            value = int(text)
            rx = data["left"][i] + data["width"][i] / 2
            ry = data["top"][i] + data["height"][i] / 2
            # invert the -90 deg rotation: rotated image is (Lh x Lw)
            # original (x,y) in left_crop space:
            orig_x = ry
            orig_y = Lh - rx
            y_ticks.append({"py": orig_y, "value": value})

    # de-duplicate near-identical detections (top+bottom may repeat same value)
    def dedup(ticks, key):
        seen = {}
        for t in ticks:
            v = t["value"]
            if v not in seen:
                seen[v] = t
        return list(seen.values())

    x_ticks = sorted(dedup(x_ticks, "value"), key=lambda t: t["px"])
    y_ticks = sorted(dedup(y_ticks, "value"), key=lambda t: t["py"])

    if debug:
        img.crop(top_strip).save("/tmp/debug_top.png")
        img.crop(bottom_strip).save("/tmp/debug_bottom.png")
        img.crop(left_strip).save("/tmp/debug_left.png")

    return {"x_ticks": x_ticks, "y_ticks": y_ticks, "image_size": [W, H]}


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--debug", action="store_true")
    args = ap.parse_args()
    result = detect(args.image, debug=args.debug)
    print(json.dumps(result, indent=2))
