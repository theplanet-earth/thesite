#!/usr/bin/env python3
"""Confidentiality guard: keep private material out of git.

    python3 scripts/check-confidential.py --staged   # files in the index (pre-commit hook)
    python3 scripts/check-confidential.py --all      # every tracked file (CI, npm run check)

It fails when a checked file
  * matches a BLOCKED_PATHS pattern (local or private material), or
  * contains, ignoring case, a term of `confidential-terms.local`: one term per line,
    `#` for comments. That file is git-ignored and never committed: it lists the real
    names (client, people, hosts, addresses, credentials) that must never appear
    in the repository.
    Without it only the path rules apply, which is the situation in CI.

Never bypass it with `git commit --no-verify` or `git add -f`. Standard library only.
"""
from __future__ import annotations

import fnmatch
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TERMS_FILE = ROOT / "confidential-terms.local"
BLOCKED_PATHS = (
    "*.local",
    "*.local.*",
    ".env",
    ".env.*",
    "private/*",
    "*/private/*",
    "*.pem",
    "*.key",
    "*.p12",
    "*.pfx",
)
ALLOWED_PATHS = (".env.example",)
TEXT_LIMIT = 5 * 1024 * 1024  # bytes read per file


def git_files(staged: bool) -> list[str]:
    if staged:
        args = ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]
    else:
        args = ["git", "ls-files", "-z"]
    out = subprocess.run(args, cwd=ROOT, check=True, capture_output=True).stdout.decode()
    return [name for name in out.split("\0") if name]


def staged_bytes(name: str) -> bytes:
    return subprocess.run(["git", "show", f":{name}"], cwd=ROOT, check=True, capture_output=True).stdout


def load_terms() -> list[str]:
    if not TERMS_FILE.exists():
        return []
    terms = []
    for line in TERMS_FILE.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            terms.append(line.casefold())
    return terms


def blocked(name: str) -> bool:
    if name in ALLOWED_PATHS:
        return False
    base = Path(name).name
    return any(fnmatch.fnmatch(name, pattern) or fnmatch.fnmatch(base, pattern) for pattern in BLOCKED_PATHS)


def main() -> int:
    staged = "--staged" in sys.argv
    terms = load_terms()
    problems: list[str] = []
    for name in git_files(staged):
        if blocked(name):
            problems.append(f"{name}: private file (pattern in BLOCKED_PATHS)")
            continue
        if not terms:
            continue
        try:
            data = staged_bytes(name) if staged else (ROOT / name).read_bytes()
        except (OSError, subprocess.CalledProcessError):
            continue
        text = data[:TEXT_LIMIT].decode("utf-8", "ignore").casefold()
        for index, term in enumerate(terms, start=1):
            if term in text:
                line = next((n for n, row in enumerate(text.splitlines(), 1) if term in row), 0)
                # The term itself is not printed, so that it never reaches a CI log.
                problems.append(f"{name}:{line}: contains confidential term no. {index} of confidential-terms.local")
    if problems:
        print("confidential: blocked", file=sys.stderr)
        for problem in problems:
            print(f"  {problem}", file=sys.stderr)
        print("Anonymize the content (or unstage the file) and try again. Do not use --no-verify.", file=sys.stderr)
        return 1
    scope = "staged files" if staged else "tracked files"
    note = f"{len(terms)} confidential terms" if terms else "path rules only (no confidential-terms.local)"
    print(f"confidential: {scope} clean ({note})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
