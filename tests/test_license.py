"""The license of the repository, as the owner decided on 2026-11-25 (CLAUDE.md Section 2,
issue #10): the code under MIT, the texts of the pages under CC BY 4.0, the logo and the
mascot not licensed. README.md, *License*, says so, and the notice in the sidebar of every
page links there."""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
HOLDER = "Andrea Gallegati"


def license_section() -> str:
    text = (ROOT / "README.md").read_text(encoding="utf-8")
    match = re.search(r"^## License\n(.*?)(?=^## |\Z)", text, flags=re.S | re.M)
    if match is None:
        raise AssertionError("README.md has no section License")
    return match.group(1)


class LicenseTest(unittest.TestCase):
    def test_license_file_is_mit_with_the_holder(self):
        text = (ROOT / "LICENSE").read_text(encoding="utf-8")
        self.assertTrue(text.startswith("MIT License\n"), text[:40])
        self.assertIn(f"Copyright (c) 2024 {HOLDER}\n", text)

    def test_readme_names_each_part(self):
        section = license_section()
        for words in ("[MIT License](LICENSE)", "CC BY 4.0", "all rights reserved", HOLDER):
            self.assertIn(words, section)

    def test_every_path_the_readme_names_exists(self):
        paths = [p for p in re.findall(r"`([^`\s]+)`", license_section()) if "/" in p]
        self.assertTrue(paths)
        for path in paths:
            self.assertTrue((ROOT / path).exists(), f"{path} named in README.md, License")

    def test_the_notice_of_the_sidebar_links_to_the_license(self):
        sidebar = (ROOT / "docs" / "_includes" / "sidebar.html").read_text(encoding="utf-8")
        config = (ROOT / "docs" / "_config.yml").read_text(encoding="utf-8")
        self.assertNotIn("All rights reserved", sidebar)
        self.assertIn('href="{{ site.github.repo }}#license"', sidebar)
        self.assertRegex(config, rf"(?m)^author: {HOLDER}$")
        # From the year of LICENSE to the year of the build (owner, 2026-11-25).
        self.assertIn("&copy; 2024-{{ site.time | date: '%Y' }} {{ site.author }}", sidebar)


if __name__ == "__main__":
    unittest.main()
