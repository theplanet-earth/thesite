#!/usr/bin/env bash
# Live preview of the site: Jekyll serves docs/ at http://localhost:4000 and rebuilds on every
# change. The devcontainer forwards port 4000 (opened in the VS Code preview) and port 35729
# (live reload, which reloads the page in VS Code desktop; in a browser, reload by hand).
#   npm run serve
. "$(dirname "$0")/lib.sh"

need bundle "Ruby 3.3 and Bundler are needed: open the devcontainer, or install them (CONTRIBUTING.md, Getting started)."
export BUNDLE_GEMFILE="$ROOT/docs/Gemfile"
bundle check > /dev/null 2>&1 || bundle install
log "serve: http://localhost:4000 (Ctrl+C to stop)"
exec bundle exec jekyll serve \
  --source docs --destination "$BUILD/serve" --baseurl "" --disable-disk-cache \
  --host 127.0.0.1 --port 4000 --livereload --livereload-port 35729
