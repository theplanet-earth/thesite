#!/usr/bin/env bash
# Every check of the repository, in the order CI runs them. Run it before a pull request.
. "$(dirname "$0")/lib.sh"

failed=0
run() {
  log "$1"
  shift
  "$@" || { warn "failed: $*"; failed=1; }
}

run "unit tests"         bash scripts/test.sh
run "confidentiality"    python3 scripts/check-confidential.py --all
# Add --strict once every marker is resolved, so that CI fails if one comes back.
run "template markers"   bash scripts/check-template.sh
# TEMPLATE: the checks of this repository (linters, type checks, smoke tests of the build).

[[ "$failed" -eq 0 ]] || die "some checks failed (see above)"
log "all checks passed"
