#!/usr/bin/env bash
# Live preview of the site: Jekyll serves docs/ at http://localhost:4000 and rebuilds on every
# change. The devcontainer forwards port 4000 (opened in the VS Code preview) and port 35729
# (live reload, which reloads the page in VS Code desktop; in a browser, reload by hand).
#   npm run serve
. "$(dirname "$0")/lib.sh"

need bundle "Ruby 3.3 and Bundler are needed: open the devcontainer, or install them (CONTRIBUTING.md, Getting started)."
export BUNDLE_GEMFILE="$ROOT/docs/Gemfile"
bundle check > /dev/null 2>&1 || bundle install
# The scripts of the site (scripts/bundle.sh): built once, then rebuilt by esbuild on every
# change of src/, which Jekyll sees as a change of docs/assets/bundle/.
bash "$ROOT/scripts/bundle.sh"
bash "$ROOT/scripts/bundle.sh" --watch &
watcher=$!
trap 'kill "$watcher" 2> /dev/null || true' EXIT
log "serve: http://localhost:4000 (Ctrl+C to stop)"
bundle exec jekyll serve \
  --source docs --destination "$BUILD/serve" --baseurl "" --disable-disk-cache \
  --host 127.0.0.1 --port 4000 --livereload --livereload-port 35729
