#!/usr/bin/env bash
# List the TEMPLATE markers left: the spots of the harness that a repository created from
# thebox fills in (README.md, "Starting a repository from thebox"). A marker is the word
# TEMPLATE in capitals followed by a colon, in a comment.
#   npm run check:template              count per file
#   npm run check:template -- --list    every marker, with its line
#   npm run check:template -- --strict  fail when any is left (once the repository has
#                                       resolved them)
. "$(dirname "$0")/lib.sh"

pattern='TEMPLATE[:]'
# Tracked and untracked files, not the ignored ones, and not this script.
search() { git grep --untracked -I "$@" -E "$pattern" -- . ':!scripts/check-template.sh' || true; }
total="$(search -o | wc -l)"

case "${1:-}" in
  --list) search -n ;;
  *) search -c | sed 's/^/    /' ;;
esac
echo "template markers: $total left"
if [[ "${1:-}" == "--strict" && "$total" -gt 0 ]]; then
  die "template markers left: resolve them (npm run check:template -- --list)"
fi
