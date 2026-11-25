#!/usr/bin/env python3
"""The latest edits to OpenStreetMap, for the orange spikes and arcs of the globe (issue #1).

    python3 scripts/osm-activity.py [--minutes 20] [--out docs/_data/activity.json]
    (run by scripts/build.sh and scripts/serve.sh before Jekyll)

The globe of GitHub draws the pull requests being opened and merged around the world
(https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/); this
globe draws the edits being made to OpenStreetMap. Source: the minutely replication of
changesets (https://planet.openstreetmap.org/replication/changesets/), static files meant for
those who read the data; the editing API is "not for read-only purposes"
(https://operations.osmfoundation.org/policies/api/). A build reads the state and the files of
the last minutes, about 5 KB a minute.

The window is that of the globe (src/globe/replication.js): the edits closed in the 20 minutes
before the replication last ran (the owner, 2026-11-25), read from the files of those minutes
and two more, since a changeset appears in the file of a minute or two after it closes. Their
number follows how busy the map is; at most MAX_EDITS, for a burst such as a large import.

Kept of each closed changeset: the centre of its bounding box, rounded to 0.01 degree (about
1 km), its number of changes and when it closed. Not kept: users, comments, tags. A changeset
whose box spans more than 1 degree is left out: its centre says nothing of where the edit is.
Data (c) OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright).
The output is generated at every build and git-ignored; without network the build goes on with
no edits (the file then says why). Standard library only.
"""
from __future__ import annotations

import argparse
import datetime as dt
import gzip
import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Callable

ROOT = Path(__file__).resolve().parent.parent
BASE = "https://planet.openstreetmap.org/replication/changesets/"
OUT = ROOT / "docs" / "_data" / "activity.json"
USER_AGENT = "thesite-osm-activity/1 (+https://github.com/theplanet-earth/thesite)"
MAX_SPAN = 1.0  # degrees of latitude or longitude
WINDOW_MINUTES = 20  # as WINDOW_MINUTES of src/globe/replication.js
MAX_EDITS = 3000  # as MAX_EDITS of src/globe/replication.js
ATTRIBUTION = {
    "attribution": "© OpenStreetMap contributors",
    "copyright": "https://www.openstreetmap.org/copyright",
    "license": "https://opendatacommons.org/licenses/odbl/1-0/",
    "source": BASE,
}

Fetch = Callable[[str], bytes]


def fetch(url: str) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=30) as response:  # follows the redirect to the mirror
        return response.read()


def sequence(state: str) -> int:
    """The sequence number of the latest minutely file, from state.yaml."""
    match = re.search(r"^sequence:\s*(\d+)\s*$", state, re.MULTILINE)
    if not match:
        raise ValueError("no sequence in state.yaml")
    return int(match.group(1))


def last_run(state: str) -> dt.datetime | None:
    """When the replication last ran, from state.yaml ("2026-11-24 19:28:00.847874000 +00:00")."""
    match = re.search(r"^last_run:\s*(\d{4}-\d\d-\d\d) (\d\d:\d\d:\d\d)(?:\.\d+)?\s*\+00:00\s*$", state, re.MULTILINE)
    return dt.datetime.fromisoformat(f"{match.group(1)}T{match.group(2)}+00:00") if match else None


def path_for(number: int) -> str:
    """007/280/737 for 7280737, as the replication lays out its files."""
    digits = f"{number:09d}"
    return f"{digits[0:3]}/{digits[3:6]}/{digits[6:9]}.osm.gz"


def parse(data: bytes) -> list[dict]:
    """The closed changesets of a (gzipped) replication file, as kept by this script."""
    root = ET.fromstring(gzip.decompress(data) if data[:2] == b"\x1f\x8b" else data)
    edits = []
    for changeset in root.iter("changeset"):
        a = changeset.attrib
        if a.get("open") != "false" or not all(k in a for k in ("min_lat", "max_lat", "min_lon", "max_lon", "closed_at")):
            continue
        south, north = float(a["min_lat"]), float(a["max_lat"])
        west, east = float(a["min_lon"]), float(a["max_lon"])
        if north - south > MAX_SPAN or east - west > MAX_SPAN:
            continue
        edits.append({
            "id": int(a["id"]),
            "lat": round((south + north) / 2, 2),
            "lon": round((west + east) / 2, 2),
            "changes": int(a.get("num_changes", "0")),
            "closed": a["closed_at"],
        })
    return edits


def collect(get: Fetch, minutes: int = WINDOW_MINUTES) -> dict:
    """The closed changesets of the `minutes` before the last run of the replication, oldest
    first, read from the files of those minutes and two more."""
    state = get(BASE + "state.yaml").decode("utf-8")
    latest = sequence(state)
    as_of = last_run(state) or dt.datetime.now(dt.timezone.utc)
    since = as_of - dt.timedelta(minutes=minutes)
    seen: dict[int, dict] = {}
    for number in range(latest - (minutes + 2) + 1, latest + 1):
        for edit in parse(get(BASE + path_for(number))):
            seen[edit["id"]] = edit  # a changeset found twice keeps its latest state
    edits = [e for e in seen.values() if dt.datetime.fromisoformat(e["closed"].replace("Z", "+00:00")) >= since]
    edits = sorted(edits, key=lambda e: (e["closed"], e["id"]))[-MAX_EDITS:]
    for edit in edits:
        del edit["id"]  # only needed to deduplicate
    return {
        "generated": as_of.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "sequence": latest,
        "minutes": minutes,
        "edits": edits,
    }


def main(argv: list[str]) -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--minutes", type=int, default=WINDOW_MINUTES, help="the window, in minutes before the last run")
    parser.add_argument("--out", type=Path, default=OUT)
    args = parser.parse_args(argv[1:])
    now = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    try:
        data = {**ATTRIBUTION, "generated": now, **collect(fetch, args.minutes)}
        message = f"osm: {len(data['edits'])} edits of the last {args.minutes} minutes (replication {data['sequence']})"
    except Exception as error:  # no network, a mirror down: the site goes on without edits
        data = {**ATTRIBUTION, "generated": now, "edits": [], "unavailable": str(error)[:200]}
        message = f"osm: no edits ({error}); the globe shows none"
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print(message)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
