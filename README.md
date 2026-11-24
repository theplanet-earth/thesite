# thesite

> [!CAUTION]
> **What a Codespace of this repository is allowed to do.** Creating a Codespace from this
> repository asks GitHub for the permissions below, written in
> [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json). GitHub shows them and
> grants them **only if you click to authorize**; "Continue without authorizing" creates a
> Codespace that can reach this repository only. They apply to new Codespaces only: a
> rebuild does not add or remove them
> ([GitHub documentation](https://docs.github.com/en/codespaces/managing-your-codespaces/managing-repository-access-for-your-codespaces)).
> A local devcontainer ignores them and works with your own Git credentials.
>
> | Where | Granted | What it allows, to you and to any assistant working in the Codespace |
> |---|---|---|
> | This repository | Read and write, the default of every Codespace ([source](https://docs.github.com/en/codespaces/reference/security-in-github-codespaces)) | Push to any branch that is not protected, open pull requests and issues |
> | Every other repository of `theplanet-earth` | **Write** on `issues` | **Open, edit, comment and close issues, in your name**, in every repository of the organization |
> | Every other repository of `theplanet-earth` | Read on `actions`, `checks`, `contents`, `deployments`, `discussions`, `packages`, `pages`, `pull_requests`, `repository_projects`, `statuses` | Read the code, the pull requests, the workflow runs, the packages and the rest of every repository |
> | Every other repository of `theplanet-earth` | Not granted: write on `contents`, `pull_requests`, `workflows`, administration, secrets | No push to another repository (no branch, no commit), no pull request, no change to its settings, no access to its secrets |
>
> So the Codespace of one repository talks to the others through issues only
> ([CONTRIBUTING.md](CONTRIBUTING.md#branches-and-pull-requests)). The rules of
> [CLAUDE.md](CLAUDE.md) also forbid an assistant to push to `stage` or `master` of this
> repository, to merge into them or to force-push; the token of this repository does not,
> and no ruleset protects its branches yet (issue #7): those rules are the only guard here.
>
> The Codespace also: enables the git hooks of `.githooks/` (the confidentiality guard),
> installs the npm, Python and Ruby dependencies, the Chromium of the Playwright MCP server
> (headless, run with `--no-sandbox`, `.mcp.json`) and the Claude Code skills of the user
> (`scripts/install-skills.sh`), and installs Node, the GitHub CLI, Claude Code and Ruby as
> devcontainer features.

The project site of the GitHub organization **theplanet-earth**.

![The Pipeline](/docs/assets/images/theplanetearth.png)

## Environments

| Environment | Branch | Address | Published by |
|---|---|---|---|
| Stage | `stage` | <https://theplanet.wtf/> | `.github/workflows/stage.yml`, on GitHub Pages, at every merge into `stage` |
| Production | `master` | <https://theplanet.observer/> | A Cloudflare Worker with static assets, at every merge into `master` (not automated yet, issue #2) |

Work happens on `dev`; `dev` goes into `stage`, and `stage` into `master`, by pull requests
that the owner squash-merges, each followed by a merge back down the chain
([CONTRIBUTING.md](CONTRIBUTING.md#branches-and-pull-requests)).

## Status

- The site is the 2024 Jekyll prototype in `docs/` (Hyde theme on Poole, Leaflet map), folded
  in from the branches `glob_coverage` and `hyde_theme`, which were then deleted. It still
  carries demo text of the theme and is to be cleaned up (`CLAUDE.md`, *Known issues and
  TODO*). The map shows the standard tiles of
  [OpenStreetMap](https://operations.osmfoundation.org/policies/tiles/).
- Next, on stage: a 3D globe in place of the map on the home page, with the latest edits to
  OpenStreetMap (`CLAUDE.md`, Section 2). The mascot of the logo in 3D is kept in
  [`media/mascot/`](media/mascot/README.md), not used by the site.
- On 2026-11-23 neither address reaches the site: `theplanet.wtf` answers with a Cloudflare
  error, "DNS points to prohibited IP", and `theplanet.observer` has no DNS record yet. The
  steps for the owner are in issues #6 (Cloudflare) and #7 (GitHub).

## Getting started

Open the repository in a **Codespace** or in the **devcontainer**, then:

```bash
npm run serve    # preview at http://localhost:4000, rebuilt on every change
npm run build    # every output in build/: the site in build/pages/
npm run check    # tests, confidentiality, TEMPLATE markers: run it before every pull request
```

The preview is also the task *Preview: site (live reload)* (*Terminal, Run Task*). The
commands, branches, commit conventions, releases and confidentiality rules are in
[CONTRIBUTING.md](CONTRIBUTING.md); the instructions for assistants are in
[CLAUDE.md](CLAUDE.md).

## Releases

Every merge on `master` publishes a SemVer release `vX.Y.Z` computed from the conventional
commits (`.github/workflows/release.yml`). The repository variable `PUBLISH_PAGES` stays
unset: the GitHub Pages site of this repository is the stage site.

## Credits

- The globe of the home page (`src/globe/`) is a new implementation of the techniques that
  Tobias Ahlin describes in
  [How we built the GitHub globe](https://github.blog/engineering/engineering-principles/how-we-built-the-github-globe/)
  (GitHub, 2020); GitHub did not publish the code of its globe, and none of it is used here.
- [three.js](https://threejs.org/) (MIT), bundled into the site with its licence.
- [Natural Earth](https://www.naturalearthdata.com/) (public domain), the land of the globe.
- The mascot in `media/mascot/`: a 3D model generated from the logo by
  [Meshy](https://www.meshy.ai/) on a paid plan, so that it belongs to the organization
  ([terms of use](https://www.meshy.ai/terms-of-use), 3.2).

## License

[Apache License 2.0](LICENSE). The Hyde theme in `docs/` keeps its own MIT license
(`docs/LICENSE.md`).
