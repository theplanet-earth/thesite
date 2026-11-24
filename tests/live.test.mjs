// The live edits and the Worker of production, src/globe/live.js and worker/, against a
// fake replication and a fake cache (node --test): no network.
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { gzipSync } from 'node:zlib';

import { ENDPOINT, readReplication, readWorker, liveEdits } from '../src/globe/live.js';
import { REFRESH_SECONDS, editsResponse } from '../worker/edits.js';
import worker from '../worker/index.js';
import { REPLICATION, TARGET_EDITS, pathOf } from '../src/globe/replication.js';

// A replication whose latest file is `latest`; each file holds `perFile` closed changesets.
function replication(latest, perFile = 40) {
  const asked = [];
  const file = (n) => {
    const changesets = Array.from({ length: perFile }, (_, i) => {
      const closed = new Date(Date.UTC(2026, 10, 24, 0, 0, 0) + n * 60000 + i * 1000).toISOString().replace('.000Z', 'Z');
      const lat = ((n * 7 + i) % 160) - 80;
      return `<changeset id="${n * 1000 + i}" created_at="${closed}" closed_at="${closed}" open="false" num_changes="${i + 1}" user="x" uid="1" min_lat="${lat}" max_lat="${lat + 0.01}" min_lon="${i}" max_lon="${i + 0.01}" comments_count="0"/>`;
    });
    return gzipSync(`<?xml version="1.0"?><osm version="0.6">${changesets.join('')}</osm>`);
  };
  const fetchImpl = async (url, options = {}) => {
    asked.push({ url, headers: options.headers });
    if (url === `${REPLICATION}state.yaml`) return new Response(`---\nlast_run: 2026-11-24 22:00:00.0 +00:00\nsequence: ${latest}\n`);
    const n = Number(url.replace(REPLICATION, '').replace('.osm.gz', '').replaceAll('/', ''));
    if (url.startsWith(REPLICATION) && n <= latest && url === REPLICATION + pathOf(n)) return new Response(file(n));
    return new Response('not found', { status: 404, headers: { 'content-type': 'text/html' } });
  };
  return { fetchImpl, asked };
}

test('readReplication reads backwards from the latest file until enough edits', async () => {
  const { fetchImpl, asked } = replication(1000);
  const read = await readReplication(fetchImpl);
  assert.equal(read.changed, true);
  assert.equal(read.sequence, 1000);
  assert.equal(read.edits.length, TARGET_EDITS);
  assert.equal(read.asOf.toISOString(), '2026-11-24T22:00:00.000Z');
  assert.equal(asked.length, 1 + 3); // the state, then 3 files of 40 edits
  assert.ok(read.edits.every((e, i, all) => i === 0 || all[i - 1].closed <= e.closed));
});

test('readReplication reads only the new files, and nothing when there is none', async () => {
  const { fetchImpl, asked } = replication(1002);
  const first = await readReplication(replication(1000).fetchImpl);
  const next = await readReplication(fetchImpl, { edits: first.edits, last: 1000 });
  assert.deepEqual(asked.map((a) => a.url.replace(REPLICATION, '')), ['state.yaml', pathOf(1001), pathOf(1002)]);
  assert.equal(next.edits.length, TARGET_EDITS);
  assert.ok(next.edits.at(-1).closed > first.edits.at(-1).closed);
  const same = await readReplication(replication(1002).fetchImpl, { edits: next.edits, last: 1002 });
  assert.equal(same.changed, false);
  assert.equal(same.edits, next.edits);
});

test('readWorker reads the JSON of the Worker, and says null where there is none', async () => {
  const data = { generated: '2026-11-24T22:00:00.000Z', sequence: 7, edits: [{ lat: 1, lon: 2, changes: 3, closed: 'x' }] };
  const json = async () => new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
  assert.deepEqual(await readWorker(json), { edits: data.edits, sequence: 7, asOf: new Date(data.generated) });
  assert.equal(await readWorker(async () => new Response('Not found', { status: 404 })), null);
  // The static file of the sites without a Worker (docs/api/osm-edits.json).
  const stub = await (await import('node:fs/promises')).readFile(new URL('../docs/api/osm-edits.json', import.meta.url), 'utf8');
  assert.equal(await readWorker(async () => new Response(stub, { headers: { 'content-type': 'application/json' } })), null);
  assert.equal(await readWorker(async () => new Response('<html>', { headers: { 'content-type': 'text/html' } })), null);
});

