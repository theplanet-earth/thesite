// The edits of OpenStreetMap, kept current while the visitor looks at the globe: those of the
// window of replication.js (the 20 minutes before the replication last ran). The snapshot
// of the build is shown first, so the globe never waits for the network; then, every 19
// minutes (the owner, 2026-11-24), the browser reads them again:
// - from the Worker of production, at /api/osm-edits.json (worker/index.js), which reads the
//   replication at most every 19 minutes per data centre and serves that copy to every
//   visitor;
// - where there is no Worker (the stage site on GitHub Pages, the preview), from the
//   replication itself, one file at a time.
// Only while the globe is on screen and the tab visible (start and stop come from main.js).
// When nothing can be read, the shown edits stay. The rules of what is kept are those of
// replication.js; readReplication is shared with the Worker.

import { REPLICATION, WINDOW_FILES, inWindow, lastRunOf, mergeEdits, parseChangesets, pathOf, sequenceOf } from './replication.js';

export const EVERY = 19 * 60 * 1000;
export const ENDPOINT = '/api/osm-edits.json';

async function readText(fetchImpl, url, headers) {
  const response = await fetchImpl(url, { cache: 'no-store', headers });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

// The files are gzip as they are (no Content-Encoding), so nothing inflates them on the way.
async function readGzip(fetchImpl, url, headers) {
  const response = await fetchImpl(url, { headers });
  if (!response.ok || !response.body) throw new Error(`${url}: HTTP ${response.status}`);
  return new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).text();
}

/**
 * The edits of the window (replication.js) as the replication holds them now, given those shown
 * and the sequence they were read at (`last`, null when unknown): { edits, sequence, asOf,
 * changed }. Reads only the files not read yet when the shown edits are recent enough, the
 * WINDOW_FILES latest otherwise; then keeps the edits of the window before the last run.
 */
export async function readReplication(fetchImpl, { edits = [], last = null, headers } = {}) {
  const state = await readText(fetchImpl, `${REPLICATION}state.yaml`, headers);
  const latest = sequenceOf(state);
  const asOf = lastRunOf(state) ?? new Date();
  if (last !== null && latest <= last) return { edits, sequence: last, asOf, changed: false };
  const recent = last !== null && latest - last < WINDOW_FILES;
  const first = recent ? last + 1 : latest - WINDOW_FILES + 1;
  let incoming = [];
  for (let n = first; n <= latest; n += 1) incoming = incoming.concat(parseChangesets(await readGzip(fetchImpl, REPLICATION + pathOf(n), headers)));
  return { edits: inWindow(mergeEdits(recent ? edits : [], incoming), asOf), sequence: latest, asOf, changed: true };
}

/**
 * The edits as the Worker of production serves them: { edits, sequence, asOf }, or null when
 * the site has no Worker: there the same address is a static file without edits
 * (docs/api/osm-edits.json), so that asking costs no 404, and any answer but a JSON with
 * edits counts the same.
 */
export async function readWorker(fetchImpl, endpoint = ENDPOINT) {
  const response = await fetchImpl(endpoint, { cache: 'no-store' });
  if (!response.ok || !(response.headers.get('content-type') || '').includes('json')) return null;
  const data = await response.json();
  if (!Array.isArray(data?.edits)) return null;
  return { edits: data.edits, sequence: data.sequence, asOf: new Date(data.generated) };
}

/**
 * Keeps `initial` (the snapshot of the build, read at `sequence`) current; calls
 * onUpdate(edits, asOf, changed) after every reading: `changed` is false when nothing new
 * came, and only the time of the check moves on. Returns start() and stop().
 */
export function liveEdits({ initial, sequence, onUpdate, fetchImpl = (...args) => fetch(...args), every = EVERY, endpoint = ENDPOINT }) {
  let edits = initial;
  let last = Number.isFinite(sequence) ? sequence : null;
  let worker = null; // unknown until the first answer: true, or false where there is none
  let timer = null;
  let busy = false;

  async function refresh() {
    if (busy) return;
    busy = true;
    try {
      let read = null;
      if (worker !== false) {
        try {
          const data = await readWorker(fetchImpl, endpoint);
          if (data) {
            worker = true;
            read = { ...data, changed: data.sequence !== last };
          } else {
            worker = false;
          }
        } catch (error) {
          if (worker) throw error; // the Worker exists but cannot be reached now: try later
          worker = false;
        }
      }
      if (!read) {
        if (typeof DecompressionStream === 'undefined') return;
        read = await readReplication(fetchImpl, { edits, last });
      }
      if (read.changed) {
        edits = read.edits;
        last = read.sequence;
      }
      onUpdate(edits, read.asOf, read.changed);
    } catch {
      // No network, a mirror down, a browser that blocks the request: the shown edits stay.
    } finally {
      busy = false;
    }
  }

  return {
    refresh,
    start() {
      if (timer !== null) return;
      refresh();
      timer = setInterval(refresh, every);
    },
    stop() {
      clearInterval(timer);
      timer = null;
    },
  };
}
