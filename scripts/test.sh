#!/usr/bin/env bash
# Unit tests of the repository. tests/ holds the tests of the harness scripts (version
# rules, confidentiality guard), Python unittest, standard library only.
. "$(dirname "$0")/lib.sh"

log "tests: tests/ (Python unittest)"
"$PY" -m unittest discover -s tests

# TEMPLATE: run here the tests of this repository (its test runner, with its own command).
