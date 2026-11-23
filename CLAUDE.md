# CLAUDE.md: working conventions of this repository

Instructions for Claude Code (and any other assistant) working in this repository. Keep this
file current: when a preference emerges from a conversation, record it here, with its date,
rather than relying on it being remembered. Sections are numbered by hand.

This repository follows the harness of **thebox**, the template of every repository of the
GitHub organization **theplanet-earth** (Section 11). The rules shared with people
(commands, branches, commits, versions, checks, confidentiality, writing style) are in
`CONTRIBUTING.md`, imported here so that they are always in context:

@CONTRIBUTING.md

## 1. The repository

**thesite** is the project site of the GitHub organization **theplanet-earth**, published on
GitHub Pages at `https://theplanet.wtf/`, the custom domain of the repository. The
repository is **public**: everything committed here, including branches and pull requests,
is visible to anyone (Section 8).

`master` holds only the harness of thebox so far. The site online comes from a 2024 Jekyll
prototype that lives only on the branches `hyde_theme` and `glob_coverage` (`README.md`,
*Status*). How `master` builds the site, what the site shows and how it links the other
repositories of the organization are open decisions of the owner (Section 12).

**Golden rule: sources, traceability, no silent fixes.**

- A statement about external work, a third-party API or a tool carries a link to its source.
- Inconsistencies between sources (code, documentation, data, issues, what a service actually
  returns) are **never corrected in silence**: report both values, say which source each comes
  from, and flag the point to the owner.
- Generated files (`build/`, caches, files written by a tool) are never edited by hand and
  never committed unless the repository says so: change their source and generate them again.

## 2. Instructions of the owner

Dated, in the owner's words where possible. Add every new standing instruction here.

- 2026-11-23, "prendi tutta la harness che ti puoi prendere da thebox-master.zip
  riadattandola a questa repo": thesite adopts every part of the harness of thebox that
  applies to it (Section 11).
- 2026-11-23, "usa thebox-master.zip poi buttalo e pulisci tutto quello che non ti serve":
  archives and extracted copies used to set up the repository are deleted once used, never
  committed (Section 8).

Rules of the organization, carried over from thebox (keep them unless the owner decides
otherwise):

- "Vai più avanti possibile da solo": Claude proceeds autonomously as far as it can; **the
  owner only merges the pull requests on `master`** (Section 9).
- SemVer releases at every merge on `master`; **Claude increments only minor or patch, a major
  only when the owner explicitly asks for it**, and never adds the `release:major` label on its
  own (`CONTRIBUTING.md`, *Versions and releases*).
- Every session closes, in the chat, with a short recap of what was done and of what is still
  missing.
- Code, tests, documentation, `README.md`, `CONTRIBUTING.md` and this file always aligned
  (Section 7).
- Confidential names and credentials never in the repository (Section 8).
- A devcontainer with everything needed, and the Playwright MCP server for visual checks
  (Section 10).

## 3. Language

- **Everything that lands in the repository is written in English** (`CONTRIBUTING.md`,
  *Writing style*).
  No deliverable of thesite is in another language so far; if the site gets pages in another
  language, list here which files follow it.
- **Reply to the user in the language they used.** Asked in Italian, answer in Italian in the
  chat, and still write English into the files.
- The writing style of `CONTRIBUTING.md` applies to the chat too, **em dash included**: never
  use one.

## 4. Repository map

| Path | Content |
|---|---|
| `README.md` | What the repository is and how to start |
| `CONTRIBUTING.md` | Rules shared by people and assistants (imported above) |
| `CLAUDE.md` | This file: instructions for assistants |
| `package.json` | The command surface: every command is an npm script (`CONTRIBUTING.md`, *Commands*) |
| `scripts/lib.sh` | Helpers shared by the shell scripts: repository root, `build/`, `$PY`, `log`, `warn`, `die`, `need`, `project_version` |
| `scripts/build.sh`, `test.sh`, `check.sh` | Build, unit tests, every check (the entry points of CI) |
| `scripts/check-confidential.py` | Confidentiality guard (pre-commit hook and `npm run check`) |
| `scripts/check-template.sh` | Lists the `TEMPLATE` markers left |
| `scripts/version.py` | Version, next version and release notes from the tags and the commits |
| `scripts/setup-python.sh` | `.venv/` from `requirements.txt`, reinstalled only when it changes |
| `tests/` | `unittest` checks of the harness scripts (standard library only) |
| `.devcontainer/` | `Dockerfile`, `devcontainer.json`, `post-create.sh` (Section 10) |
| `.vscode/` | Recommended extensions, settings, and every command as a task |
| `.mcp.json` | Project MCP servers for Claude Code: Playwright |
| `.githooks/pre-commit` | Confidentiality guard, enabled by `post-create.sh` |
| `.github/workflows/` | `ci.yml` (pull requests to `master`), `release.yml` (merge on `master`) |
| `.github/pull_request_template.md` | Checklist of every pull request |
| `.github/copilot-instructions.md` | Points GitHub Copilot to these conventions |
| `build/` | Every output (git-ignored): `build/release/`, `build/pages/` |

