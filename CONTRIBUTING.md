# Contributing

How to work in this repository. These rules apply to people and to assistants alike: Claude
Code reads them through `CLAUDE.md`, which imports this file, and GitHub Copilot through
`.github/copilot-instructions.md`. They come from **thebox**, the template of every repository
of the GitHub organization **theplanet-earth**; what is specific to this repository is in
`README.md` and `CLAUDE.md`.

## Getting started

1. Open the repository in a **Codespace** or in the **devcontainer** (VS Code: *Reopen in
   Container*). `.devcontainer/post-create.sh` enables the git hooks, installs the Node,
   Python and Ruby dependencies, the Chromium of the Playwright MCP server and the Claude Code
   skills of the user, and runs a first build.
   When GitHub asks, at the creation of the Codespace, to authorize access to the other
   repositories of the organization (`theplanet-earth/*`: read on everything, write on
   issues), read the caution at the top of `README.md` first: assistants working in the
   Codespace use that access to read the repositories this one depends on and to open
   issues in them.
2. Build with `npm run build` (or *Terminal, Run Task, Build*, `Ctrl+Shift+B`), check with
   `npm run check`.

Without the devcontainer you need Git, Node 22 or later, Python 3, and Ruby 3.3 with Bundler
for the site; then run `git config core.hooksPath .githooks`, `npm ci` and
`npm run setup:python`.

## Commands

Every command is an npm script and a VS Code task (*Terminal, Run Task*). The npm scripts
call the shell scripts in `scripts/`, so they also run without npm.

| Command | What it does |
|---|---|
| `npm run build` | Every output in `build/`: the files to attach to a release in `build/release/`, the site (Jekyll, from `docs/`, with the globe and the map bundled from `src/` by esbuild) in `build/pages/` |
| `npm run serve` | Preview of the site at `http://localhost:4000`, rebuilt on every change (task *Preview: site (live reload)*) |
| `npm run serve:stage` | The same preview, built as the stage site (`JEKYLL_ENV=stage`), with its banner *Work in progress* at the top and at the bottom of every page (task *Preview: site as stage (live reload)*) |
| `npm test` | Unit tests (`scripts/test.sh`) |
| `npm run check` | Tests, confidentiality, `TEMPLATE` markers and the checks of this repository: **run it before every pull request** |
| `npm run check:confidential` | Confidentiality guard on every tracked file |
| `npm run check:template -- --list` | The `TEMPLATE` markers still to resolve, with their line |
| `npm run globe:land` | The land mask of the globe, `docs/assets/globe/land.png`, from Natural Earth: run it only to change its source or size, and commit the result |
| `npm run mascot:generate` | The mascot of the logo as a 3D model, by the API of Meshy, into `build/meshy/<date>/`: it spends credits of the organization and needs `MESHY_API_KEY` in the environment (`-- --dry-run` shows the requests only) |
| `npm run globe:activity` | The latest edits to OpenStreetMap for the globe, into `docs/_data/activity.json` (also run by `npm run build` and `npm run serve`; without network, an empty list) |
| `npm run worker:check` / `worker:dev` | The Worker of production (`wrangler.jsonc`, `worker/`): validate and bundle it without deploying, or serve the built site with it at `http://localhost:8787`; wrangler at the version of `scripts/worker.sh`, no account needed |
| `npm run check:site` | Every local link and resource of the built site (`build/pages/`) exists, and none is loaded from another host; the notice of privacy is on every page but `/privacy/`; a page with the map of OpenStreetMap links its copyright page; and the banner of the stage site is at the top and at the bottom of every page of a build for stage and on no page of any other (by `JEKYLL_ENV`, production when unset); part of `npm run check` once the site is built, a step of CI after its build, and of each deploy |
| `npm run setup:python` | `.venv/` from `requirements.txt`, when the repository has one |
| `npm run version:current` / `version:next` / `release:notes` | Version of this build, of the next release, and the notes of the next release |
| `npm run clean` | Remove `build/` |


## Branches and pull requests

