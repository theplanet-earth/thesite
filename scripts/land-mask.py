#!/usr/bin/env python3
"""Land mask of the globe: an equirectangular PNG, white where there is land, black elsewhere.

    python3 scripts/land-mask.py [--source FILE_OR_URL] [--width 720] [--out PATH]
    npm run globe:land

The globe of the home page (src/globe/) reads this image in the browser and draws a dot where
it shows land, as "How we built the GitHub globe" describes
(https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/).
The land comes from Natural Earth, 1:50m land polygons, release v5.1.2, public domain
(https://www.naturalearthdata.com/about/terms-of-use/). The PNG is generated once and
committed as data of the site (CLAUDE.md, Section 12): run this script again only to change
the source or the size. Width:height is 2:1; column x is longitude -180 + (x + 0.5) * 360 / width,
row y is latitude 90 - (y + 0.5) * 180 / height. Standard library only.
"""
from __future__ import annotations

import argparse
import json
import math
import struct
import sys
import urllib.request
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_50m_land.geojson"
OUT = ROOT / "docs" / "assets" / "globe" / "land.png"


def polygons(geojson: dict) -> list[list[list[tuple[float, float]]]]:
    """Every polygon of a GeoJSON FeatureCollection, as rings of (lon, lat)."""
    found = []
    for feature in geojson["features"]:
        geometry = feature["geometry"]
        if geometry["type"] == "Polygon":
            parts = [geometry["coordinates"]]
        elif geometry["type"] == "MultiPolygon":
            parts = geometry["coordinates"]
        else:
            continue
        for part in parts:
            found.append([[(float(x), float(y)) for x, y, *_ in ring] for ring in part])
    return found


def rasterize(shapes: list[list[list[tuple[float, float]]]], width: int) -> bytearray:
    """One byte per pixel, 255 inside a polygon (even-odd rule, so holes stay empty)."""
    height = width // 2
    pixels = bytearray(width * height)
    for rings in shapes:
        edges = [(a, b) for ring in rings for a, b in zip(ring, ring[1:] + ring[:1]) if a[1] != b[1]]
        if not edges:
            continue
        top = max(max(a[1], b[1]) for a, b in edges)
        bottom = min(min(a[1], b[1]) for a, b in edges)
        first = max(0, math.floor((90 - top) * height / 180 - 0.5))
        last = min(height - 1, math.ceil((90 - bottom) * height / 180 - 0.5))
        for y in range(first, last + 1):
            lat = 90 - (y + 0.5) * 180 / height
            crossings = sorted(
                a[0] + (lat - a[1]) * (b[0] - a[0]) / (b[1] - a[1])
                for a, b in edges
                if min(a[1], b[1]) <= lat < max(a[1], b[1])
            )
            for west, east in zip(crossings[0::2], crossings[1::2]):
                start = max(0, math.ceil((west + 180) * width / 360 - 0.5))
                end = min(width - 1, math.floor((east + 180) * width / 360 - 0.5))
                row = y * width
                pixels[row + start : row + end + 1] = b"\xff" * max(0, end - start + 1)
    return pixels


def png(pixels: bytes, width: int, height: int) -> bytes:
    """An 8-bit greyscale PNG."""
    def chunk(kind: bytes, data: bytes) -> bytes:
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))

    raw = b"".join(b"\x00" + bytes(pixels[y * width : (y + 1) * width]) for y in range(height))
    header = struct.pack(">IIBBBBB", width, height, 8, 0, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", header) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def load(source: str) -> dict:
    if source.startswith("https://"):
        request = urllib.request.Request(source, headers={"User-Agent": "thesite-land-mask"})
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.load(response)
    return json.loads(Path(source).read_text(encoding="utf-8"))


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--source", default=SOURCE, help="GeoJSON of the land, a file or an https URL")
    parser.add_argument("--width", type=int, default=720, help="width of the PNG; the height is half")
    parser.add_argument("--out", type=Path, default=OUT)
    args = parser.parse_args(argv[1:])
    if args.width < 2 or args.width % 2:
        parser.error("--width must be an even number")
    shapes = polygons(load(args.source))
    pixels = rasterize(shapes, args.width)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_bytes(png(pixels, args.width, args.width // 2))
    land = sum(1 for value in pixels if value) / len(pixels)
    print(f"land mask: {args.out} ({args.width}x{args.width // 2}, {len(shapes)} polygons, land {land:.1%} of the pixels)")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