`LICENSE` is the Apache License 2.0 of thesite (thebox itself is MIT: the license is not part
of the harness).

<!-- TEMPLATE: the folders and files of the site (sources, content, assets, configuration),
once the owner decides how master builds it (Section 12). -->

## 5. Checks before reporting a change as done

1. `npm run build` succeeds and `npm run check` passes.
2. **Look at what changed**, do not only build it. For anything with a user interface, use the
   **Playwright MCP server** (`.mcp.json`): start the application or its preview, open it,
   take screenshots at 1280x800 and at 390x844, try the interactions the change touches, and
   check that there is no console error, no broken image or link and no horizontal scroll. MCP
   output goes to `.playwright-mcp/` (git-ignored).
3. When the change touches an output in another format (PDF, Office files, archives, images),
   build it and inspect it; say what was not verified.
4. Report results faithfully: if a check fails or was skipped, say so with its output.

<!-- TEMPLATE: the checks specific to this repository (URLs and ports to open, pages or
screens to look at, outputs to inspect). -->

## 6. How to handle the owner's requests (permanent)

1. **Explain in the chat**, simply, with examples taken from the project.
2. **Make it clear in the repository too**, in the lightest way: a comment where the doubt
   arose, a line in `README.md`, a paragraph of the documentation.
3. **When new data or facts are needed**, look for them in primary or official sources, link
   them, and update **in cascade**: the data (the source of truth), the code that reads them,
   the documentation, then this file and `README.md`. Inconsistencies are reported, never
   resolved in silence.
4. **Close every request** with: build and checks green, screenshots when the appearance
   changed, the alignment rule checked (Section 7), then the commit, the push and the pull
   request, which the owner merges (Section 9), and the recap of what is still missing.

## 7. Alignment rule (mandatory)

Every change that alters what a user or a reader sees or does goes, **in the same commit or
pull request**, with:

1. the tests of the changed behavior;
2. the update of the documentation and of `README.md`;
3. the update of `CONTRIBUTING.md` when the workflow changes, and of this file (structure,
   commands, versions, known issues);
4. the update of the harness (devcontainer, tasks, workflows) when a command or a tool changes;
5. green checks (`npm run build`, `npm run check`).

## 8. Confidentiality: what Claude adds

The rules are in `CONTRIBUTING.md`, *Confidentiality*. In addition:

- Clones of other repositories, downloads and archives stay in the scratchpad or a temporary
  folder, never in this repository.
- Never paste a value read in a clone, a log or an environment (password, token, key, private
  address) into a file, a commit, a pull request or an issue. Name the file that holds it;
  list the value in `confidential-terms.local` so that the checks block it; tell the owner.
- Never print the content of `confidential-terms.local` in the chat or in a log.

## 9. Git: what Claude adds

- **Claude commits, pushes and prepares the pull request; the owner merges it.** When a
  request is done and the checks are green, Claude commits its changes on the working branch,
  pushes it and opens the pull request to `master`, or lets the open one grow when the work
  belongs to it; a separate piece of work goes on a new branch.
- The working branch is **`dev`** unless the owner names another.
- **Never merge into `master`, push to `master`, force-push or rewrite pushed commits.**
  Merging is the owner's decision. Bringing `master` into the working branch (fast-forward or
  merge) is allowed, to keep the pull request clean.
- **Stage only your own changes.** When the working tree holds changes Claude did not make,
  ask before committing them; files the owner staged stay staged, never unstage them
  (`git reset`, `git restore --staged`). Move files with plain `mv`: git detects the rename.
- Never bypass the hooks (`--no-verify`, `git add -f`).
- Attribution: every commit written by Claude ends with the trailer
  `Co-Authored-By: Claude <model name> <noreply@anthropic.com>` (the model in use), and every
  pull request description ends with the line
  `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.

## 10. Environment

- **Devcontainer** (`.devcontainer/`): Ubuntu 24.04 (`mcr.microsoft.com/devcontainers/base:noble`)
  with Python 3 and its `venv`; Node, GitHub CLI and Claude Code as features. More system
  packages go in the `EXTRA_PACKAGES` build argument of `devcontainer.json`; a tool that needs
  more than a package gets an install script in `scripts/`, used by the `Dockerfile` and by
  the workflows, so that the devcontainer and CI install the same version.
- `post-create.sh` enables the git hooks (`core.hooksPath .githooks`), runs `npm ci` and
  `npm run setup:python` when the repository has a `package-lock.json` or a
  `requirements.txt`, installs the Chromium of the Playwright MCP server, and runs a first
  build.
- The devcontainer requests **read access to every repository of the organization**
  (`customizations.codespaces.repositories`), so that an assistant can read the repositories
  this one depends on.
- **Extensions** (`devcontainer.json` and `.vscode/extensions.json`, kept identical): Claude
  Code, Git Graph (branches and release tags), GitHub Actions, Markdown Mermaid, Code Spell
  Checker, Python.
- **MCP** (`.mcp.json`, project server for Claude Code): `@playwright/mcp`, headless isolated
  Chromium, viewport 1280x800, output in `.playwright-mcp/`.
- **Pinned versions** (bump deliberately, and update this table in the same change):

| Tool | Version | Where |
|---|---|---|
| Base image | Ubuntu 24.04 (`devcontainers/base:noble`) | `.devcontainer/Dockerfile` |
| Node | 24 (package.json accepts 22 or later) | `devcontainer.json`, workflows |
| @playwright/mcp | 0.0.84 | `.mcp.json` |
| GitHub Actions | `checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `upload-pages-artifact@v5`, `deploy-pages@v5` (all on Node 24; `release.yml` without dependency cache) | `.github/workflows/` |

