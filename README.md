# thesite

The project site of the GitHub organization **theplanet-earth**, published on GitHub Pages
at <https://theplanet.wtf/> (the homepage of the repository).

## Status

- `master` holds the harness of **thebox**, the template of every repository of the
  organization: devcontainer, conventions for people and for Claude Code, git hooks, checks,
  CI and release workflows. It holds no site sources yet.
- The site online today comes from a 2024 Jekyll prototype that lives only on the branches
  `hyde_theme` (Hyde theme, Leaflet map) and `glob_coverage`, never merged into `master`.
  According to the deployments of the repository, the last one to the `github-pages`
  environment was made from `hyde_theme` on 2024-03-27, by the workflow
  `.github/workflows/jekyll.yml` of that branch.
- How the site is built on `master` (generator, theme, content) is an open decision of the
  owner: `CLAUDE.md`, Section 12.

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

[Apache License 2.0](LICENSE).
