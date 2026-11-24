#!/usr/bin/env bash
# The Worker of production (wrangler.jsonc, worker/), with wrangler at the version pinned here
# (CLAUDE.md, Section 10), run through npx so that the dependencies of the site stay small.
#   bash scripts/worker.sh check   build the site, then validate and bundle the Worker (dry run)
#   bash scripts/worker.sh dev     build the site, then serve it with the Worker at
#                                  http://localhost:8787 (workerd, the runtime of Cloudflare)
# Neither needs an account of Cloudflare; the deploy is release.yml's (issue #2).
. "$(dirname "$0")/lib.sh"

WRANGLER_VERSION="4.168.0"
need npx "Node 22 or later is needed for wrangler (CONTRIBUTING.md, Getting started)."
export WRANGLER_SEND_METRICS=false
cd "$ROOT"
bash scripts/build.sh
case "${1:-}" in
  check) exec npx --yes "wrangler@${WRANGLER_VERSION}" deploy --dry-run --outdir "$BUILD/worker" ;;
  dev) exec npx --yes "wrangler@${WRANGLER_VERSION}" dev --ip 127.0.0.1 --port 8787 ;;
  *) die "usage: bash scripts/worker.sh check|dev" ;;
esac
