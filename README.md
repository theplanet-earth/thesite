# thesite

The project site of the GitHub organization **theplanet-earth**.

![The Pipeline](/docs/assets/images/theplanetearth.png)

## Environments

| Environment | Branch | Address | Published by |
|---|---|---|---|
| Stage | `stage` | <https://theplanet.wtf/> | `.github/workflows/stage.yml`, on GitHub Pages, at every merge into `stage` |
| Production | `master` | <https://theplanet.observer/> | A Cloudflare Worker with static assets, at every merge into `master` (not automated yet, issue #2) |

Work happens on `dev`; `dev` goes into `stage`, and `stage` into `master`, by pull requests
that the owner merges ([CONTRIBUTING.md](CONTRIBUTING.md#branches-and-pull-requests)).

## Status

- The site is the 2024 Jekyll prototype in `docs/` (Hyde theme on Poole, Leaflet map), folded
  in from the branches `glob_coverage` and `hyde_theme`, which were then deleted. It still
  carries demo text of the theme and is to be cleaned up.
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

## License

[Apache License 2.0](LICENSE). The Hyde theme in `docs/` keeps its own MIT license
(`docs/LICENSE.md`).
