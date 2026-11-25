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
branches `glob_coverage` and `hyde_theme` (opened in this order, then deleted). Its home page
shows a 3D globe (`src/globe/`, three.js bundled by esbuild), which replaced the Leaflet map
of the prototype on 2026-11-23, with the latest edits to OpenStreetMap as orange spikes and
arcs (issue #1, Section 2): those of the build first, then those the browser reads once a
minute while the globe is shown. `/globe/` explains it and credits the work it builds on. In production a Worker
(`wrangler.jsonc`, `worker/`) serves the site and reads the edits once for every visitor. `npm run build` builds it into `build/pages/`,
`npm run serve` previews it. Two environments, decided by the
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
  disordinato": the prototype in `docs/` was cleaned up on 2026-11-24 (Section 4).
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
- 2026-11-23, the owner's answers on that plan: production gets "the prototype plus two
  fixes" (the style of `/about/` and the tiles of the map; the rest of the cleanup and the
  globe go to stage after the first release); the globe **replaces** the Leaflet map on the
  home of stage (the coverage of issue #1 will come as points and arcs on the globe); Meshy
  on a **paid plan**, so the generated models belong to the organization (Meshy terms, 3.2),
  "procedi"; nothing done yet on issues #6 and #7.
- 2026-11-24, "non mi piace questo modello 3d al posto del globo stile github, rimetti il globo
  stile github com'era prima, ma tieni il modello committato nel repo da qualche parte (magari
  lo utilizzeremo da thegame, come easter egg) però leva la texture fatta a mo di globo di
  github": the home keeps the globe of #9; the mascot is kept, with its own texture, in
  `media/mascot/`, outside the published site. The same day: the points and arcs of issue #1
  in the orange of the palette, "come per le issue e pr su github, [...] andando a leggere i
  contributi su osm", the cleanup of `docs/`, and "vai avanti più possibile da solo fino alla
  fine".
- 2026-11-24, after installing the plugin `ui-ux-pro-max` (version 2.13.0 of its manifest,
  user scope): "farai tu i due merge (e tutto il resto al contrario, compreso anche eliminare
  le branch che non ti servono più) ma prima voglio finire di fare tutto il necessario per poi
  vedere il deploy automatico funzionare sui due domini": once the owner has finished issues
  #6, #7 and #2 and says so, Claude squash-merges #11, then #14, merges each target back down
  the chain, and deletes the merged branches of work (`globe`, `mascot`, `cleanup`, `home`).
  Until then they stay open.
- 2026-11-24, on the issue of thegame for the easter egg of the mascot: "ricordami di aprirla
  fino a che non ricreiamo il devcontainer": every recap reminds it, until a Codespace created
  after the change of the devcontainer can open it. On the other files of Meshy: "per adesso
  sì", they are kept in `media/mascot/`.
- 2026-11-24, on the home page: "Global reach" instead of "Global coverage"; "fai in modo che
  non debba scrollare verso il basso per vedere tutto" (the home page and `/globe/` fit one
  window); the credits of the globe move to a page `/globe/`, linked under the globe and not
  from the menu, while the attribution of OpenStreetMap stays next to the globe, as its
  guidelines require; About is left to the project; a GitHub icon instead of "Source on
  GitHub"; and the edits of OpenStreetMap "in tempo reale [...] a quando sta visualizzando
  l'utente e non a build time", about as many as the build keeps (113 to 120).
- 2026-11-24, on the edits read by every browser: "fallo, magari non ogni minuto, ma ogni 19
  minuti": the Worker of production reads the replication at most every 19 minutes per data
  centre and serves that copy to every visitor (`/api/osm-edits.json`); the browser asks
  every 19 minutes, the Worker where there is one, the replication where there is none. On
  the sidebar: "torna ai font originali, alle dimensioni del logo originali e soprattutto
  alla scritta THEPLANET su 3 righe originale, controllando sì che non compaia la scroll
  bar, ma neanche riducendo così tanto la spaziatura verticale", and a smaller GitHub icon.
