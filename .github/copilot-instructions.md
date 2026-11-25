# Instructions for GitHub Copilot

The conventions of this repository are in [CONTRIBUTING.md](../CONTRIBUTING.md) (rules shared
by people and assistants) and [CLAUDE.md](../CLAUDE.md) (instructions for assistants): follow
them. In short:

- Everything in the repository is in English; answer the user in their language.
- Every command is an npm script: `npm run build`, `npm run serve` (preview), `npm test`,
  `npm run check` (run it before a pull request). Generated files (`build/`) are never edited
  by hand.
- Conventional commits; the prefix decides the version (`feat:` minor, everything else patch).
  A major version only on an explicit request of the owner.
- Inconsistencies between sources are reported, never fixed in silence.
- Code, tests, documentation, `README.md`, `CONTRIBUTING.md` and `CLAUDE.md` change together.
- Never use an em dash. Never write confidential names or credentials, never bypass the
  pre-commit hook (`--no-verify`, `git add -f`).
- Branches `dev`, `stage`, `master`: commit and push on `dev`, open the pull request to `stage`;
  the owner squash-merges it, and later `stage` into `master`; then the target is merged back
  down the chain. A pull request from a branch of work into `dev` is merged with a merge
  commit, not squashed.

- The site is Jekyll in `docs/` (Ruby 3.3); the stage site is `theplanet.wtf`, production
  `theplanet.observer` (`README.md`, *Environments*).
