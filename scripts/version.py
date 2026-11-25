#!/usr/bin/env python3
"""Version from git: SemVer tags vX.Y.Z and conventional commits.

    python3 scripts/version.py current          # version of this build (X.Y.Z, or X.Y.Z-dev)
    python3 scripts/version.py next [--bump B]  # version the next release will get
    python3 scripts/version.py notes [--bump B] # release notes (Markdown) of the next release
    python3 scripts/version.py date             # date of this build (YYYY-MM-DD)

Rules (CONTRIBUTING.md, "Versions and releases"):
  * minor when a commit since the last tag has a MINOR_TYPES prefix, patch otherwise;
  * major is NEVER automatic: `!` and BREAKING CHANGE count as minor. A major release
    needs --bump major (the `release:major` label on the pull request, or a manual run
    of the release workflow): only on an explicit request of the owner;
  * a commit that gathers others (squash) also counts each `type: text` line that starts
    a line of its body;
  * the commits already gathered by a squash merge are left out once the target branch has
    been merged back (`squashed`): dev, stage and the merge a pull request is checked on
    count each change once;
  * the first release is 0.1.0.
`current` is the latest tag when HEAD is that tag and the tree is clean; otherwise the next
version with `-dev`, so that a local build never looks like a release.
Standard library only.
"""
from __future__ import annotations

import argparse
import datetime as dt
import re
import subprocess
import sys

# A repository may add its own types (a documentation repository, for instance, adds
# "content" and "slides" as minor): change both, the tests and CONTRIBUTING.md together.
MINOR_TYPES = ("feat",)
TYPE_TITLES = {
    "feat": "Features",
    "fix": "Fixes",
    "perf": "Performance",
    "refactor": "Refactoring",
    "style": "Style",
    "docs": "Documentation",
    "build": "Build",
    "ci": "Continuous integration",
    "test": "Tests",
    "chore": "Maintenance",
    "revert": "Reverts",
}
SUBJECT = re.compile(r"^(?P<type>[a-z]+)(?:\([^)]*\))?(?P<bang>!)?:\s*(?P<text>.+)$")
FIRST_VERSION = (0, 1, 0)


def git(*args: str) -> str:
    return subprocess.run(["git", *args], check=True, capture_output=True, text=True).stdout.strip()


def last_tag() -> str | None:
    try:
        return git("describe", "--tags", "--abbrev=0", "--match", "v[0-9]*.[0-9]*.[0-9]*")
    except subprocess.CalledProcessError:
        return None


def parse(tag: str) -> tuple[int, int, int]:
    major, minor, patch = (int(part) for part in tag.lstrip("v").split("."))
    return major, minor, patch


def squashed(tag: str) -> set[str]:
    """Full hashes of the commits already gathered by a squash merge.

    A squash merge (CONTRIBUTING.md, "Branches and pull requests") gives the target branch
    (stage or master) one new commit; the source branch keeps the commits it gathers, which
    never become ancestors of the tag, even after the target is merged back into it. In a
    merge back, the second parent (the target) has the tree of a past commit of the first
    parent: that commit is the state that was squashed. It and its ancestors that the target
    does not contain are counted through the squash commit instead. The chain dev, stage,
    master applies this twice: dev is counted through the squashes on stage, which are
    counted through the squash on master. When no commit has that tree (an ordinary merge,
    or a target changed in another way), nothing is left out.
    """
    found: set[str] = set()
    for line in git("rev-list", "--merges", "--parents", f"{tag}..HEAD").splitlines():
        first, second = line.split()[1:3]
        tree = git("rev-parse", f"{second}^{{tree}}")
        for candidate in git("log", "--format=%H %T", f"{tag}..{first}").splitlines():
            sha, candidate_tree = candidate.split()
            if candidate_tree == tree:
                found.update(git("rev-list", sha, f"^{second}", f"^{tag}").split())
                break
    return found


