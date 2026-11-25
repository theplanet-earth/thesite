// The Worker of production (theplanet.observer, issue #2; wrangler.jsonc). Cloudflare serves
// the site from build/pages/ as static assets, which are free and never run this script; the
// script runs only for /api/* (run_worker_first), that is for /api/osm-edits.json
// (worker/edits.js). Only the default export here: the runtime takes every named export of
// this module for an entrypoint.
// https://developers.cloudflare.com/workers/static-assets/binding/

import { ENDPOINT, editsResponse } from './edits.js';

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (pathname === ENDPOINT) return editsResponse(request, { waitUntil: (promise) => ctx.waitUntil(promise) });
    if (pathname.startsWith('/api/')) return new Response('Not found', { status: 404 });
    return env.ASSETS.fetch(request);
  },
};
