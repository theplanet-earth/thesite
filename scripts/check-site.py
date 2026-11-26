#!/usr/bin/env python3
"""Check of the built site: its links and resources, and what it publishes.

    python3 scripts/check-site.py [DIR]    # DIR defaults to build/pages (npm run build)

A page links a local file through href or src (stylesheets, scripts, images, icons, anchors).
The link is resolved as a browser resolves it from the page's own address, so a relative link
that works on the home page and breaks on /about/ is reported (CLAUDE.md, Section 12: that
broke the style of /about/ until 2026-11). Links with a scheme (https:, mailto:, data:),
protocol-relative links (//host) and links to a fragment of the same page are not checked.
Also reported: a resource loaded over plain http (stylesheet, script, image, frame, media),
which a browser on https blocks or upgrades; a resource loaded from another host (an
element of the page, or a url() or @import of a stylesheet), which would give the address of
every visitor to that host, as Google Fonts did until 2026-11-25 (docs/privacy.md: the site
loads everything from itself; what its scripts read is said there); and a file that should not
be published (README.md, CNAME, Gemfile, Gemfile.lock: the theme's and the demo's, removed in
2026-11). The notice of privacy (docs/_includes/privacy-notice.html, found by
data-privacy-notice) must be on every page but the page Privacy, and not on that one.
And the banner of the stage site (docs/_includes/preview-banner.html): JEKYLL_ENV says which
site was built, as it says it to Jekyll (scripts/build.sh, production when unset); a build
for stage has it at the top and at the bottom of every page, any other build on no page, so
that the production site never shows it (the owner, 2026-11-25).
And a page with the map of OpenStreetMap (data-map, docs/_includes/world.html) must link its
copyright page, https://www.openstreetmap.org/copyright: the tile usage policy and the
attribution guidelines of OpenStreetMap want the credit next to the map
(https://operations.osmfoundation.org/policies/tiles/). Leaflet adds it on the map itself,
but only once the map runs; the page carries it without JavaScript too.
Exit status 1 on any problem, 2 when DIR does not exist. Standard library only.
"""
from __future__ import annotations

import os
import re
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
# Values of rel with which a <link> loads nothing (the others: stylesheet, icon, preconnect...).
NOT_LOADED_RELS = {"alternate", "author", "canonical", "help", "license", "me"}
# url(...) and @import "..." of a stylesheet, towards another host (with a scheme, or //host).
CSS_REMOTE = re.compile(r"""(?:url\(\s*['"]?|@import\s+['"])\s*((?:[a-z][a-z0-9+.-]*:)?//[^'")\s]+)""", re.IGNORECASE)
# The marker of the notice of privacy, and the page that has none: the one it points to.
NOTICE = "data-privacy-notice"
PRIVACY_PAGE = "privacy/index.html"
# Files that a site never needs to publish.
UNPUBLISHED = {"README.md", "CNAME", "Gemfile", "Gemfile.lock"}
# The attribute of the banner of the stage site, its values on every page of the stage site,
# and the environment that shows it.
PREVIEW_ATTRIBUTE = "data-preview-banner"
PREVIEW_POSITIONS = ("top", "bottom")
PREVIEW_ENVIRONMENT = "stage"
# The marker of the map of OpenStreetMap, and the page that its credit links.
MAP = "data-map"
OSM_COPYRIGHT = "https://www.openstreetmap.org/copyright"


class Links(HTMLParser):
    """Collects (line, value) of every href, src and poster of a page."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.found: list[tuple[int, str]] = []
        self.insecure: list[tuple[int, str]] = []
        self.remote: list[tuple[int, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        rels = set((dict(attrs).get("rel") or "").lower().split())
        loads = tag in RESOURCE_TAGS and not (tag == "link" and rels and rels <= NOT_LOADED_RELS)
        for name, value in attrs:
            if name in LINK_ATTRIBUTES and value is not None:
                self.found.append((self.getpos()[0], value.strip()))
                if loads and value.strip().lower().startswith("http:"):
                    self.insecure.append((self.getpos()[0], value.strip()))
                if loads and urlsplit(value.strip()).netloc:
                    self.remote.append((self.getpos()[0], value.strip()))


class Preview(HTMLParser):
    """The positions of the banners of the stage site on a page, in their order."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.found: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if name == PREVIEW_ATTRIBUTE:
                self.found.append(value or "")


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


