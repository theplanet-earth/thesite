#!/usr/bin/env bash
# The scripts of the site: esbuild bundles src/globe/main.js, with the parts of three.js it
# uses, into docs/assets/bundle/globe.js, where Jekyll picks it up. The bundle is generated
# (git-ignored, never edited by hand); package-lock.json pins three.js and esbuild, and the
# licence comments of three.js stay at the end of the bundle. Run by scripts/build.sh and by
# scripts/serve.sh, which rebuilds it on every change of src/ (--watch).
#   bash scripts/bundle.sh [--watch]
. "$(dirname "$0")/lib.sh"

ESBUILD="$ROOT/node_modules/.bin/esbuild"
if [[ ! -x "$ESBUILD" ]]; then
  need npm "Node 22 or later is needed to bundle the scripts of the site (CONTRIBUTING.md, Getting started)."
  log "bundle: installing the Node dependencies (npm ci)"
  (cd "$ROOT" && npm ci --no-audit --no-fund)
fi

cd "$ROOT"
# The MIT licence of three.js asks for its notice in every copy: published next to the bundle.
mkdir -p docs/assets/bundle
cp node_modules/three/LICENSE docs/assets/bundle/three.LICENSE.txt
# The options of esbuild, and the touch after each build of the watch: scripts/bundle.mjs.
if [[ "${1:-}" == "--watch" ]]; then
  exec node scripts/bundle.mjs --watch
fi
node scripts/bundle.mjs
log "bundle: docs/assets/bundle/globe.js ($(wc -c < docs/assets/bundle/globe.js) bytes)"
