#!/usr/bin/env bash
# Create .venv/ and install requirements.txt; reinstall only when requirements.txt changes.
# Nothing to do in a repository without requirements.txt.
. "$(dirname "$0")/lib.sh"

[[ -f requirements.txt ]] || { log "python: no requirements.txt, nothing to install"; exit 0; }
python3 -m venv --help > /dev/null 2>&1 || die "python3 venv not available: install python3-venv"
# --clear also rebuilds a stale .venv/ left by another image (dangling interpreter link).
[[ -x .venv/bin/python ]] || { log "python: creating .venv/"; python3 -m venv --clear .venv; }

stamp=".venv/.requirements.sha256"
wanted="$(sha256sum requirements.txt | cut -d' ' -f1)"
if [[ "$(cat "$stamp" 2> /dev/null || true)" != "$wanted" ]]; then
  log "python: installing requirements.txt"
  .venv/bin/python -m pip install --quiet --upgrade pip
  .venv/bin/python -m pip install --quiet -r requirements.txt
  echo "$wanted" > "$stamp"
else
  log "python: .venv/ up to date"
fi