def third_party(site: Path) -> list[str]:
    """"file:line: value" for every resource a page or a stylesheet loads from another host."""
    problems = []
    for page in sorted(site.rglob("*.html")):
        parser = Links()
        parser.feed(page.read_text(encoding="utf-8", errors="replace"))
        problems += [f"{page.relative_to(site).as_posix()}:{line}: {value}" for line, value in parser.remote]
    for sheet in sorted(site.rglob("*.css")):
        for number, text in enumerate(sheet.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            problems += [f"{sheet.relative_to(site).as_posix()}:{number}: {match}" for match in CSS_REMOTE.findall(text)]
    return problems


def notices(site: Path) -> list[str]:
    """The pages without the notice of privacy, and the page Privacy if it has it."""
    problems = []
    for page in sorted(site.rglob("*.html")):
        name = page.relative_to(site).as_posix()
        has = NOTICE in page.read_text(encoding="utf-8", errors="replace")
        if name == PRIVACY_PAGE and has:
            problems.append(f"{name}: has the notice of privacy, which points to this page")
        elif name != PRIVACY_PAGE and not has:
            problems.append(f"{name}: without the notice of privacy")
    return problems


def map_credits(site: Path) -> list[str]:
    """The pages with the map of OpenStreetMap that do not link its copyright page."""
    problems = []
    for page in sorted(site.rglob("*.html")):
        text = page.read_text(encoding="utf-8", errors="replace")
        if re.search(rf"\b{MAP}\b", text) and OSM_COPYRIGHT not in text:
            problems.append(f"{page.relative_to(site).as_posix()}: a map of OpenStreetMap without a link to {OSM_COPYRIGHT}")
    return problems


def unpublished(site: Path) -> list[str]:
    """The files of the site that should not be published."""
    return sorted(p.relative_to(site).as_posix() for p in site.rglob("*") if p.is_file() and p.name in UNPUBLISHED)


def preview_banner(site: Path, environment: str) -> list[str]:
    """The pages that break the rule of the banner: in a build for stage, those without it at
    the top and at the bottom, once each; in a build for any other environment, those with
    it anywhere."""
    expected = list(PREVIEW_POSITIONS) if environment == PREVIEW_ENVIRONMENT else []
    problems = []
    for page in sorted(site.rglob("*.html")):
        parser = Preview()
        parser.feed(page.read_text(encoding="utf-8", errors="replace"))
        if parser.found != expected:
            found = ", ".join(parser.found) or "none"
            wanted = ", ".join(expected) or "none"
            problems.append(f"{page.relative_to(site).as_posix()} (banners: {found}; expected: {wanted};"
                            f" JEKYLL_ENV={environment})")
    return problems


def main(argv: list[str]) -> int:
    site = Path(argv[1]) if len(argv) > 1 else DEFAULT_DIR
    if not site.is_dir():
        print(f"site: {site} does not exist; run npm run build first", file=sys.stderr)
        return 2
    environment = os.environ.get("JEKYLL_ENV") or "production"
    problems = broken_links(site)
    for problem in problems:
        print(f"site: broken link: {problem}", file=sys.stderr)
    remote = third_party(site)
    for problem in remote:
        print(f"site: loaded from another host: {problem}", file=sys.stderr)
    problems += remote
    missing = notices(site)
    for problem in missing:
        print(f"site: {problem}", file=sys.stderr)
    problems += missing
    credits = map_credits(site)
    for problem in credits:
        print(f"site: {problem}", file=sys.stderr)
    problems += credits
    extra = unpublished(site)
    for name in extra:
        print(f"site: should not be published: {name}", file=sys.stderr)
    banner = preview_banner(site, environment)
    for name in banner:
        print(f"site: preview banner: {name}", file=sys.stderr)
    problems += extra + banner
    pages = sum(1 for _ in site.rglob("*.html"))
    if problems:
        if banner:
            print("site: check with the JEKYLL_ENV the site was built with (scripts/build.sh)", file=sys.stderr)
        print(f"site: {len(problems)} problems in {pages} pages", file=sys.stderr)
        return 1
    where = "at the top and at the bottom of every page" if environment == PREVIEW_ENVIRONMENT else "on no page"
    print(f"site: {pages} pages, every local link and resource exists, nothing over http, nothing from another host,"
          f" the notice of privacy where due, the credit of OpenStreetMap with its map, nothing unpublishable,"
          f" the preview banner {where} ({environment})")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
