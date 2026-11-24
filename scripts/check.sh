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
# Every marker is resolved (2026-11-24): --strict makes CI fail if one comes back.
run "template markers"   bash scripts/check-template.sh --strict
# The checks of this repository: the built site (scripts/check-site.py), which needs
# build/pages/; CI runs its checks before its build, then this one again after it (ci.yml).
if [[ -d "$BUILD/pages" ]]; then
  run "site (build/pages/)" "$PY" scripts/check-site.py
else
  warn "site: skipped, build/pages/ does not exist (npm run build first)"
fi

[[ "$failed" -eq 0 ]] || die "some checks failed (see above)"
log "all checks passed"