def commits_since(tag: str | None) -> list[tuple[str, str, str]]:
    """(hash, subject, body) of the commits after tag, oldest first, merges and commits
    already gathered by a squash merge excluded."""
    try:
        span = f"{tag}..HEAD" if tag else "HEAD"
        raw = git("log", "--no-merges", "--reverse", "--format=%H%x1f%h%x1f%s%x1f%b%x1e", span)
        gathered = squashed(tag) if tag else set()
    except subprocess.CalledProcessError:
        return []
    out = []
    for record in raw.split("\x1e"):
        if record.strip():
            full, sha, subject, body = (record.strip("\n").split("\x1f") + ["", "", ""])[:4]
            if full not in gathered:
                out.append((sha, subject, body))
    return out


def entries(commits: list[tuple[str, str, str]]) -> list[tuple[str, str, str]]:
    """(type, text, hash) of every conventional entry, subjects and body lines."""
    found = []
    for sha, subject, body in commits:
        match = SUBJECT.match(subject)
        found.append((match["type"], match["text"], sha) if match else ("other", subject, sha))
        for line in body.splitlines():
            line_match = SUBJECT.match(line)  # only lines that start with `type:`
            if line_match and line_match["type"] in TYPE_TITLES:
                found.append((line_match["type"], line_match["text"], sha))
    return found


def bump_kind(found: list[tuple[str, str, str]]) -> str:
    return "minor" if any(kind in MINOR_TYPES for kind, _, _ in found) else "patch"


def next_version(bump: str | None = None) -> str | None:
    tag = last_tag()
    commits = commits_since(tag)
    if not tag:
        return ".".join(map(str, FIRST_VERSION)) if bump != "major" else "1.0.0"
    if not commits:
        return None
    major, minor, patch = parse(tag)
    kind = bump or bump_kind(entries(commits))
    if kind == "major":
        return f"{major + 1}.0.0"
    if kind == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def is_dirty() -> bool:
    try:
        return bool(git("status", "--porcelain", "--untracked-files=no"))
    except subprocess.CalledProcessError:
        return True


def current_version() -> str:
    try:
        git("rev-parse", "HEAD")
    except subprocess.CalledProcessError:
        return "0.1.0-dev"
    tag = last_tag()
    if tag and not commits_since(tag) and not is_dirty():
        return tag.lstrip("v")
    upcoming = next_version() or (tag.lstrip("v") if tag else "0.1.0")
    return f"{upcoming}-dev"


def build_date() -> str:
    if is_dirty():
        return dt.date.today().isoformat()
    try:
        return git("log", "-1", "--format=%cs")
    except subprocess.CalledProcessError:
        return dt.date.today().isoformat()


def notes(bump: str | None = None) -> str:
    tag = last_tag()
    version = next_version(bump)
    if version is None:
        return "No changes since the last release.\n"
    grouped: dict[str, list[str]] = {}
    for kind, text, sha in entries(commits_since(tag)):
        grouped.setdefault(kind, []).append(f"- {text} ({sha})")
    lines = [f"## Version {version}", ""]
    for kind in [*TYPE_TITLES, "other"]:
        if kind in grouped:
            lines += [f"### {TYPE_TITLES.get(kind, 'Other changes')}", "", *grouped[kind], ""]
    if tag:
        lines.append(f"Compared with {tag}.")
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("command", choices=["current", "next", "notes", "date"])
    parser.add_argument("--bump", choices=["major", "minor", "patch"], help="force the kind of increment")
    args = parser.parse_args()
    if args.command == "current":
        print(current_version())
    elif args.command == "next":
        version = next_version(args.bump)
        if version is None:
            print("no changes since the last release", file=sys.stderr)
            return 1
        print(version)
    elif args.command == "notes":
        print(notes(args.bump), end="")
    else:
        print(build_date())
    return 0


if __name__ == "__main__":
    sys.exit(main())
