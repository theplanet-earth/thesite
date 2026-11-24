// The edits of OpenStreetMap, kept current while the visitor looks at the globe: once a
// minute, as the replication publishes a file a minute, the browser reads the new files and
// keeps the latest TARGET_EDITS edits. The snapshot of the build is shown first, so the globe
// never waits for the network; when it cannot be refreshed, it stays as it is.
//
// Considerate by construction: one file at a time, only while the globe is on screen and the
// tab visible (start and stop come from main.js), only the files not read yet, and from the
// latest backwards when the snapshot is older than MAX_FILES minutes. The rules of what is
// kept are those of replication.js.

import { MAX_FILES, REPLICATION, TARGET_EDITS, lastRunOf, mergeEdits, parseChangesets, pathOf, sequenceOf } from './replication.js';

const EVERY = 60 * 1000;

async function readText(url) {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

// The files are gzip as they are (no Content-Encoding), so the browser does not inflate them.
async function readGzip(url) {
  const response = await fetch(url);
  if (!response.ok || !response.body) throw new Error(`${url}: HTTP ${response.status}`);
  return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).text();
}

/**
 * Keeps `initial` (the snapshot of the build, read at `sequence`) current; calls
 * onUpdate(edits, asOf, changed) after every refresh: `changed` is false when the replication
 * had no new file, and only the time of the check moves on. Returns start() and stop().
 */
export function liveEdits({ initial, sequence, onUpdate }) {
  let edits = initial;
  let last = Number.isFinite(sequence) ? sequence : null;
  let timer = null;
  let busy = false;

  async function refresh() {
    if (busy || typeof DecompressionStream === 'undefined') return;
    busy = true;
    try {
      const state = await readText(`${REPLICATION}state.yaml`);
      const latest = sequenceOf(state);
      if (last !== null && latest <= last) {
        onUpdate(edits, lastRunOf(state) ?? new Date(), false);
        return;
      }
      if (last !== null && latest - last <= MAX_FILES) {
        let incoming = [];
        for (let n = last + 1; n <= latest; n += 1) incoming = incoming.concat(parseChangesets(await readGzip(REPLICATION + pathOf(n))));
        edits = mergeEdits(edits, incoming);
      } else {
        // From the latest file backwards, until enough edits: fewer minutes when the map is busy.
        let fresh = [];
        for (let n = latest, read = 0; read < MAX_FILES && fresh.length < TARGET_EDITS; n -= 1, read += 1) {
          fresh = mergeEdits(fresh, parseChangesets(await readGzip(REPLICATION + pathOf(n))), Infinity);
        }
        edits = mergeEdits([], fresh);
      }
      last = latest;
      onUpdate(edits, lastRunOf(state) ?? new Date(), true);
    } catch {
      // No network, a mirror down, a browser that blocks the request: the shown edits stay.
    } finally {
      busy = false;
    }
  }

  return {
    start() {
      if (timer !== null) return;
      refresh();
      timer = setInterval(refresh, EVERY);
    },
    stop() {
      clearInterval(timer);
      timer = null;
    },
  };
}
