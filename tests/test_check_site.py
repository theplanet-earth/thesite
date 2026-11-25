"""Check of the built site, scripts/check-site.py, on throwaway site folders."""
from __future__ import annotations

import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "check-site.py"


def load():
    spec = importlib.util.spec_from_file_location("check_site", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class CheckSiteTest(unittest.TestCase):
    tool = load()

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.site = Path(self.tmp.name)
        self.write("public/css/theme.css", "body {}")
        self.write("assets/js/map.js", "")

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def write(self, name: str, text: str) -> None:
        path = self.site / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def page(self, name: str, head: str) -> None:
        self.write(name, f"<!DOCTYPE html>\n<html><head>{head}</head><body></body></html>\n")

    def test_relative_link_breaks_on_a_page_in_a_folder(self) -> None:
        # The fault of /about/: public/css/ works from / and not from /about/.
        link = '<link rel="stylesheet" href="public/css/theme.css">'
        self.page("index.html", link)
        self.page("about/index.html", link)
        problems = self.tool.broken_links(self.site)
        self.assertEqual(len(problems), 1)
        self.assertIn("about/index.html:2: public/css/theme.css (resolved to /about/public/css/theme.css)", problems[0])

    def test_absolute_links_resolve_from_every_page(self) -> None:
        head = '<link rel="stylesheet" href="/public/css/theme.css"><script src="/assets/js/map.js"></script>'
        self.page("index.html", head + '<a href="/about/">About</a><a href="/about">About</a>')
        self.page("about/index.html", head + '<a href="/">Home</a><a href="../index.html">Home</a>')
        self.assertEqual(self.tool.broken_links(self.site), [])

    def test_external_links_fragments_and_queries(self) -> None:
        self.page("index.html", '<a href="https://example.org/missing">x</a><a href="//example.org/x">x</a>'
                                '<a href="#top">x</a><a href="mailto:a@example.org">x</a>'
                                '<img src="data:image/png;base64,AAAA">'
                                '<link rel="stylesheet" href="/public/css/theme.css?v=1#x">')
        self.assertEqual(self.tool.broken_links(self.site), [])

    def test_missing_image_is_reported(self) -> None:
        self.page("index.html", '<img src="/assets/images/missing.png" alt="">')
        problems = self.tool.broken_links(self.site)
        self.assertEqual(len(problems), 1)
        self.assertIn("/assets/images/missing.png", problems[0])

    def test_resource_over_http_is_reported(self) -> None:
        self.page("index.html", '<link rel="stylesheet" href="http://fonts.example.org/a.css">'
                                '<a href="http://example.org/">a link may be http</a>')
        problems = self.tool.broken_links(self.site)
        self.assertEqual(len(problems), 1)
        self.assertIn("a resource over plain http", problems[0])

    def test_files_that_should_not_be_published(self) -> None:
        self.write("README.md", "theme readme")
        self.write("CNAME", "hyde.getpoole.com")
        self.write("public/LICENSE.md", "MIT")
        self.assertEqual(self.tool.unpublished(self.site), ["CNAME", "README.md"])

    def test_page_urls(self) -> None:
        self.assertEqual(self.tool.page_url(self.site, self.site / "index.html"), "/")
        self.assertEqual(self.tool.page_url(self.site, self.site / "about" / "index.html"), "/about/")
        self.assertEqual(self.tool.page_url(self.site, self.site / "404.html"), "/404.html")

    def test_exit_status(self) -> None:
        def run(*args: str) -> int:
            return subprocess.run([sys.executable, str(SCRIPT), *args], capture_output=True, text=True).returncode

        self.page("index.html", '<link rel="stylesheet" href="/public/css/theme.css">')
        self.assertEqual(run(str(self.site)), 0)
        self.page("about/index.html", '<link rel="stylesheet" href="public/css/theme.css">')
        self.assertEqual(run(str(self.site)), 1)
        self.page("about/index.html", '<link rel="stylesheet" href="/public/css/theme.css">')
        self.assertEqual(run(str(self.site)), 0)
        self.write("CNAME", "hyde.getpoole.com")
        self.assertEqual(run(str(self.site)), 1)
        self.assertEqual(run(str(self.site / "missing")), 2)


if __name__ == "__main__":
    unittest.main()
