#!/usr/bin/env bash
# Claude Code skills installed for the user (~/.claude/skills/), so that nothing of them lands
# in the repository. Run by .devcontainer/post-create.sh; safe to run again. Each skill is
# pinned to a commit: change it deliberately, with the table in CLAUDE.md, Section 10.
# (Skills distributed as plugins are enabled in .claude/settings.json instead.)
. "$(dirname "$0")/lib.sh"

SKILLS_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}/skills"

# install_skill NAME REPOSITORY COMMIT PATH: copy PATH of REPOSITORY at COMMIT to SKILLS_DIR/NAME.
install_skill() {
  local name="$1" repo="$2" commit="$3" path="$4" tmp
  tmp="$(mktemp -d)"
  git -c advice.detachedHead=false clone --quiet --filter=blob:none --no-checkout "$repo" "$tmp/src"
  git -C "$tmp/src" -c advice.detachedHead=false checkout --quiet "$commit"
  [[ -f "$tmp/src/$path/SKILL.md" ]] || { rm -rf "$tmp"; die "skills: $path/SKILL.md not found in $repo at $commit"; }
  mkdir -p "$SKILLS_DIR"
  rm -rf "${SKILLS_DIR:?}/$name"
  cp -R "$tmp/src/$path" "$SKILLS_DIR/$name"
  rm -rf "$tmp"
  log "skills: $name (${commit:0:7}) in $SKILLS_DIR/$name"
}

# Security audit of Cloudflare (issue #4): guidance by default, the full audit only on an
# explicit request. MIT licence.
install_skill security-audit https://github.com/cloudflare/security-audit-skill \
  c1c8a8c1471069fb0e188eeaff69b8e8db6564a8 skills/security-audit