test('liveEdits uses the Worker when the site has one', async () => {
  const updates = [];
  const data = { generated: '2026-11-24T22:00:00.000Z', sequence: 1000, edits: [{ lat: 1, lon: 2, changes: 3, closed: 'x' }] };
  const asked = [];
  const fetchImpl = async (url) => {
    asked.push(url);
    return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json' } });
  };
  const live = liveEdits({ initial: [], sequence: 990, fetchImpl, onUpdate: (...args) => updates.push(args) });
  await live.refresh();
  await live.refresh();
  assert.deepEqual(asked, [ENDPOINT, ENDPOINT]);
  assert.equal(updates[0][2], true);
  assert.equal(updates[1][2], false); // the same copy of the Worker: only the time of the check
  assert.deepEqual(updates[0][0], data.edits);
});

test('liveEdits falls back to the replication where there is no Worker, and stays there', async () => {
  const { fetchImpl: replicate } = replication(1000);
  const asked = [];
  const fetchImpl = async (url, options) => {
    asked.push(url);
    return url === ENDPOINT ? new Response('Not found', { status: 404 }) : replicate(url, options);
  };
  const updates = [];
  const live = liveEdits({ initial: [], sequence: null, fetchImpl, onUpdate: (...args) => updates.push(args) });
  await live.refresh();
  await live.refresh();
  assert.equal(asked.filter((url) => url === ENDPOINT).length, 1);
  assert.equal(updates[0][0].length, TARGET_EDITS);
  assert.equal(updates[1][2], false);
});

test('liveEdits keeps the shown edits when nothing can be read', async () => {
  const updates = [];
  const live = liveEdits({ initial: [{ lat: 0, lon: 0, changes: 1, closed: 'x' }], sequence: 1, fetchImpl: async () => { throw new TypeError('offline'); }, onUpdate: (...args) => updates.push(args) });
  await live.refresh();
  assert.deepEqual(updates, []);
});

// A cache like caches.default: match and put by URL.
function fakeCache() {
  const store = new Map();
  return { store, match: async (request) => store.get(request.url)?.clone(), put: async (request, response) => { store.set(request.url, response); } };
}

test('the Worker reads the replication once per 19 minutes, and serves its copy meanwhile', async () => {
  const cache = fakeCache();
  const { fetchImpl, asked } = replication(1000);
  let clock = Date.UTC(2026, 10, 24, 22, 0, 0);
  const pending = [];
  const options = { fetchImpl, cache, waitUntil: (p) => pending.push(p), now: () => clock };
  const request = new Request(`https://theplanet.observer${ENDPOINT}?anything`);
  const first = await editsResponse(request, options);
  await Promise.all(pending);
  assert.equal(first.status, 200);
  assert.equal(first.headers.get('cache-control'), 'no-cache');
  const body = await first.json();
  assert.equal(body.edits.length, TARGET_EDITS);
  assert.equal(body.attribution, '© OpenStreetMap contributors');
  assert.ok(!JSON.stringify(body).includes('"user"'));
  assert.ok(asked.every((a) => a.headers['User-Agent'].startsWith('thesite-worker/')));
  const reads = asked.length;
  clock += (REFRESH_SECONDS - 1) * 1000;
  await editsResponse(request, options);
  assert.equal(asked.length, reads); // from the cache
  clock += 2000;
  await editsResponse(request, options);
  assert.ok(asked.length > reads); // 19 minutes later: read again
});

test('the Worker serves an older copy, or 503, when the replication cannot be read', async () => {
  const cache = fakeCache();
  const now = () => Date.UTC(2026, 10, 24, 23, 0, 0);
  const request = new Request(`https://theplanet.observer${ENDPOINT}`);
  const failing = async () => { throw new TypeError('offline'); };
  const none = await editsResponse(request, { fetchImpl: failing, cache, now });
  assert.equal(none.status, 503);
  assert.deepEqual((await none.json()).edits, []);
  cache.store.set(request.url, new Response('{"edits":[]}', { headers: { 'X-Read-At': '0', 'Content-Type': 'application/json' } }));
  const older = await editsResponse(request, { fetchImpl: failing, cache, now });
  assert.equal(older.status, 200);
  assert.equal((await editsResponse(new Request(request, { method: 'POST' }), { cache, now })).status, 405);
});

test('the Worker passes everything but the API on to the static assets', async () => {
  const served = [];
  const env = { ASSETS: { fetch: async (request) => { served.push(new URL(request.url).pathname); return new Response('asset'); } } };
  const ctx = { waitUntil: () => {} };
  assert.equal(await (await worker.fetch(new Request('https://theplanet.observer/about/'), env, ctx)).text(), 'asset');
  assert.equal((await worker.fetch(new Request('https://theplanet.observer/api/other'), env, ctx)).status, 404);
  assert.deepEqual(served, ['/about/']);
});