<!-- TEMPLATE: the tools and versions of this repository (runtimes, frameworks, CLIs), the
ports the devcontainer forwards and what each serves. -->

## 11. Keeping in step with thebox

The harness (this file's structure, `CONTRIBUTING.md`, `.devcontainer/`, `.vscode/`,
`.githooks/`, `.github/`, `.mcp.json`, the scripts listed in Section 4, `tests/` of the
harness) comes from thebox, which is versioned and released like any other repository.

- What is specific to this repository goes in the spots marked `TEMPLATE` (resolved by
  replacing the marker with the content), so that the rest of each file can follow a new
  version of thebox with a plain diff. `npm run check:template -- --list` shows the markers
  left.
- An improvement that is useful to every repository is made in thebox first, then brought
  here (`README.md` of thebox, *Updating a repository*).
- This repository follows thebox: **`master` at commit `db3b47c`** (the commit recorded in
  the archive `thebox-master.zip`, files dated 2026-11-13), adopted on 2026-11-23. thebox
  was not readable from the Codespace where it was adopted (Section 12), so the release tag
  of that commit is still to be checked; until then, compute the diff of an update from
  `db3b47c` instead of a tag.

## 12. Known issues and TODO

- **Access to the organization from a Codespace**: the token of a Codespace reads the
  repositories its devcontainer requested **when the Codespace was created**, and only if the
  user authorized them then; a rebuild does not renew them. Create a new Codespace, or export
  a fine-grained token with read access as `GH_TOKEN`, which `gh` prefers. The token of a
  Codespace cannot list the packages of the organization on the GHCR (HTTP 403), nor see
  workflow runs older than GitHub's retention.
- **Git LFS hooks**: Codespaces writes Git LFS hooks in `.git/hooks` that abort every push when
  `git-lfs` is not installed; `core.hooksPath .githooks` makes git ignore them.
- **Stale `.venv/`**: a `.venv/` that survives a change of image keeps a dangling interpreter
  link; `scripts/setup-python.sh` recreates it with `--clear`.
- **Playwright MCP browser**: `@playwright/mcp` pins its own Playwright, which may expect a
  Chromium revision other than the one of the project; `post-create.sh` installs the one it
  needs. If it is missing, the MCP tool `browser_install` installs it.

- **The site is not on `master` yet.** Pages is configured with build type *GitHub Actions*
  and the custom domain `theplanet.wtf` (GitHub API, `GET /repos/theplanet-earth/thesite/pages`,
  2026-11-23); the last deployment to the `github-pages` environment came from `hyde_theme` on
  2024-03-27 (`GET .../deployments`). The workflow runs themselves are past GitHub's
  retention.
- **Inconsistency on the prototype branch, reported and not fixed**: on `hyde_theme`,
  `docs/CNAME` says `hyde.getpoole.com` and `docs/_config.yml` keeps the `url` and the
  description of the Hyde demo, while GitHub Pages serves `theplanet.wtf` (which is also what
  `docs/CNAME` of `glob_coverage` says). With a
  GitHub Actions workflow a `CNAME` file is ignored
  ([GitHub Docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)),
  so the domain in the settings wins; the file is still wrong if the prototype is brought over.

Open points for the owner:

- [ ] Decide how `master` builds the site: bring over the Jekyll prototype of `hyde_theme`
  (Hyde theme on Poole, Leaflet map, Ruby 3.1 and Jekyll 4.3 in its workflow) or start again
  with another generator. Then: the toolchain in the devcontainer and in the workflows, the
  build into `build/pages/`, the visual checks (Section 5), and the `TEMPLATE` markers left
  (`npm run check:template -- --list`).
- [ ] Leave the repository variable `PUBLISH_PAGES` unset until `build/pages/` holds the
  site: `release.yml` would otherwise replace the site online at the first merge. The token of
  this Codespace cannot list the variables (HTTP 403), so the owner checks it in *Settings,
  Secrets and variables, Actions*.
- [ ] The Pages API reports `protected_domain_state: unverified` for `theplanet.wtf`: verify
  the domain for the organization, which protects it from takeover
  ([GitHub Docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages)).
- [ ] The labels `release:major`, `release:minor` and `release:patch`, read by `ci.yml` and
  `release.yml`, do not exist in the repository yet; create them when one is needed.
- [ ] Create a new Codespace on `dev` (a rebuild does not grant the access) and authorize read
  access to `theplanet-earth/*`; then find the release of thebox that matches commit `db3b47c`
  and record it in Section 11.
- [ ] Once the site is on `master`, decide whether to delete the branches `hyde_theme` and
  `glob_coverage`.
