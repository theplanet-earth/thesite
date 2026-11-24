#!/usr/bin/env python3
"""Check of the built site: its links and resources, and what it publishes.

    python3 scripts/check-site.py [DIR]    # DIR defaults to build/pages (npm run build)

A page links a local file through href or src (stylesheets, scripts, images, icons, anchors).
The link is resolved as a browser resolves it from the page's own address, so a relative link
that works on the home page and breaks on /about/ is reported (CLAUDE.md, Section 12: that
broke the style of /about/ until 2026-11). Links with a scheme (https:, mailto:, data:),
protocol-relative links (//host) and links to a fragment of the same page are not checked.
Also reported: a resource loaded over plain http (stylesheet, script, image, frame, media),
which a browser on https blocks or upgrades; and a file that should not be published
(README.md, CNAME, Gemfile, Gemfile.lock: the theme's and the demo's, removed in 2026-11).
Exit status 1 on any problem, 2 when DIR does not exist. Standard library only.
"""
from __future__ import annotations

import sys
from html.parser import HTMLParser
from pathlib import Path, PurePosixPath
from urllib.parse import unquote, urljoin, urlsplit

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_DIR = ROOT / "build" / "pages"
# The attributes that point to another file, per element (srcset is not used by the site).
LINK_ATTRIBUTES = {"href", "src", "poster"}
# Elements whose href or src the browser loads with the page: over http, a mixed resource.
RESOURCE_TAGS = {"link", "script", "img", "iframe", "source", "audio", "video", "embed"}
# Files that a site never needs to publish.
UNPUBLISHED = {"README.md", "CNAME", "Gemfile", "Gemfile.lock"}


class Links(HTMLParser):
    """Collects (line, value) of every href, src and poster of a page."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.found: list[tuple[int, str]] = []
        self.insecure: list[tuple[int, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name in LINK_ATTRIBUTES and value is not None:
                self.found.append((self.getpos()[0], value.strip()))
                if tag in RESOURCE_TAGS and value.strip().lower().startswith("http:"):
                    self.insecure.append((self.getpos()[0], value.strip()))


def page_url(site: Path, page: Path) -> str:
    """The address a page is served at: about/index.html is /about/, 404.html is /404.html."""
    relative = page.relative_to(site).as_posix()
    if relative == "index.html":
        return "/"
    if relative.endswith("/index.html"):
        return "/" + relative[: -len("index.html")]
    return "/" + relative


def is_local(value: str) -> bool:
    parts = urlsplit(value)
    return not (parts.scheme or parts.netloc or value.startswith("#") or value == "")


def target(site: Path, path: str) -> Path | None:
    """The file a local path is served from, as a static host serves it, or None."""
    clean = PurePosixPath(unquote(path).lstrip("/"))
    if ".." in clean.parts:
        return None
    candidate = site.joinpath(*clean.parts) if clean.parts else site
    if path.endswith("/") or candidate.is_dir():
        candidate = candidate / "index.html"
    if candidate.is_file():
        return candidate
    html = candidate.with_name(candidate.name + ".html")
    return html if html.is_file() else None


def broken_links(site: Path) -> list[str]:
    """"page:line: link (resolved to path)" for every local link that does not exist."""
    problems = []
    for page in sorted(site.rglob("*.html")):
        parser = Links()
        parser.feed(page.read_text(encoding="utf-8", errors="replace"))
        base = page_url(site, page)
        for line, value in parser.insecure:
            problems.append(f"{page.relative_to(site).as_posix()}:{line}: {value} (a resource over plain http)")
        for line, value in parser.found:
            if not is_local(value):
                continue
            path = urlsplit(urljoin(base, value)).path
            if target(site, path) is None:
                problems.append(f"{page.relative_to(site).as_posix()}:{line}: {value} (resolved to {path})")
    return problems


def unpublished(site: Path) -> list[str]:
    """The files of the site that should not be published."""
    return sorted(p.relative_to(site).as_posix() for p in site.rglob("*") if p.is_file() and p.name in UNPUBLISHED)


def main(argv: list[str]) -> int:
    site = Path(argv[1]) if len(argv) > 1 else DEFAULT_DIR
    if not site.is_dir():
        print(f"site: {site} does not exist; run npm run build first", file=sys.stderr)
        return 2
    problems = broken_links(site)
    for problem in problems:
        print(f"site: broken link: {problem}", file=sys.stderr)
    extra = unpublished(site)
    for name in extra:
        print(f"site: should not be published: {name}", file=sys.stderr)
    problems += extra
    pages = sum(1 for _ in site.rglob("*.html"))
    if problems:
        print(f"site: {len(problems)} problems in {pages} pages", file=sys.stderr)
        return 1
    print(f"site: {pages} pages, every local link and resource exists, nothing over http, nothing unpublishable")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
