#!/usr/bin/env bash
# =====================================================================
#  lib.sh: helpers shared by the shell scripts. Source it with
#     . "$(dirname "$0")/lib.sh"
#  Every script runs from the repository root and writes under build/.
# =====================================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BUILD="$ROOT/build"
mkdir -p "$BUILD"

# Base name of the outputs: the `name` of package.json, or the folder of the repository.
PROJECT_NAME="$(node -p "require('./package.json').name" 2> /dev/null || basename "$ROOT")"

# Python: the project virtual environment when present (npm run setup:python), otherwise
# the python3 of the system. The harness scripts need the standard library only.
PY="$ROOT/.venv/bin/python"
[[ -x "$PY" ]] || PY="$(command -v python3)"

log()  { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }
need() { command -v "$1" > /dev/null || die "$1 not found. $2"; }

# Version and date of this build. The release workflow sets RELEASE_VERSION (the release
# being made); locally they come from git (scripts/version.py). Never written by hand.
project_version() { echo "${RELEASE_VERSION:-$(python3 scripts/version.py current)}"; }
project_date()    { echo "${RELEASE_DATE:-$(python3 scripts/version.py date)}"; }
