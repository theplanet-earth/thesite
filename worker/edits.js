// /api/osm-edits.json of the Worker of production (worker/index.js): the latest edits of
// OpenStreetMap, read from the replication of changesets at most every 19 minutes per data
// centre (the owner, 2026-11-24) and served from the cache of Cloudflare to every visitor, so
// that the replication is read once, however many look at the globe. In a module of its own:
// the runtime of Workers takes every named export of the main module for an entrypoint.
// https://developers.cloudflare.com/workers/runtime-apis/cache/

import { readReplication } from '../src/globe/live.js';

export const ENDPOINT = '/api/osm-edits.json';
export const REFRESH_SECONDS = 19 * 60;
const USER_AGENT = 'thesite-worker/1 (+https://github.com/theplanet-earth/thesite)';
const ATTRIBUTION = {
  attribution: '© OpenStreetMap contributors',
  copyright: 'https://www.openstreetmap.org/copyright',
  license: 'https://opendatacommons.org/licenses/odbl/1-0/',
  source: 'https://planet.openstreetmap.org/replication/changesets/',
};
const JSON_TYPE = 'application/json; charset=utf-8';

// What the browser gets: never cached by it, since the Worker answers from its own cache.
function forClient(response) {
  const copy = new Response(response.body, response);
  copy.headers.set('Cache-Control', 'no-cache');
  return copy;
}

/**
 * The answer to GET /api/osm-edits.json. `cache` is caches.default on Cloudflare; a copy older
 * than REFRESH_SECONDS is read again, whatever the cache keeps (X-Read-At says when it was read).
 */
export async function editsResponse(request, { fetchImpl = (...args) => fetch(...args), cache = globalThis.caches?.default, waitUntil = () => {}, now = () => Date.now() } = {}) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  }
  const key = new Request(new URL(ENDPOINT, request.url).toString());
  const cached = cache ? await cache.match(key) : undefined;
  if (cached && now() - Number(cached.headers.get('X-Read-At')) < REFRESH_SECONDS * 1000) return forClient(cached);
  try {
    const read = await readReplication(fetchImpl, { headers: { 'User-Agent': USER_AGENT } });
    const body = JSON.stringify({ ...ATTRIBUTION, generated: read.asOf.toISOString(), sequence: read.sequence, edits: read.edits });
    const fresh = new Response(body, {
      headers: { 'Content-Type': JSON_TYPE, 'Cache-Control': `public, max-age=${REFRESH_SECONDS}`, 'X-Read-At': String(now()) },
    });
    if (cache) waitUntil(cache.put(key, fresh.clone()));
    return forClient(fresh);
  } catch (error) {
    if (cached) return forClient(cached); // an older copy is better than none
    const body = JSON.stringify({ ...ATTRIBUTION, edits: [], unavailable: String(error?.message ?? error).slice(0, 200) });
    return new Response(body, { status: 503, headers: { 'Content-Type': JSON_TYPE, 'Cache-Control': 'no-store' } });
  }
}
