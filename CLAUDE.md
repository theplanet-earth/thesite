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

**thesite** is the project site of the GitHub organization **theplanet-earth**. The
repository is **public**: everything committed here, including branches and pull requests,
is visible to anyone (Section 8).

The site is a Jekyll site in `docs/`, the 2024 prototype folded in on 2026-11-23 from the
branches `glob_coverage` and `hyde_theme` (opened in this order, then deleted). `npm run build`
builds it into `build/pages/`, `npm run serve` previews it. Two environments, decided by the
owner on 2026-11-23 following issue #2:

| Environment | Branch | Where | How | State |
|---|---|---|---|---|
| Stage | `stage` | `https://theplanet.wtf/`, GitHub Pages of this repository | `.github/workflows/stage.yml` on every push to `stage` | DNS broken (issue #6) |
| Production | `master` | `https://theplanet.observer/`, a Cloudflare Worker serving `build/pages/` as static assets | not automated yet (issue #2) | token, secrets and custom domain to set up (issues #6, #7) |

What the site shows and how it links the other repositories of the organization are decided
by the owner, request by request.

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
- 2026-11-23, "folda i due branch attualmente presenti sulla repo [...] l'uno sull'altro e poi
  su dev e poi cancellali e pusha dev": `glob_coverage` and `hyde_theme` were merged into `dev`
  and deleted. Asked again the same day, against point 4 of issue #5 (keep them until the
  first release of `thestory`), the owner chose to leave them deleted; their commits are in
  the history of `dev` (`c8a2c5d`, `ec8acac`).
- 2026-11-23, "voglio creare anche stage e pubblicare [...] master su theplanet.observer e
  stage su theplanet.wtf": production at `theplanet.observer`, stage at `theplanet.wtf`
  (Section 1). Told that GitHub Pages serves one domain per repository, the owner chose the
  split of issue #2: stage on GitHub Pages, production on Cloudflare.
- 2026-11-23, "per master voglio usare una cf worker non page": production is a Cloudflare
  Worker with static assets, deployed by `wrangler deploy`, not a Cloudflare Pages project.
- 2026-11-23, "voglio poi usare la skill [ui-ux-pro-max] per migliorare la pagina e apportare
  dei cambiamenti che ti dirò": the plugin is enabled in `.claude/settings.json` (Section 10);
  the changes to the page come from the owner, request by request.
- 2026-11-23, "voglio anche creare dei task per vederla in anteprima qui dal codespace":
  `npm run serve` and the task *Preview: site (live reload)*, port 4000 forwarded.
- 2026-11-23, "voglio anche sistemare il codice qui nel progetto, mi sembra un po'
  disordinato": the prototype in `docs/` is to be cleaned up (Section 12).
- 2026-11-23, "aggiungi anche la skill della issue #4 e implementiamo la #5": the skill
  `security-audit` of Cloudflare is installed for the user by `scripts/install-skills.sh`; the
  branches `dev` and `stage` and the stage deploy follow issue #5.
- 2026-11-23, "in thebox è stato risolto: risolvilo anche qui" (the warning "Default
  interpreter path '${workspaceFolder}/.venv/bin/python' could not be resolved"): thesite
  follows thebox v0.1.2 (Section 11), which also brings the squash merges along the chain.
- 2026-11-23, "vorrei pubblicare master così com'è e intanto sviluppare su stage e pubblicarla
  una versione migliora nella cui home iniziamo a sviluppare un globo come questo [GitHub
  globe] creditando il lavoro qui descritto adeguatamente. in realtà utilizzando anche un
  apikey di meshy.ai vorrei trasformare questo globo qui in uno più simile a quello del nostro
  logo, aggiungendogli, gambre, braccia, occhiali": the home of the stage site gets a 3D globe
  built on the techniques of
  [How we built the GitHub globe](https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/)
  (Tobias Ahlin, GitHub, 2020), credited on the site; a model of the mascot of the logo,
  generated with the API of [Meshy](https://docs.meshy.ai/en/api/image-to-3d), follows. The
  key of Meshy lives only in the environment (`MESHY_API_KEY`), never in a file.

Rules of the organization, carried over from thebox or from its issues (keep them unless the
owner decides otherwise):

- "Vai più avanti possibile da solo": Claude proceeds autonomously as far as it can; **the
  owner only merges the pull requests on `stage` and `master`** (Section 9).
- 2026-11-14 and 2026-11-15 (issue #5), "su ogni repo ci sia sempre un ramo dev che poi
  mergiano su staging e poi staging su master" and "usiamo stage per tutti i repo": `dev` into
  `stage`, `stage` into `master`, by pull requests (`CONTRIBUTING.md`, *Branches and pull
  requests*).
- 2026-11-23 (thebox v0.1.1), "dev va sempre squashata dentro stage (se c'è) e master, che
  poi vanno rimergiate dentro dev per evitare conflitti": pull requests along the chain `dev`,
  `stage`, `master` are **squash-merged**; right after each, the target is **merged back down
  the chain to `dev`** (`CONTRIBUTING.md`, *Branches and pull requests*). Pull requests of the
  branches of work into `dev` are not squashed: merge commit. Claude completes any missing
  merge back at the start of the work ("fallo sempre all'inizio se serve").
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
| `scripts/build.sh`, `test.sh`, `check.sh` | Build (the site into `build/pages/`), unit tests, every check (the entry points of CI) |
| `scripts/serve.sh` | Live preview of the site at `http://localhost:4000` (`npm run serve`) |
| `scripts/install-skills.sh` | Claude Code skills installed for the user, pinned to a commit (Section 10) |
| `scripts/check-confidential.py` | Confidentiality guard (pre-commit hook and `npm run check`) |
| `scripts/check-template.sh` | Lists the `TEMPLATE` markers left |
| `scripts/version.py` | Version, next version and release notes from the tags and the commits |
| `scripts/setup-python.sh` | `.venv/` from `requirements.txt`, reinstalled only when it changes |
| `tests/` | `unittest` checks of the harness scripts (standard library only) |
| `.devcontainer/` | `Dockerfile`, `devcontainer.json`, `post-create.sh` (Section 10) |
| `.vscode/` | Recommended extensions, settings, and every command as a task |
| `.mcp.json` | Project MCP servers for Claude Code: Playwright |
| `.claude/settings.json` | Project settings of Claude Code: the plugin marketplaces and plugins of the repository (Section 10) |
| `.githooks/pre-commit` | Confidentiality guard, enabled by `post-create.sh` |
| `.github/workflows/` | `ci.yml` (pull requests to `stage` and `master`), `stage.yml` (push to `stage`: the stage site on GitHub Pages), `release.yml` (merge on `master`) |
| `.github/pull_request_template.md` | Checklist of every pull request |
| `.github/copilot-instructions.md` | Points GitHub Copilot to these conventions |
| `build/` | Every output (git-ignored): `build/release/`, `build/pages/` |

`LICENSE` is the Apache License 2.0 of thesite (thebox itself is MIT: the license is not part
of the harness).

The site, as folded in from `hyde_theme` and not cleaned up yet (Section 12):

| Path | Content |
|---|---|
| `docs/` | Jekyll 4.3 site: `_config.yml`, `Gemfile` and `Gemfile.lock`, `_layouts/`, `_includes/`, `index.html`, `about.md`, `404.html`, `atom.xml`, `CNAME` |
| `docs/public/`, `docs/README.md`, `docs/LICENSE.md` | The Hyde theme on Poole, third-party, MIT: its README and parts of `about.md` are still the demo text of the theme |
| `docs/assets/` | The project's own CSS (`theplanet.css`, `map.css`, `popup.css`), the Leaflet map (`js/map.js`) and the logos |
| `new_0/` | Holds only a `.gitignore` that ignores everything else in the folder; its purpose is not documented |

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

For the site: `npm run serve` (or the task *Preview: site (live reload)*), then open
`http://localhost:4000` with the Playwright MCP server, the home page, `/about/` and the map
at least; and after `npm run build`, check that `build/pages/` holds no file that should not
be published (theme README, licences, `CNAME` of the demo).

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
  pushes it and opens the pull request from `dev` to `stage`, or lets the open one grow when
  the work belongs to it; a separate piece of work goes on a new branch, merged into `dev`.
  Once the owner has merged into `stage` and checked the stage site, Claude may open the pull
  request from `stage` to `master` when the owner asks for a release.
- The working branch is **`dev`** unless the owner names another; a separate piece of work
  goes on a new branch from `dev`, whose pull request goes into `dev` and is merged with a
  merge commit.
- **Never merge a pull request into `stage` or `master` on your own initiative, push to
  `master`, force-push or rewrite pushed commits.** Merging is the owner's decision. When the
  owner asks Claude to merge a pull request, Claude squash-merges it with the subject and body
  that `CONTRIBUTING.md` describes (`gh pr merge --squash --subject ... --body ...`), then
  merges the target back down the chain. The only push to `stage` outside a pull request is
  the merge back of `master` into it.
- **Before working on `dev`**, fetch and complete any merge back the chain lacks (`master`
  into `stage`, `stage` into `dev`): the owner may have squash-merged a pull request without
  merging it back. Merging them into the working branch is always allowed.
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
  `requirements.txt`, installs the Chromium of the Playwright MCP server, the gems of the
  site (`docs/Gemfile.lock`) and the skills of the user (`scripts/install-skills.sh`), and
  runs a first build.
- **Ruby 3.3** for the site: the devcontainer feature `ghcr.io/devcontainers/features/ruby`
  and `ruby/setup-ruby` in the workflows, both on the latest 3.3 release. Jekyll 4.3.3 of
  `docs/Gemfile.lock` does not start on Ruby 3.4 (`csv` is no longer a default gem): moving
  to 3.4 means updating Jekyll first.
- **Ports**: 4000, the preview of `npm run serve` (opened in the VS Code preview); 35729, its
  live reload (works in VS Code desktop; in a browser, reload by hand).
- **Skills and plugins of Claude Code**: `.claude/settings.json` declares the marketplace of
  `ui-ux-pro-max` and enables the plugin (Claude Code asks to install it when the folder is
  trusted; `/plugin` shows it); `scripts/install-skills.sh` copies `security-audit` of
  Cloudflare into `~/.claude/skills/`, so that nothing of it lands in the repository (issue
  #4).
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
| GitHub Actions | `checkout@v7`, `setup-node@v7`, `upload-artifact@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5` (all on Node 24; `release.yml` and `stage.yml` without dependency cache) | `.github/workflows/` |
| Ruby | 3.3 (`ruby/setup-ruby` v1.338.0, pinned by commit `b3aacea`) | `devcontainer.json`, workflows |
| Jekyll | 4.3.3, with the gems of `docs/Gemfile.lock` (Bundler 2.5.6) | `docs/` |
| Plugin `ui-ux-pro-max` | v2.15.0 of `nextlevelbuilder/ui-ux-pro-max-skill` (MIT; its manifest at that tag says 2.13.0) | `.claude/settings.json` |
| Skill `security-audit` | commit `c1c8a8c` (2026-09-14) of `cloudflare/security-audit-skill` (MIT) | `scripts/install-skills.sh` |


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
- This repository follows thebox **v0.1.2** (commit `d7b22c9`, 2026-11-23), adopted on
  2026-11-23. It was first set up from the archive `thebox-master.zip`, commit `db3b47c`,
  which is **v0.1.0** (`gh api repos/theplanet-earth/thebox/tags`); the update to v0.1.2
  brought v0.1.1 (`22cd1b6`: no `python.defaultInterpreterPath`, squash merges along the
  chain and their merges back, counted once by `scripts/version.py`) and v0.1.2 (`d7b22c9`:
  tests of the chain `dev`, `stage`, `master` and of branches merged into `dev`). Compute the
  diff of the next update from `v0.1.2`.
- Changes made here outside the `TEMPLATE` markers, to carry over by hand at the next update
  (and to propose to thebox where they are useful to every repository): the branch model
  `dev`, `stage`, `master` of issue #5, a rule of the whole organization (`ci.yml` triggers,
  `CONTRIBUTING.md`, *Branches and pull requests*, Sections 2 and 9 of this file); the
  workflow `stage.yml`; the note on `PUBLISH_PAGES` in `release.yml`; the Ruby step of the
  workflows; `scripts/serve.sh`, `scripts/install-skills.sh` and `.claude/settings.json`.

## 12. Known issues and TODO

- **Access to the organization from a Codespace**: the token of a Codespace reads the
  repositories its devcontainer requested **when the Codespace was created**, and only if the
  user authorized them then; a rebuild does not renew them. Create a new Codespace, or export
  a fine-grained token with read access as `GH_TOKEN`, which `gh` prefers. The token of a
  Codespace cannot list the packages of the organization on the GHCR (HTTP 403), nor see
  workflow runs older than GitHub's retention. The Codespace created on `dev` on 2026-11-23,
  with the access authorized, reads thebox.
- **Git LFS hooks**: Codespaces writes Git LFS hooks in `.git/hooks` that abort every push when
  `git-lfs` is not installed; `core.hooksPath .githooks` makes git ignore them.
- **Python interpreter in VS Code**: `.vscode/settings.json` does not set
  `python.defaultInterpreterPath`. When that path does not exist, the Python Environments
  extension (`ms-python.vscode-python-envs`, installed with `ms-python.python`) warns at every
  start ("Default interpreter path ... could not be resolved"): `.venv/` is missing in a
  repository without `requirements.txt`, as this one, and on the first start of a Codespace,
  because `postCreateCommand` runs after the editor has connected
  ([`waitFor`](https://containers.dev/implementors/json_reference/)). Without the setting, the
  extension chooses the `.venv/` of the workspace, otherwise the `python3` of the system
  ([startup flow](https://github.com/microsoft/vscode-python-environments/blob/main/docs/startup-flow.md)).
  A `.venv/` created while a window is open is chosen with *Python: Select Interpreter*.
- **First start of a Codespace**: `post-create.sh` runs after the editor has connected and
  takes about three minutes; until it ends, `~/.claude/skills/security-audit` and `build/` do
  not exist yet. `/workspaces/.codespaces/.persistedshare/creation.log` shows its progress.
- **Plugin `ui-ux-pro-max`**: `.claude/settings.json` declares it, but on 2026-11-23 the
  Claude Code extension of VS Code installed neither the marketplace nor the plugin in a new
  Codespace (`claude plugin list`: "No plugins installed"). Start `claude` in a terminal at
  the root of the repository, trust the folder and accept the marketplace and the plugin it
  offers (pinned to v2.15.0 by `.claude/settings.json`); `/plugin` shows them. Then start a
  new session.
- **Stale `.venv/`**: a `.venv/` that survives a change of image keeps a dangling interpreter
  link; `scripts/setup-python.sh` recreates it with `--clear`.
- **Playwright MCP browser**: `@playwright/mcp` pins its own Playwright, which may expect a
  Chromium revision other than the one of the project; `post-create.sh` installs the one it
  needs. If it is missing, the MCP tool `browser_install` installs it.

- **GitHub Pages** (GitHub API, `GET /repos/theplanet-earth/thesite/pages` and
  `.../environments/github-pages`, 2026-11-23): build type *GitHub Actions*, custom domain
  `theplanet.wtf`, the stage site. The `github-pages` environment accepts deployments from
  `stage` only (set by the owner on 2026-11-23, issue #7). The last deployment came from
  `hyde_theme` (commit `ec8acac`, now in the history of `dev`) on 2024-03-27.
- **The stage domain does not reach the site** (checked on 2026-11-23): `https://theplanet.wtf/`
  answers HTTP 403 from Cloudflare with the page "DNS points to prohibited IP"
  ([Cloudflare Error 1000](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1000/)),
  while `https://theplanet-earth.github.io/thesite/` answers 301 to `https://theplanet.wtf/`:
  GitHub Pages works, the DNS records on Cloudflare do not (issue #6).
  `theplanet.observer` has no A, AAAA or CNAME record yet.
- **Inconsistency in the site, reported and not fixed**: `docs/CNAME` says
  `hyde.getpoole.com` (changed by `1b80293`, "brand new style", from the `theplanet.wtf` of
  `f820ec2`) and `docs/_config.yml` keeps the `url` and the description of the Hyde demo. With
  a GitHub Actions workflow a `CNAME` file is ignored
  ([GitHub Docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)),
  so nothing breaks today; it is part of the cleanup below.
- **`PUBLISH_PAGES` stays unset** in this repository: the GitHub Pages site here is the stage
  site, and `release.yml` would publish `master` on it.
- **What the preview shows** (`npm run serve`, Playwright at 1280x800 and 390x844,
  2026-11-23; screenshots in `.playwright-mcp/baseline/`, git-ignored):
  - the tiles of the map, `https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_nolabels/`
    in `docs/assets/js/map.js`, answer HTTP 200 with an image that reads "API KEY REQUIRED,
    carto.com/basemaps/apikey": the basemap is not shown;
  - a click anywhere on the map leads to `https://enjoy.theplanet.wtf`, whose name does not
    resolve (no DNS record);
  - `/about/` loads no style of the theme: `_includes/head.html` links `public/css/*.css` and
    `public/favicon.ico` relatively, so from `/about/` they become `/about/public/...` and
    answer 404 (four console errors); its text is still the demo of Hyde;
  - the home has no console error and no horizontal scroll at either size, and no link to
    `/about/`; the font PT Sans is requested over `http` and upgraded by the browser.
- **Merge settings of the repository** (GitHub API, 2026-11-23): squash, merge commits and
  rebase all allowed; squash title `COMMIT_OR_PR_TITLE` and message `COMMIT_MESSAGES`.
  `CONTRIBUTING.md` (thebox v0.1.2) expects the pull request title as subject, no list of
  commits, and rebase off; no ruleset exists. Owner steps in issue #7.

Open points:

- [ ] Owner: the Cloudflare side of both environments, issue #6; the GitHub side, issue #7.
- [ ] Production deploy (issue #2): a `wrangler.jsonc` for the Worker `thesite` (static
  assets from `build/pages/`, custom domain `theplanet.observer`), and `release.yml` running
  `wrangler deploy` through the GitHub environment `production`, once the token and the
  secrets of issues #6 and #7 exist
  ([Workers static assets](https://developers.cloudflare.com/workers/static-assets/),
  [GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)).
- [ ] Clean up the site in `docs/` (owner, 2026-11-23): the demo text and links of Hyde
  (`about.md`, `docs/README.md`, the sidebar, `_config.yml`), `docs/CNAME`, `new_0/`, the
  fonts loaded over `http`, the relative links to `public/`, the warning on `jekyll-paginate`,
  what `build/pages/` publishes (`README.md`, `LICENSE.md`); then the `TEMPLATE` markers left
  (`npm run check:template -- --list`).
- [ ] Older issues to plan with the owner: #1 (coverage map: colours from an API,
  click to explore), #3 (hardening of the Cloudflare zones), #4 (security audit with the skill,
  profile `quick`, findings only as private advisories).
- [ ] The labels `release:major`, `release:minor` and `release:patch`, read by `ci.yml` and
  `release.yml`, do not exist in the repository yet; create them when one is needed.
- [ ] Owner: the merge settings and the ruleset of the repository (issue #7), so that the
  squash along the chain takes the pull request title and no list of commits.
- [ ] The globe on the home of the stage site and the mascot model from Meshy (Section 2):
  plan to be agreed with the owner.
