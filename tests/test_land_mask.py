"""Land mask of the globe, scripts/land-mask.py, on small synthetic polygons."""
from __future__ import annotations

import importlib.util
import struct
import unittest
import zlib
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "land-mask.py"


def load():
    spec = importlib.util.spec_from_file_location("land_mask", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def square(west: float, south: float, east: float, north: float) -> list[tuple[float, float]]:
    return [(west, south), (east, south), (east, north), (west, north), (west, south)]


class LandMaskTest(unittest.TestCase):
    tool = load()
    width = 36  # 10 degrees per pixel, 18 rows

    def pixel(self, pixels: bytearray, lon: float, lat: float) -> int:
        x = int((lon + 180) * self.width / 360)
        y = int((90 - lat) * (self.width // 2) / 180)
        return pixels[y * self.width + x]

    def test_square_is_filled_and_the_rest_is_empty(self) -> None:
        pixels = self.tool.rasterize([[square(0, 0, 40, 40)]], self.width)
        self.assertEqual(self.pixel(pixels, 15, 15), 255)
        self.assertEqual(self.pixel(pixels, 35, 35), 255)
        self.assertEqual(self.pixel(pixels, -15, 15), 0)
        self.assertEqual(self.pixel(pixels, 15, -15), 0)
        self.assertEqual(self.pixel(pixels, 45, 15), 0)
        self.assertEqual(sum(1 for value in pixels if value), 16)  # 4 by 4 pixels

    def test_hole_stays_empty(self) -> None:
        pixels = self.tool.rasterize([[square(-60, -60, 60, 60), square(-20, -20, 20, 20)]], self.width)
        self.assertEqual(self.pixel(pixels, -45, 45), 255)
        self.assertEqual(self.pixel(pixels, 5, 5), 0)
        self.assertEqual(self.pixel(pixels, -5, -5), 0)

    def test_polygon_reaching_the_pole_and_the_antimeridian(self) -> None:
        # Like Antarctica in Natural Earth: closed along -180, 180 and the pole.
        pixels = self.tool.rasterize([[square(-180, -90, 180, -70)]], self.width)
        self.assertEqual(self.pixel(pixels, -175, -85), 255)
        self.assertEqual(self.pixel(pixels, 175, -75), 255)
        self.assertEqual(self.pixel(pixels, 0, -65), 0)

    def test_geojson_polygons_and_multipolygons(self) -> None:
        geojson = {"features": [
            {"geometry": {"type": "Polygon", "coordinates": [square(0, 0, 10, 10)]}},
            {"geometry": {"type": "MultiPolygon", "coordinates": [[square(20, 0, 30, 10)], [square(40, 0, 50, 10)]]}},
            {"geometry": {"type": "Point", "coordinates": [0, 0]}},
        ]}
        self.assertEqual(len(self.tool.polygons(geojson)), 3)

    def test_png_is_valid_greyscale(self) -> None:
        pixels = self.tool.rasterize([[square(0, 0, 40, 40)]], self.width)
        data = self.tool.png(pixels, self.width, self.width // 2)
        self.assertEqual(data[:8], b"\x89PNG\r\n\x1a\n")
        width, height, depth, colour = struct.unpack(">IIBB", data[16:26])
        self.assertEqual((width, height, depth, colour), (36, 18, 8, 0))
        start = data.index(b"IDAT") + 4
        length = struct.unpack(">I", data[start - 8 : start - 4])[0]
        raw = zlib.decompress(data[start : start + length])
        self.assertEqual(len(raw), 18 * (36 + 1))
        rows = [raw[y * 37 + 1 : (y + 1) * 37] for y in range(18)]
        self.assertEqual(bytes(pixels), b"".join(rows))


if __name__ == "__main__":
    unittest.main()
