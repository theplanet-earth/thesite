# thesite

The project site of the GitHub organization **theplanet-earth**, published on GitHub Pages
at <https://theplanet.wtf/> (the homepage of the repository).

![The Pipeline](/docs/assets/images/theplanetearth.png)

## Status

- The repository holds the harness of **thebox**, the template of every repository of the
  organization: devcontainer, conventions for people and for Claude Code, git hooks, checks,
  CI and release workflows.
- `docs/` holds the 2024 Jekyll prototype of the site (Hyde theme on Poole, Leaflet map),
  folded in from the branches `glob_coverage` and `hyde_theme`, which were then deleted. It
  is not built by `npm run build` yet: only its own workflow, `.github/workflows/jekyll.yml`,
  builds and deploys it, and that workflow now runs only by hand.
- GitHub Pages still serves that prototype: according to the deployments of the repository,
  the last one to the `github-pages` environment was made from `hyde_theme` on 2024-03-27.
  On 2026-11-23, however, `https://theplanet.wtf/` answered with a Cloudflare error, "DNS
  points to prohibited IP", so the site is not reachable at its domain (`CLAUDE.md`,
  Section 12).
- How the site is built from now on (keep and evolve the Jekyll prototype, or another
  generator) is an open decision of the owner: `CLAUDE.md`, Section 12.

## Getting started

Open the repository in a **Codespace** or in the **devcontainer**, then:

```bash
npm run build    # every output in build/
npm run check    # tests, confidentiality, TEMPLATE markers: run it before every pull request
```

The commands, branches, commit conventions, releases and confidentiality rules are in
[CONTRIBUTING.md](CONTRIBUTING.md); the instructions for assistants are in
[CLAUDE.md](CLAUDE.md).

## Releases

Every merge on `master` publishes a SemVer release `vX.Y.Z` computed from the conventional
commits (`.github/workflows/release.yml`). The same workflow can publish `build/pages/` on
GitHub Pages, but only when the repository variable `PUBLISH_PAGES` is `true`: leave it unset
until `npm run build` puts the site in `build/pages/`, otherwise the deploy would replace the
site online with an empty one.

## License

[Apache License 2.0](LICENSE). The Hyde theme in `docs/` keeps its own MIT license
(`docs/LICENSE.md`).