- Three branches, the rule of the organization (issue #5): work happens on **`dev`**; `dev`
  goes into **`stage`** by a pull request, whose merge deploys the stage site
  (`.github/workflows/stage.yml`, `theplanet.wtf`); `stage` goes into **`master`**, the main
  branch, by a pull request, whose merge publishes a release and deploys the production site
  (`.github/workflows/production.yml`, `theplanet.observer`). The stage site is built with
  `JEKYLL_ENV=stage`, so every page carries, at its top and at its bottom, a banner that says
  it is a preview; the production site is built with `JEKYLL_ENV=production`, without it. The
  code is the same on the three branches: no merge adds or removes the banner.
- Nobody pushes to `stage` or `master`: every change reaches them through a pull request, and
  the **owner of the repository merges** it. The only push outside a pull request is the merge
  back of `master` into `stage` (below).
- A separate piece of work may go on a branch of its own, started from `dev`, so that each
  pull request can be merged on its own. **A pull request into `dev` is merged with a merge
  commit** (*Create a merge commit*), never squashed: `dev` keeps its commits, and the squash
  along the chain gathers them. Bringing `stage` or `master` into the working branch is fine;
  force-pushing or rewriting pushed commits is not.
- **Along the chain `dev`, `stage`, `master`, pull requests are squash-merged** (*Squash and
  merge*): `dev` goes into `stage`, then `stage` into `master`. The squash commit takes the
  title of the pull request as its subject, a conventional commit whose prefix decides the
  version, and as its body the `type: text` lines of the changes it gathers, one per line
  (*Commits*). Do not paste the list of commits that GitHub may propose: it includes those
  already squashed (the *Commits* tab of the pull request shows them too; *Files changed*
  shows the real difference).
- **Right after every squash merge, the target is merged back down the chain**, and the
  branches merged into are pushed: after `dev` into `stage`, `stage` into `dev`; after `stage`
  into `master`, `master` into `stage`, then `stage` into `dev`. A squash leaves the original
  commits on the source and a new commit with the same changes on the target: until the
  target is merged back, the next pull request conflicts wherever the source changes again a
  file the squash touched. `scripts/version.py` recognizes the merges back and counts each
  change once, through its squash commit.
- The merge methods are a setting of the whole repository, so both stay allowed and whoever
  merges picks the method on the merge button: *Squash and merge* along the chain, *Create a
  merge commit* into `dev`. The settings of the repository that go with it (*Settings,
  General, Pull Requests*: keep merge commits and squash merging, *Default to pull request
  title* for the squash, rebase merging off) are set (issue #7)
  ([GitHub documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/configuring-commit-squashing-for-pull-requests));
  the rulesets below allow only the squash into `stage` and `master`.
- **Two rulesets** of the repository (*Settings, Rules, Rulesets*; set by the owner on
  2026-11-25, issue #25) make GitHub enforce these rules
  ([GitHub documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)):

  | Ruleset | Branches | Rules |
  |---|---|---|
  | `chain` | `stage`, `master` | No deletion; no force push; changes only through a pull request, merged with *Squash and merge* only, without required approvals, once the check `check` of CI has passed (the branch need not be up to date) |
  | `dev` | `dev` | No deletion; no force push. Direct pushes stay allowed: the work happens there |

  The role *Repository admin* may bypass both, always: the merge back of `master` into
  `stage` is a direct push and needs it. A Codespace acts as its owner, an admin, so it may
  bypass them too; the rules of this file still apply to whoever can.
- Every pull request to `stage` or `master` runs **CI** (`.github/workflows/ci.yml`): checks and
  build. Its job summary shows the version and the release notes that merging into `master`
  would publish, and the `TEMPLATE` markers left.
- The pull request template (`.github/pull_request_template.md`) is the checklist: build and
  checks green, tests, documentation aligned, no confidential material, screenshots when the
  appearance changed.
- **Changes another repository needs.** From a Codespace of this repository, another
  repository of the organization is never pushed to (the Codespace may not): the change is
  asked with an issue opened there, which says what is needed and why and links back to
  what needs it here. The owner, or an assistant in a Codespace of that repository, makes
  the change there.

## Commits

[Conventional commits](https://www.conventionalcommits.org/): a prefix, English, imperative
mood, subject under 72 characters, and a body explaining **why** rather than restating the diff.
**The prefixes decide the version** (next section): choose them with care.

| Prefix | Use for | Increment |
|---|---|---|
| `feat:` | A new capability, or a visible change of one | minor |
| `fix:` | A correction (bug, typo, wrong value, broken link) | patch |
| `perf:`, `refactor:` | Faster, or restructured, with the same behavior | patch |
| `style:` | Formatting, layout, look | patch |
| `docs:` | `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`, comments, documentation | patch |
| `build:`, `ci:`, `test:`, `chore:`, `revert:` | Tooling, workflows, tests, maintenance | patch |

In a commit that gathers others (a squash), every `type: text` line at the start of a body
line counts as its own entry of the release notes.

## Versions and releases

- **SemVer** tags `vX.Y.Z`, computed from the commits by `scripts/version.py` (tested in
  `tests/test_version.py`); the first release is `v0.1.0`.
  - **minor** when a commit since the last tag is `feat:`; **patch** for everything else;
  - **major never automatic**: `!` and `BREAKING CHANGE` count as minor. A major release needs
    the `release:major` label on the pull request or a manual run of *Release* with
    `bump = major`, and only on an explicit request of the owner;
  - the labels `release:minor` and `release:patch` force the increment.
- **No version number or release date is written by hand.** A build reads them from
  `scripts/version.py` (`X.Y.Z-dev` locally) or from `RELEASE_VERSION` in CI
  (`project_version` in `scripts/lib.sh`).
- `release.yml` (push to `master`, or by hand): version, build with `RELEASE_VERSION`, then a
  GitHub release `vX.Y.Z` with the notes, the files of `build/release/` and their
  `SHA256SUMS.txt`; skipped when there is no new commit. With the repository variable
  `PUBLISH_PAGES = true` it also publishes `build/pages/` on GitHub Pages.
- A repository may add its own prefixes (a documentation repository, for instance, makes
  `content:` and `slides:` minor): change `MINOR_TYPES` and `TYPE_TITLES` in
  `scripts/version.py`, its tests and the table above, in the same pull request.

## Checks

`npm run check` runs every check in the order CI runs them; CI runs the same script. A change
is done when `npm run build` succeeds and `npm run check` passes. A failing or skipped check is
reported as such, with its output, never hidden.

## Confidentiality

- Real names that must not be published (clients, people, hosts, addresses, internal systems,
  credentials) are listed, one per line, in **`confidential-terms.local`** at the root
  (git-ignored, never committed; `#` starts a comment). The pre-commit hook
  (`.githooks/pre-commit`) and `npm run check:confidential` block any file that contains one,
  ignoring case, and any private file: `*.local`, `*.local.*`, `.env`, `.env.*` (except
  `.env.example`), `private/` folders, `*.pem`, `*.key`, `*.p12`, `*.pfx`. The check never
  prints the term, so that it cannot reach a CI log.
- **Never** bypass them with `git commit --no-verify` or `git add -f`.
- In text, refer to private things generically ("the client", "Server A") and keep examples
  generic (`example.org`, RFC 5737 addresses such as `192.0.2.10`).
- Credentials, account identifiers and the lists of readers or users live in the secrets and
  variables of the repository or of the organization, or in the environment of whoever runs
  a command: never in a file of the repository.
- A credential found in a tracked file: name the file, never the value; add the value to
  `confidential-terms.local`; tell the owner, who rotates it.
- Third-party documents are committed only when their license allows redistribution;
  otherwise they stay in a `private/` folder (git-ignored). Screenshots and logs are checked
  for personal data before they are committed.

## Writing style

Applies to documentation, comments, commit messages and pull request descriptions.

- **Everything in the repository is written in English**: Markdown, YAML, code, comments,
  script output, file and branch names, commit messages.
- Formal, precise register. Define a term once, at its first use, then use it exactly; no
  synonyms. State claims as strongly as the evidence supports, no more: no marketing language
  ("novel", "seamless", "cutting-edge"), no exclamation marks, no emoji.
- **Never use an em dash** (U+2014). Use a comma, colon, semicolon or parentheses; write ranges
  as "1 to 5"; write "none" in an empty table cell.
- Where a document states a requirement, *shall*, *should* and *may* carry their normative
  meaning; elsewhere do not use them loosely.
- A statement about external work, a third-party API or a tool links to its source.
- Something not yet done is marked explicitly, never with ad hoc text: a `TODO` comment that
  says what is missing and why, or, in a file that comes from thebox, its `TEMPLATE` marker.

## Conventions of this repository

- **The site** is Jekyll in `docs/`: layouts and includes in `_layouts/` and `_includes/`,
  data in `_data/`, the project's own styles in `assets/css/`, the theme (Hyde on Poole, MIT)
  in `public/`. Every local link goes through `relative_url`, never a bare path: the build
  passes an empty `baseurl`, and `npm run check:site` fails on a link that does not resolve.
- **The pages of text** (About, Privacy, The globe) use the layout `page`: the text in a
  column of about 70 characters, and an index built from the title and the `##` and `###`
  headings, beside the text on wide screens and under the title on narrow ones
  (`docs/assets/css/page.css`, `src/toc/`). A page is divided by headings, not by bold
  lead-ins, so that its index shows the sections, numbered from two sections up;
  `toc: false` in the front matter leaves the index out. Titles are set as the logotype is,
  in Roboto Mono capitals, and the orange of the globe is the only accent of the text.
- **The scripts of the site** are ES modules in `src/`, bundled by esbuild (`npm run build`,
  `npm run serve`); no framework. Their libraries (three.js, Leaflet) are dependencies pinned
  in `package.json` and bundled with them, never loaded from another host. What can be tested
  without a browser (geometry, timing, data) goes in a module without three.js, Leaflet or
  the DOM, such as `src/globe/geometry.js` or `src/globe/transition.js`, with its tests in
  `tests/*.test.mjs` (`node --test`).
- **The scripts of the repository** are Python 3 with the standard library only, each with
  its `unittest` tests in `tests/`; a script that reads the network is tested against fake
  answers, never against the service.
- **Generated files** are git-ignored and never edited by hand: `build/`,
  `docs/assets/bundle/`, `docs/_data/activity.json`. The exception, committed as data and
  said so where it is described, is `docs/assets/globe/land.png` (`npm run globe:land`).
- **Third-party work** shown by the site is credited on the page that shows it and in
  `README.md`, *Credits*, with its licence; its terms of use are linked where it is read
  (the replication of OpenStreetMap, not its editing API). Personal data of third parties,
  such as the names of the mappers, are not kept, whether the build or the browser reads
  them. An attribution that its licence wants next to the data (OpenStreetMap) stays there;
  the other credits may go on the page that explains the work.
- **The data of the visitors**: the site sets no cookie, stores nothing in the browser, and
  loads its pages, fonts, styles, scripts and images from itself (`npm run check:site` fails
  on a resource of another host). The exception is the map of the page Map: Leaflet asks
  `tile.openstreetmap.org` for the tiles on screen, only once the map is shown, at the URL of
  `docs/_config.yml` and within the
  [tile usage policy](https://operations.osmfoundation.org/policies/tiles/) (no prefetch, a
  Referer with every tile, the credit on the map, which `npm run check:site` checks next to
  it). A change that makes the browser contact another host, or
  that keeps anything about a visitor, changes the page *Privacy* (`docs/privacy.md`) in the
  same pull request, before it reaches a site. Every page but that one opens, at the start
  of a visit, the notice of privacy (`docs/_includes/privacy-notice.html`, `src/notice/`),
  which stores nothing either; `npm run check:site` fails on a page without it.
