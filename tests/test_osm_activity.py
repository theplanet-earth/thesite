"""The latest edits to OpenStreetMap, scripts/osm-activity.py, against fake replication files."""
from __future__ import annotations

import gzip
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "osm-activity.py"


def load():
    spec = importlib.util.spec_from_file_location("osm_activity", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def changeset(id_: int, closed: str, box=(45.0, 45.01, 9.0, 9.02), open_="false", changes=7, user="someone") -> str:
    south, north, west, east = box
    return (f'<changeset id="{id_}" created_at="{closed}" closed_at="{closed}" open="{open_}" num_changes="{changes}" '
            f'user="{user}" uid="1" min_lat="{south}" max_lat="{north}" min_lon="{west}" max_lon="{east}" comments_count="0">'
            f'<tag k="comment" v="a comment"/></changeset>')


def replication(*changesets: str) -> bytes:
    return gzip.compress(f'<?xml version="1.0"?><osm version="0.6">{"".join(changesets)}</osm>'.encode())


class OsmActivityTest(unittest.TestCase):
    tool = load()

    def test_sequence_and_paths(self) -> None:
        state = "---\nlast_run: 2026-11-24 19:28:00.847874000 +00:00\nsequence: 7280737\n"
        self.assertEqual(self.tool.sequence(state), 7280737)
        self.assertEqual(self.tool.path_for(7280737), "007/280/737.osm.gz")
        self.assertEqual(self.tool.path_for(5), "000/000/005.osm.gz")
        with self.assertRaises(ValueError):
            self.tool.sequence("---\nlast_run: never\n")

    def test_parse_keeps_closed_local_edits_and_no_personal_data(self) -> None:
        edits = self.tool.parse(replication(
            changeset(1, "2026-11-24T19:26:25Z", box=(47.2076435, 47.216549, -1.5717453, -1.5527541), changes=6),
            changeset(2, "2026-11-24T19:26:30Z", open_="true"),            # still open
            changeset(3, "2026-11-24T19:26:31Z", box=(40.0, 42.5, 9.0, 9.1)),  # a box too large
            '<changeset id="4" created_at="x" open="false" num_changes="1"/>',  # no box
        ))
        self.assertEqual(edits, [{"id": 1, "lat": 47.21, "lon": -1.56, "changes": 6, "closed": "2026-11-24T19:26:25Z"}])
        self.assertNotIn("user", json.dumps(edits))
        self.assertNotIn("comment", json.dumps(edits))

    def test_collect_reads_the_last_minutes_oldest_first(self) -> None:
        files = {
            "state.yaml": b"sequence: 101\n",
            "000/000/100.osm.gz": replication(changeset(10, "2026-11-24T19:20:00Z"), changeset(11, "2026-11-24T19:20:30Z")),
            "000/000/101.osm.gz": replication(changeset(12, "2026-11-24T19:21:00Z"), changeset(11, "2026-11-24T19:20:30Z", changes=9)),
        }
        asked = []

        def get(url: str) -> bytes:
            asked.append(url)
            return files[url.removeprefix(self.tool.BASE)]

        data = self.tool.collect(get, minutes=2, limit=10)
        self.assertEqual(data["sequence"], 101)
        self.assertEqual([e["closed"] for e in data["edits"]], ["2026-11-24T19:20:00Z", "2026-11-24T19:20:30Z", "2026-11-24T19:21:00Z"])
        self.assertEqual(data["edits"][1]["changes"], 9)  # the later file wins
        self.assertTrue(all("id" not in e for e in data["edits"]))
        self.assertEqual(len(asked), 3)
        self.assertEqual(self.tool.collect(get, minutes=2, limit=2)["edits"][0]["closed"], "2026-11-24T19:20:30Z")

    def test_without_network_the_file_says_why(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            out = Path(tmp) / "activity.json"
            original = self.tool.fetch
            self.tool.fetch = lambda url: (_ for _ in ()).throw(OSError("network is unreachable"))
            try:
                self.assertEqual(self.tool.main(["osm-activity.py", "--out", str(out)]), 0)
            finally:
                self.tool.fetch = original
            data = json.loads(out.read_text(encoding="utf-8"))
            self.assertEqual(data["edits"], [])
            self.assertIn("network is unreachable", data["unavailable"])
            self.assertEqual(data["attribution"], "© OpenStreetMap contributors")


if __name__ == "__main__":
    unittest.main()