- 2026-11-23, "aggiungi una issue per cambiare la licenza di questa repo (apri una issue
  analoga per tutte le altre repo dell'org) mettendo a confronto diverse licenze papabili per
  la repo e spiegandone il motivo e le differenze tra queste": issue #10 here; the same issue
  in every other repository of the organization, which a Codespace may open only with the
  permission below (Section 12).
- 2026-11-24, "modifica il devcontainer per avere il permesso di aprire issue su tutte le repo
  dell'org": the devcontainer asks for write on the `issues` of every repository of the
  organization, read on the rest, and nothing more (Section 10); the caution at the top of
  `README.md` lists what it allows. It applies to the Codespaces created after the change.
- 2026-11-25, on the alternatives of issue #10: "andiamo con A. MIT per il codice, CC BY 4.0
  per i testi, logo e mascotte riservati", without cluttering the sidebar, and as the holder
  "proprio il mio nome e basta": `LICENSE` is the MIT License, © 2024 Andrea Gallegati; the
  texts of the pages are CC BY 4.0; the logo and the mascot are not licensed (`README.md`,
  *License*). The sidebar keeps one line, the notice, which links to that section;
  `author` in `docs/_config.yml` holds the name.
- 2026-11-25, "fai 2024-2026 nella barra laterale [...] però aggiungi una action (schedulata)
  che buildi per aggiornare la data all'inizio di ciascun anno, sennò rimane vecchia": the
  notice reads "© 2024-<year of the build>", and `.github/workflows/new-year.yml` starts a
  build of the published sites on 1 January (Section 12).

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
| `scripts/serve.sh` | Live preview of the site at `http://localhost:4000` (`npm run serve`), with the bundle rebuilt on every change of `src/` |
| `scripts/bundle.sh`, `scripts/bundle.mjs` | esbuild bundles `src/globe/main.js` and three.js into `docs/assets/bundle/globe.js` (generated, git-ignored), with the licence of three.js beside it; run by `build.sh` and `serve.sh`; in watch mode it touches the bundle a second after each build (Section 12) |
| `wrangler.jsonc`, `worker/` | The Worker of production (issue #2): static assets from `build/pages/`, custom domain `theplanet.observer`; `worker/index.js` runs only for `/api/*`, `worker/edits.js` serves `/api/osm-edits.json`, read at most every 19 minutes and cached |
| `scripts/worker.sh` | wrangler at a pinned version: `npm run worker:check` (dry run) and `npm run worker:dev` (the site with the Worker at `http://localhost:8787`) |
| `media/mascot/` | The mascot of the logo in 3D, not used by the site: the five files Meshy made (walking, running, rigged, without skeleton, preview; 20 MB), `provenance.json` and a `README.md` on what each may serve; kept for thegame (Section 2) |
| `scripts/meshy.py` | The mascot of the logo as a 3D model by the API of Meshy: Image to 3D, rigging, the GLB files and their provenance in `build/meshy/<date>/` (`npm run mascot:generate`) |
| `scripts/osm-activity.py` | The latest edits to OpenStreetMap for the globe, from the minutely replication of changesets, into `docs/_data/activity.json` (generated at every build, git-ignored; `npm run globe:activity`) |
| `scripts/land-mask.py` | The land mask of the globe, `docs/assets/globe/land.png`, from Natural Earth (`npm run globe:land`) |
| `scripts/install-skills.sh` | Claude Code skills installed for the user, pinned to a commit (Section 10) |
| `scripts/check-confidential.py` | Confidentiality guard (pre-commit hook and `npm run check`) |
| `scripts/check-template.sh` | Lists the `TEMPLATE` markers left; none since 2026-11-24, so `npm run check` runs it with `--strict` |
| `scripts/check-site.py` | Check of the built site: every local link and resource of `build/pages/` exists, none loads over `http`, nothing unpublishable is published (`npm run check:site`) |
| `scripts/version.py` | Version, next version and release notes from the tags and the commits |
| `scripts/setup-python.sh` | `.venv/` from `requirements.txt`, reinstalled only when it changes |
| `tests/` | `unittest` checks of the harness scripts, of `check-site.py`, of `land-mask.py`, of `osm-activity.py`, of the permissions of the devcontainer and of the license (standard library only); `globe.test.mjs`, `replication.test.mjs` and `live.test.mjs` (the live edits and the Worker, against fakes), with `node --test` |
| `src/globe/` | The globe of the home page: `geometry.js` (dots of the land, spikes, arcs, quality tiers; no three.js), `replication.js` (the replication of changesets: paths, parsing, merging; no DOM), `live.js` (every 19 minutes, the edits from the Worker or from the replication; shared with the Worker), `main.js` (the three.js scene) |
| `package.json`, `package-lock.json` | Also the dependencies of the site, pinned: three.js and esbuild (Section 10) |
| `.devcontainer/` | `Dockerfile`, `devcontainer.json`, `post-create.sh` (Section 10) |
| `.vscode/` | Recommended extensions, settings, and every command as a task |
| `.mcp.json` | Project MCP servers for Claude Code: Playwright |
| `.claude/settings.json` | Project settings of Claude Code: the plugin marketplaces and plugins of the repository (Section 10) |
| `.githooks/pre-commit` | Confidentiality guard, enabled by `post-create.sh` |
| `.github/workflows/` | `ci.yml` (pull requests to `stage` and `master`), `stage.yml` (push to `stage`: the stage site on GitHub Pages), `release.yml` (merge on `master`), `new-year.yml` (1 January: starts `stage.yml` on `stage`, so that the year of the notice moves on) |
| `.github/pull_request_template.md` | Checklist of every pull request |
| `.github/copilot-instructions.md` | Points GitHub Copilot to these conventions |
| `build/` | Every output (git-ignored): `build/release/`, `build/pages/` |

`LICENSE` is the MIT License of thesite, © 2024 Andrea Gallegati; the texts of the pages are
CC BY 4.0, the logo and the mascot are not licensed, third-party work keeps its own license
(`README.md`, *License*, Section 2, 2026-11-25). The license is not part of the harness.

The site, cleaned up on 2026-11-24 (`CONTRIBUTING.md`, *Conventions of this repository*):

| Path | Content |
|---|---|
| `docs/` | Jekyll 4.3 site: `_config.yml`, `Gemfile` and `Gemfile.lock` (Jekyll, and the three gems Ruby 3.3 warns about), `_layouts/` (`default`, `page`), `_includes/` (`head`, `sidebar`), `index.html` (the globe), `globe.md` (how the globe is made, linked under it, not in the menu), `about.md`, `404.html`; the menu lists the pages with a `nav_order` |
| `docs/_data/coverage.yml` | The places shown as orange rings on the globe (issue #1) |
| `docs/_data/activity.json` | The latest edits to OpenStreetMap, the orange spikes and arcs of the globe: generated at every build by `scripts/osm-activity.py`, git-ignored |
| `docs/public/` | The Hyde theme on Poole, third-party, MIT, with the dark colours of the project: its CSS, icons and `LICENSE.md`, published with them as the licence asks |
| `docs/assets/` | The project's own CSS (`theplanet.css`, `globe.css`), the logo, `globe/land.png` (generated by `scripts/land-mask.py` and **committed** as data of the site: it changes only with its source), and `bundle/` (generated by `scripts/bundle.sh`, git-ignored) |
| `media/` | Files of the repository that the site does not publish: `theplanetearth.png` (the image of `README.md`) and `mascot/` |

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
`http://localhost:4000` with the Playwright MCP server, the home page with its globe (drag it,
turn it with the arrow keys) and `/about/` at least. After `npm run build`, `npm run check:site`
checks the links and resources of `build/pages/`, that nothing loads over `http`, and that
nothing unpublishable (`README.md`, `CNAME`, `Gemfile`) is published.

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
- The devcontainer requests **read access to every repository of the organization and write
  on their `issues`** (`customizations.codespaces.repositories`), so that an assistant can
  read the repositories this one depends on and ask them for changes with issues (Section
  2); it cannot push to them nor open pull requests there. GitHub asks the user to authorize
  them when a Codespace is created; the caution at the top of `README.md` lists what they
  allow, and is updated in the same change as the permissions
  (`tests/test_devcontainer_permissions.py` checks both). thebox issue #2 proposes the same
  for every repository, with write on `pull_requests` too, from the owner's decision of
  2026-11-15; thesite asks for `issues` only, as the owner asked.
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
| Mascot | Meshy Image to 3D, `ai_model: latest` (Meshy 7.1 in 2026-11), then rigging; tasks and parameters in `media/mascot/provenance.json`, 2026-11-24, 35 credits | `scripts/meshy.py` |
| three.js | 0.187.0 (MIT), bundled by esbuild 0.28.2 (MIT); exact versions in `package.json` | `package.json`, `package-lock.json` |
| OpenStreetMap edits | the minutely replication of changesets, `https://planet.openstreetmap.org/replication/changesets/` (redirects to a mirror on S3): the last 4 files, at most 120 edits, at every build; then, every 19 minutes, the Worker of production for every visitor, or the browser where there is no Worker: the latest 120 edits (backwards from the latest file, at most 10 files) | `scripts/osm-activity.py`, `src/globe/live.js`, `worker/edits.js` |
| wrangler | 4.168.0, through `npx` (not a dependency of the site); `compatibility_date` 2026-11-24 | `scripts/worker.sh`, `wrangler.jsonc` |
| Natural Earth | v5.1.2, 1:50m land (public domain), the source of `docs/assets/globe/land.png` | `scripts/land-mask.py` |
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
  workflows `stage.yml` and `new-year.yml`; the note on `PUBLISH_PAGES` in `release.yml`; the Ruby step of the
  workflows; `scripts/serve.sh`, `scripts/install-skills.sh` and `.claude/settings.json`;
  the permissions of `devcontainer.json` on the organization, with the caution of
  `README.md`, `tests/test_devcontainer_permissions.py` and the paragraphs of
  `CONTRIBUTING.md` (*Getting started*, *Changes another repository needs*), a subset of
  the patch of thebox issue #2, not yet in a release of thebox.

## 12. Known issues and TODO

- **Access to the organization from a Codespace**: the token of a Codespace reads the
  repositories its devcontainer requested **when the Codespace was created**, and only if the
  user authorized them then; a rebuild does not renew them. Create a new Codespace, or export
  a fine-grained token with read access as `GH_TOKEN`, which `gh` prefers. The token of a
  Codespace cannot list the packages of the organization on the GHCR (HTTP 403), nor see
  workflow runs older than GitHub's retention. The Codespace created on `dev` on 2026-11-23,
  with the access authorized, reads thebox but cannot open issues there: on 2026-11-24
  `gh issue create` in thebox answered HTTP 403, "Resource not accessible by integration".
  Write on issues needs a Codespace created after the change of the devcontainer of
  2026-11-24, with the access authorized: GitHub applies changed permissions to new
  Codespaces only, "even if you rebuild the codespace"
  ([GitHub documentation](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-repository-access-for-your-codespaces)).
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
- **The mascot from Meshy** (2026-11-24):
  - **inconsistency, reported**: `scripts/meshy.py` asks for `pose_mode: t-pose`
    ([Image to 3D](https://docs.meshy.ai/en/api/image-to-3d)), but the model kept the walking
    pose of the logo; the rigging worked all the same (24 bones, walking and running clips);
  - only `mascot-walking.glb` and the preview are committed, in `media/mascot/`; the model
    without skeleton, the rigged model and the running clip stay in `build/meshy/2026-11-24/`
    of the Codespace that made them, and Meshy deletes its copies on 2026-11-27;
  - its skeleton is in centimetres under an `Armature` scaled 0.01, and the mesh is turned
    against it (`media/mascot/README.md`).
- **The edits of OpenStreetMap** come from the minutely replication of changesets, not
  from the API: the API is "provided in order to edit the map data, **not** for read-only
  purposes or projects" ([API usage policy](https://operations.osmfoundation.org/policies/api/)).
  A build reads 5 files (about 20 KB): the state and the last 4 minutes. Then, every 19
  minutes while the globe is shown and the tab visible, the browser asks
  `/api/osm-edits.json`: in production the Worker answers from the cache of Cloudflare, and
  reads the replication itself (about 5 files) at most every 19 minutes per data centre;
  where there is no Worker (the stage site on GitHub Pages, the preview), the browser reads
  the replication directly, one file at a time. The server and its mirror on S3 answer
  `Access-Control-Allow-Origin: *` (checked on 2026-11-24). No user, comment or tag is kept,
  only the centre of each changeset rounded to 0.01 degree, its number of changes and its
  time; changesets spanning more than 1 degree are left out.
  - No page of OpenStreetMap says how many clients may read the replication (the front page
    of planet.openstreetmap.org and `/replication/`, read on 2026-11-24): hence the Worker,
    which reads it once for all the visitors of a data centre.
  - The attribution "© OpenStreetMap contributors" stays next to the globe, visible without
    interaction: the guidelines want it "in the vicinity of the produced work" and not behind
    an interaction ([Attribution Guidelines](https://osmfoundation.org/wiki/Licence/Attribution_Guidelines));
    the other credits, which have no such rule, are on `/globe/`.
- **The preview kept an older bundle** (2026-11-24): Jekyll copies a file into
  `build/serve/` only when its time of modification moves, and two builds of esbuild within
  the same instant left the preview serving the first; the globe of the preview then did not
  read the edits. `scripts/bundle.mjs` touches the bundle a second after each build of the
  watch, and the pages ask for the bundle and the styles with `?v=` and the time of the
  build, so that no browser keeps an older copy. If it happens again: `touch
  docs/assets/bundle/globe.js`.
- **The Worker** (checked with wrangler 4.168.0 on 2026-11-24: `deploy --dry-run`, and
  `wrangler dev`, which read 120 edits and served the second call from the cache): the
  runtime takes every named export of the main module for an entrypoint and refuses the
  others ("Incorrect type for map entry"), so `worker/index.js` exports only its default
  handler and the rest lives in `worker/edits.js`.
- **esbuild and npm 11**: `npm ci` warns that the install script of esbuild is "not yet
  covered by allowScripts" and does not run it. esbuild works without it: its binary comes
  from the optional package of the platform (`@esbuild/linux-x64`), and the script only
  checks it. Nothing to approve.
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
- **The yearly rebuild** (`.github/workflows/new-year.yml`, 2026-11-25): GitHub runs a
  schedule only from the default branch, so it works once the file reaches `master` (the
  first release after it); the run then has the ref of `master`, and the environment
  `github-pages` accepts `stage` only, so it starts `stage.yml` on `stage` by
  `workflow_dispatch`, which the `GITHUB_TOKEN` may trigger. Production is not rebuilt yet:
  nothing deploys `master` until issue #2 (a `TODO` in the workflow). In a public repository
  GitHub disables a schedule after 60 days without activity: after a quiet autumn, check in
  *Actions* that *New year* is enabled, or run it by hand on 1 January
  ([GitHub Docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule)).
- **`PUBLISH_PAGES` stays unset** in this repository: the GitHub Pages site here is the stage
  site, and `release.yml` would publish `master` on it.
- **What the preview shows** (`npm run serve`, Playwright at 1280x800 and 390x844, and at
  1440x900 and 1024x768 for the height, 2026-11-24; screenshots in `.playwright-mcp/`,
  git-ignored): the home page ("Global reach") and `/globe/` fit one window, without
  scrolling; the menu lists Home and About, then the icon of GitHub; on narrow screens the
  sidebar is a single row; no console error from the site, no broken link, no horizontal
  scroll. Fixed on the way:
  the tiles of CARTO, which now need a key ([CARTO](https://carto.com/basemaps/apikey)),
  until the globe replaced the map; `/about/` without style (links relative to the page);
  the click towards `https://enjoy.theplanet.wtf`, a name with no DNS record, gone with the
  map; the demo text of Hyde; the title of the pages and the links, of low contrast on the
  dark grey; the fonts over `http`; `maximum-scale=1`, which stopped zooming on phones.
- **Merge settings of the repository** (GitHub API, 2026-11-23): squash, merge commits and
  rebase all allowed; squash title `COMMIT_OR_PR_TITLE` and message `COMMIT_MESSAGES`.
  `CONTRIBUTING.md` (thebox v0.1.2) expects the pull request title as subject, no list of
  commits, and rebase off; no ruleset exists. Owner steps in issue #7.

Open points:

- [ ] Owner: the Cloudflare side of both environments, issue #6; the GitHub side, issue #7.
- [ ] Production deploy (issue #2): the Worker `thesite` is ready (`wrangler.jsonc`,
  `worker/`, checked locally); left: `release.yml` running `wrangler deploy` through the
  GitHub environment `production`, once the token and the secrets of issues #6 and #7 exist
  ([Workers static assets](https://developers.cloudflare.com/workers/static-assets/),
  [GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)).
- [ ] Older issues to plan with the owner: #1 (coverage map: colours from an API,
  click to explore), #3 (hardening of the Cloudflare zones), #4 (security audit with the skill,
  profile `quick`, findings only as private advisories).
- [ ] The labels `release:major`, `release:minor` and `release:patch`, read by `ci.yml` and
  `release.yml`, do not exist in the repository yet; create them when one is needed.
- [ ] Owner: the merge settings and the ruleset of the repository (issue #7), so that the
  squash along the chain takes the pull request title and no list of commits.
- [ ] The globe on the home of the stage site (Section 2): merged into `dev` by #9,
  with the latest edits to OpenStreetMap as orange spikes and arcs. Issue #1 stays open for
  what it asked first: the colours of the coverage from an API not defined yet, and the
  click towards `explore.<domain>`, a site that does not exist yet.
- [ ] The mascot from Meshy (Section 2): kept in `media/mascot/` for thegame. Owner: whether to
  keep the other files of `build/meshy/2026-11-24/` (the running clip, the rigged model), and
  whether thegame wants it: an issue there needs a Codespace created after 2026-11-24.
- [ ] The license of every repository (owner, 2026-11-23): thesite decided on 2026-11-25
  (Section 2, issue #10). The same issue, "Change the license: candidate licenses
  compared", is still to be opened in the other 15 repositories of the organization from a
  Codespace created after 2026-11-24; then the issue of thebox, which holds the overview,
  links them all and #10 links it. The script and the texts are kept in a private artifact
  of the owner, "License Issues Kit" (https://claude.ai/artifact/XMVTBxhuJ8Zkizv2DELHtH,
  files under `kit/`). Then the owner decides, repository by repository.
- [ ] The logo (owner, 2026-11-25, "segnati queste due cose per ricordarmele"): it was
  generated with an AI tool, so its protection as a work rests on the human part of it.
  Issue #19: record its provenance (the tool, the date, the prompt, what was done by hand)
  in `media/README.md`, once the owner says which tool it was. Issue #20: register the logo,
  and possibly the name, as a trademark (UIBM or EUIPO), the owner's decision. Remind both
  in the recaps until they are done.
