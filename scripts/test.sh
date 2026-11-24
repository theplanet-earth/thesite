#!/usr/bin/env bash
# Unit tests of the repository. tests/ holds the tests of the harness scripts (version
# rules, confidentiality guard), Python unittest, standard library only.
. "$(dirname "$0")/lib.sh"

log "tests: tests/ (Python unittest)"
"$PY" -m unittest discover -s tests

# The tests of the site: the pure part of the globe (src/globe/geometry.js), with the test
# runner of Node, no dependency.
need node "Node 22 or later is needed for the tests of the globe (CONTRIBUTING.md, Getting started)."
log "tests: tests/*.test.mjs (node --test)"
node --test "$ROOT/tests/"*.test.mjs
