#!/usr/bin/env bash
# Build every output of the repository into build/:
#   build/release/   the files to attach to the GitHub release (release.yml), with the
#                    version in their name when it helps (project_version)
#   build/pages/     the site to publish on GitHub Pages, when PUBLISH_PAGES = true
# The release workflow runs it with RELEASE_VERSION set to the release being made; locally
# the version comes from git (scripts/version.py). Never write a version number by hand.
. "$(dirname "$0")/lib.sh"

VERSION="$(project_version)"
DATE="$(project_date)"
log "build: $PROJECT_NAME $VERSION ($DATE)"

# The site: Jekyll sources in docs/ (Gemfile and Gemfile.lock pin Jekyll and its plugins),
# built into build/pages/ for the domain root of both environments, hence the empty baseurl
# (docs/_config.yml says "/", which would make protocol-relative links). Ruby 3.3: the
# devcontainer installs it, CI uses ruby/setup-ruby (CLAUDE.md, Section 10).
need bundle "Ruby 3.3 and Bundler are needed: open the devcontainer, or install them (CONTRIBUTING.md, Getting started)."
export BUNDLE_GEMFILE="$ROOT/docs/Gemfile"
bundle check > /dev/null 2>&1 || bundle install
rm -rf "$BUILD/pages"
log "build: site (Jekyll) into build/pages/"
JEKYLL_ENV="${JEKYLL_ENV:-production}" bundle exec jekyll build \
  --source docs --destination "$BUILD/pages" --baseurl "" --disable-disk-cache
