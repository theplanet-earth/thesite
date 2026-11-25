"""The header of README.md, as the owner asked on 2026-11-25 (CLAUDE.md Section 2): the logo
above everything, small, then the title and the badges, then the caution of the Codespace
(tests/test_devcontainer_permissions.py), before the first section. The badges of the two
sites name the addresses of the section Environments, and a badge that links inside the
file links to a section that exists."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def header() -> str:
    """README.md up to its first block quote, the caution."""
    text = (ROOT / "README.md").read_text(encoding="utf-8")
    return text[: text.index("\n> ")]


class ReadmeHeaderTest(unittest.TestCase):
    def setUp(self):
        self.text = (ROOT / "README.md").read_text(encoding="utf-8")
        self.header = header()

    def test_the_logo_comes_first_and_small(self):
        logo = re.search(r"<img src=\"([^\"]+)\" width=\"(\d+)\"", self.header)
        self.assertIsNotNone(logo, "no logo at the top of README.md")
        self.assertEqual(self.header.index("<img"), logo.start())
        self.assertTrue((ROOT / logo.group(1)).exists(), logo.group(1))
        self.assertLessEqual(int(logo.group(2)), 200)

    def test_the_title_follows_the_logo_and_the_caution_the_badges(self):
        self.assertLess(self.header.index("<img src="), self.header.index("<h1"))
        self.assertLess(self.header.index("<h1"), self.header.index("img.shields.io"))
        self.assertNotIn("\n## ", self.header)
        self.assertTrue(self.text[len(self.header) + 1:].startswith("> [!CAUTION]"))

    def test_the_badges_of_the_sites_name_the_environments(self):
        environments = re.search(r"^## Environments\n(.*?)(?=^## )", self.text, flags=re.S | re.M)
        addresses = re.findall(r"<(https://[^>]+)>", environments.group(1))
        self.assertEqual(sorted(addresses), ["https://theplanet.observer/", "https://theplanet.wtf/"])
        for address in addresses:
            self.assertIn(f'<a href="{address}"><img', self.header)
            host = address.removeprefix("https://").rstrip("/")
            self.assertIn(f"up_message={host}&", self.header)

    def test_every_badge_has_a_text_and_every_anchor_a_section(self):
        badges = re.findall(r"<img alt=\"([^\"]*)\"", self.header)
        self.assertTrue(badges)
        self.assertTrue(all(badges), "a badge without alt text")
        sections = {re.sub(r"[^a-z0-9 -]", "", title.lower()).replace(" ", "-")
                    for title in re.findall(r"^## (.+)$", self.text, flags=re.M)}
        for anchor in re.findall(r"href=\"#([^\"]+)\"", self.header):
            self.assertIn(anchor, sections)


if __name__ == "__main__":
    unittest.main()
