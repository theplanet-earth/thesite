"""Check of the built site, scripts/check-site.py, on throwaway site folders."""
from __future__ import annotations

import importlib.util
import os
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

    def page(self, name: str, head: str, notice: bool | None = None) -> None:
        # Every page has the notice of privacy, as the layout makes it, but the page Privacy.
        if notice is None:
            notice = name != "privacy/index.html"
        body = "<dialog data-privacy-notice></dialog>" if notice else ""
        self.write(name, f"<!DOCTYPE html>\n<html><head>{head}</head><body>{body}</body></html>\n")

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

    def test_resource_of_another_host_is_reported(self) -> None:
        # The fonts of Google until 2026-11-25: every visitor's address went to Google.
        self.page("index.html", '<link rel="preconnect" href="https://fonts.example.org">\n'
                                '<link rel="stylesheet" href="https://fonts.example.org/css?family=PT+Sans">\n'
                                '<script src="//cdn.example.org/x.js"></script>\n'
                                '<img src="https://img.example.org/a.png" alt="">')
        problems = self.tool.third_party(self.site)
        self.assertEqual(problems, [
            "index.html:2: https://fonts.example.org",
            "index.html:3: https://fonts.example.org/css?family=PT+Sans",
            "index.html:4: //cdn.example.org/x.js",
            "index.html:5: https://img.example.org/a.png",
        ])

    def test_links_and_local_resources_are_not_third_party(self) -> None:
        # A link is followed only on a click; a license or canonical link loads nothing.
        self.page("index.html", '<a href="https://github.com/theplanet-earth/thesite">source</a>'
                                '<link rel="license" href="https://creativecommons.org/licenses/by/4.0/">'
                                '<link rel="stylesheet" href="/public/css/theme.css">'
                                '<img src="data:image/png;base64,AAAA" alt="">')
        self.write("public/css/theme.css", "@font-face { src: url(../fonts/a.woff2) format('woff2'); }\n"
                                           "body { background: url(\"data:image/png;base64,AAAA\"); }")
        self.assertEqual(self.tool.third_party(self.site), [])

    def test_stylesheet_of_another_host_is_reported(self) -> None:
        self.write("public/css/theme.css", "@import url('https://fonts.example.org/css');\n"
                                           "@import \"//fonts.example.org/b.css\";\n"
                                           "@font-face { src: url(https://fonts.example.org/a.woff2); }")
        self.assertEqual(self.tool.third_party(self.site), [
            "public/css/theme.css:1: https://fonts.example.org/css",
            "public/css/theme.css:2: //fonts.example.org/b.css",
            "public/css/theme.css:3: https://fonts.example.org/a.woff2",
        ])

    def test_notice_of_privacy_on_every_page_but_the_page_privacy(self) -> None:
        self.page("index.html", "")
        self.page("about/index.html", "")
        self.page("privacy/index.html", "")
        self.page("404.html", "")
        self.assertEqual(self.tool.notices(self.site), [])

    def test_page_without_the_notice_and_page_privacy_with_it(self) -> None:
        self.page("index.html", "")
        self.page("about/index.html", "", notice=False)
        self.page("privacy/index.html", "", notice=True)
        self.assertEqual(self.tool.notices(self.site), [
            "about/index.html: without the notice of privacy",
            "privacy/index.html: has the notice of privacy, which points to this page",
        ])

    def test_files_that_should_not_be_published(self) -> None:
        self.write("README.md", "theme readme")
        self.write("CNAME", "hyde.getpoole.com")
        self.write("public/LICENSE.md", "MIT")
        self.assertEqual(self.tool.unpublished(self.site), ["CNAME", "README.md"])

    def test_page_urls(self) -> None:
        self.assertEqual(self.tool.page_url(self.site, self.site / "index.html"), "/")
        self.assertEqual(self.tool.page_url(self.site, self.site / "about" / "index.html"), "/about/")
        self.assertEqual(self.tool.page_url(self.site, self.site / "404.html"), "/404.html")

    def banner_page(self, name: str, positions: tuple[str, ...] = ("top", "bottom")) -> None:
        def banner(position: str) -> str:
            return (f'<aside class="preview-banner preview-banner--{position}" aria-label="Preview"'
                    f' data-preview-banner="{position}"><p>Work in progress</p></aside>\n')

        top = "".join(banner(p) for p in positions if p == "top")
        bottom = "".join(banner(p) for p in positions if p != "top")
        # The notice of privacy after the banner at the bottom, as the layout makes it.
        notice = "<dialog data-privacy-notice></dialog>\n" if name != "privacy/index.html" else ""
        self.write(name, '<!DOCTYPE html>\n<html class="preview"><head></head><body>\n'
                         f'{top}<div class="content"></div>\n{bottom}{notice}</body></html>\n')

    def test_a_build_for_stage_has_the_banner_at_the_top_and_bottom_of_every_page(self) -> None:
        self.banner_page("index.html")
        self.banner_page("404.html", ("top",))
        self.page("about/index.html", "")
        self.assertEqual(self.tool.preview_banner(self.site, "stage"), [
            "404.html (banners: top; expected: top, bottom; JEKYLL_ENV=stage)",
            "about/index.html (banners: none; expected: top, bottom; JEKYLL_ENV=stage)",
        ])
        self.banner_page("404.html")
        self.banner_page("about/index.html")
        self.assertEqual(self.tool.preview_banner(self.site, "stage"), [])

    def test_a_banner_twice_at_the_same_edge_is_reported(self) -> None:
        self.banner_page("index.html", ("top", "top", "bottom"))
        self.assertEqual(self.tool.preview_banner(self.site, "stage"),
                         ["index.html (banners: top, top, bottom; expected: top, bottom; JEKYLL_ENV=stage)"])

    def test_any_other_build_has_it_on_no_page(self) -> None:
        self.page("index.html", "")
        self.page("about/index.html", "")
        self.assertEqual(self.tool.preview_banner(self.site, "production"), [])
        self.assertEqual(self.tool.preview_banner(self.site, "development"), [])
        self.banner_page("404.html", ("bottom",))
        self.assertEqual(self.tool.preview_banner(self.site, "production"),
                         ["404.html (banners: bottom; expected: none; JEKYLL_ENV=production)"])

    def test_exit_status_follows_jekyll_env(self) -> None:
        def run(environment: str | None) -> int:
            env = {k: v for k, v in os.environ.items() if k != "JEKYLL_ENV"}
            if environment is not None:
                env["JEKYLL_ENV"] = environment
            return subprocess.run([sys.executable, str(SCRIPT), str(self.site)],
                                  env=env, capture_output=True, text=True).returncode

        self.banner_page("index.html")
        self.assertEqual(run("stage"), 0)
        self.assertEqual(run(None), 1, "unset, JEKYLL_ENV means production, as in scripts/build.sh")
        self.assertEqual(run("production"), 1)
        self.page("index.html", "")
        self.assertEqual(run(None), 0)
        self.assertEqual(run("stage"), 1)

    def test_exit_status(self) -> None:
        def run(*args: str) -> int:
            env = {k: v for k, v in os.environ.items() if k != "JEKYLL_ENV"}
            return subprocess.run([sys.executable, str(SCRIPT), *args], env=env, capture_output=True, text=True).returncode

        self.page("index.html", '<link rel="stylesheet" href="/public/css/theme.css">')
        self.assertEqual(run(str(self.site)), 0)
        self.page("about/index.html", '<link rel="stylesheet" href="public/css/theme.css">')
        self.assertEqual(run(str(self.site)), 1)
        self.page("about/index.html", '<link rel="stylesheet" href="/public/css/theme.css">')
        self.assertEqual(run(str(self.site)), 0)
        self.write("CNAME", "hyde.getpoole.com")
        self.assertEqual(run(str(self.site)), 1)
        (self.site / "CNAME").unlink()
        self.page("index.html", '<link rel="stylesheet" href="https://fonts.example.org/a.css">')
        self.assertEqual(run(str(self.site)), 1)
        self.page("index.html", "", notice=False)
        self.assertEqual(run(str(self.site)), 1)
        self.assertEqual(run(str(self.site / "missing")), 2)


if __name__ == "__main__":
    unittest.main()
