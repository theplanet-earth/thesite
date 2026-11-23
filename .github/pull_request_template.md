## What and why

<!-- What changes, and why. Link the issue it closes, if any. -->

## Checklist

- [ ] `npm run build` and `npm run check` pass
- [ ] Tests cover the changed behavior
- [ ] Documentation, `README.md`, `CONTRIBUTING.md` and `CLAUDE.md` updated where the change touches them (alignment rule)
- [ ] Commit prefixes chosen with care (they decide the version); no `release:major` label without the owner's request
- [ ] No confidential term, credential or personal data (files, screenshots, logs)
- [ ] Screenshots attached when the appearance changed

Into `stage` or `master`: *Squash and merge*, the title as subject, the `type: text` lines of
the changes as body; then merge the target back down the chain `master`, `stage`, `dev`.
Into `dev`: *Create a merge commit*. (`CONTRIBUTING.md`, *Branches and pull requests*.)
