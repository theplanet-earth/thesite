#!/usr/bin/env bash
# Runs once when the Codespace / devcontainer is created.
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }

step "Git hooks (.githooks/: confidentiality guard)"
# core.hooksPath also makes Git ignore .git/hooks, where Codespaces writes Git LFS
# hooks that abort every push when git-lfs is not installed.
git config core.hooksPath .githooks

if [[ -f package-lock.json ]]; then
  step "Node dependencies"
  npm ci --no-audit --no-fund
fi

if [[ -f requirements.txt ]]; then
  step "Python dependencies (.venv/)"
  bash scripts/setup-python.sh
fi

if [[ -f .mcp.json ]] && grep -q '@playwright/mcp@' .mcp.json; then
  step "Chromium for the Playwright MCP server (.mcp.json)"
  # The MCP server pins its own Playwright, which may expect its own browser revision.
  mcp_version="$(node -p "require('./.mcp.json').mcpServers.playwright.args.find(a => a.startsWith('@playwright/mcp@')).split('@')[2]")"
  mcp_playwright="$(npm view "@playwright/mcp@${mcp_version}" dependencies.playwright 2> /dev/null || true)"
  if [[ -n "$mcp_playwright" ]]; then
    npx -y "playwright@${mcp_playwright}" install --with-deps chromium \
      || warn "MCP browser not installed; the MCP tool browser_install can do it later"
  else
    warn "version of Playwright used by @playwright/mcp@${mcp_version} not found; the MCP tool browser_install can install the browser later"
  fi
fi

if [[ -f docs/Gemfile ]]; then
  step "Ruby gems of the site (docs/Gemfile.lock)"
  BUNDLE_GEMFILE=docs/Gemfile bundle install || warn "gems not installed; npm run build installs them later"
fi

step "Claude Code skills of the user (scripts/install-skills.sh)"
bash scripts/install-skills.sh || warn "skills not installed; run bash scripts/install-skills.sh later"

step "First build"
npm run build || warn "the first build failed, see above"

cat << 'EOF'

Ready. Useful commands (also in Terminal > Run Task):
  npm run serve                       preview of the site at http://localhost:4000
  npm run build                       every output in build/
  npm run check                       tests, confidentiality, template markers, checks of the repository
  npm run check:template -- --list    the TEMPLATE markers still to resolve
Read README.md, CONTRIBUTING.md and CLAUDE.md.
EOF
