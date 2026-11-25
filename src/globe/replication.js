// The minutely replication of the changesets of OpenStreetMap, as the globe reads it in the
// browser (src/globe/live.js) after the snapshot of the build (scripts/osm-activity.py, which
// follows the same rules). No DOM and no network here, so that node --test can check it
// (tests/replication.test.mjs).
//
// Source: https://planet.openstreetmap.org/replication/changesets/ (static files, readable from
// a browser: the server and its mirror answer Access-Control-Allow-Origin: *). The editing API
// of OpenStreetMap is "not for read-only purposes" (https://operations.osmfoundation.org/policies/api/).
// Data (c) OpenStreetMap contributors, ODbL 1.0 (https://www.openstreetmap.org/copyright).

export const REPLICATION = 'https://planet.openstreetmap.org/replication/changesets/';
// The window of the globe, the same for the build, the browser and the Worker: the edits closed
// in the WINDOW_MINUTES before the replication last ran (the owner, 2026-11-25: 20 minutes, "per
// adesso"). Their number follows how busy the map is; the caption shows it, not the window.
export const WINDOW_MINUTES = 20;
// The files that hold them: one a minute, and two more, since a changeset appears in the file of
// a minute or two after it closes (seen on 2026-11-24).
export const WINDOW_FILES = WINDOW_MINUTES + 2;
// A bound for a burst, such as a large import: beyond it, the oldest edits are left out.
export const MAX_EDITS = 3000;
// A changeset whose box spans more than this many degrees is left out: its centre says
// nothing of where the edit is.
const MAX_SPAN = 1;

/** The sequence number of the latest minutely file, from state.yaml. */
export function sequenceOf(state) {
  const match = /^sequence:\s*(\d+)\s*$/m.exec(state);
  if (!match) throw new Error('no sequence in state.yaml');
  return Number(match[1]);
}

/** When the replication last ran, from state.yaml ("2026-11-24 19:28:00.847874000 +00:00"). */
export function lastRunOf(state) {
  const match = /^last_run:\s*(\d{4}-\d\d-\d\d) (\d\d:\d\d:\d\d)(?:\.\d+)?\s*\+00:00\s*$/m.exec(state);
  return match ? new Date(`${match[1]}T${match[2]}Z`) : null;
}

/** 007/280/737.osm.gz for 7280737, as the replication lays out its files. */
export function pathOf(sequence) {
  const digits = String(sequence).padStart(9, '0');
  return `${digits.slice(0, 3)}/${digits.slice(3, 6)}/${digits.slice(6, 9)}.osm.gz`;
}

/**
 * The closed changesets of a replication file (its XML, already decompressed), as kept by the
 * globe: the centre of the box rounded to 0.01 degree, the number of changes, the time it
 * closed. Users, comments and tags are never read. The file is the plain XML that the
 * replication writes, one <changeset .../> or <changeset ...> per changeset, so a scan of the
 * opening tags is enough and works without a DOM.
 */
export function parseChangesets(xml) {
  const edits = [];
  for (const [, attributes] of xml.matchAll(/<changeset\s([^>]*?)\/?>/g)) {
    const a = {};
    for (const [, name, value] of attributes.matchAll(/([a-z_]+)="([^"]*)"/g)) a[name] = value;
    if (a.open !== 'false' || !a.closed_at || !['min_lat', 'max_lat', 'min_lon', 'max_lon'].every((k) => k in a)) continue;
    const [south, north, west, east] = [a.min_lat, a.max_lat, a.min_lon, a.max_lon].map(Number);
    if (![south, north, west, east].every(Number.isFinite) || north - south > MAX_SPAN || east - west > MAX_SPAN) continue;
    const round = (value) => Math.round(value * 100) / 100;
    edits.push({ lat: round((south + north) / 2), lon: round((west + east) / 2), changes: Number(a.num_changes) || 0, closed: a.closed_at });
  }
  return edits;
}

/** The edits of `current` and `incoming` together, each once, oldest first, the latest `limit`. */
export function mergeEdits(current, incoming, limit = MAX_EDITS) {
  const byKey = new Map();
  for (const edit of [...current, ...incoming]) byKey.set(`${edit.closed}|${edit.lat}|${edit.lon}|${edit.changes}`, edit);
  const edits = [...byKey.values()].sort((a, b) => (a.closed < b.closed ? -1 : a.closed > b.closed ? 1 : 0));
  return Number.isFinite(limit) ? edits.slice(-limit) : edits;
}

/** The edits closed in the `minutes` before `asOf` (a Date), the window of the globe. */
export function inWindow(edits, asOf, minutes = WINDOW_MINUTES) {
  const from = asOf.getTime() - minutes * 60 * 1000;
  return edits.filter((edit) => Date.parse(edit.closed) >= from);
}
