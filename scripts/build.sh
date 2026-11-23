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

# TEMPLATE: build the outputs of this repository here, and put the files to release in
# build/release/ (and the site to publish in build/pages/).
log "build: nothing to build (the template has no outputs)"
