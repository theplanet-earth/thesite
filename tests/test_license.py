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

    def test_the_site_is_rebuilt_on_the_first_of_january(self):
        # The year of the notice comes from the build: new-year.yml starts the deploy of
        # stage at the start of every year, on stage, which the environment github-pages
        # accepts; a run of a schedule has the ref of master.
        workflows = ROOT / ".github" / "workflows"
        new_year = (workflows / "new-year.yml").read_text(encoding="utf-8")
        crons = re.findall(r'^\s*- cron: "([^"]+)"', new_year, flags=re.M)
        self.assertTrue(crons)
        for cron in crons:
            minute, hour, day, month, weekday = cron.split()
            self.assertEqual((day, month, weekday), ("1", "1", "*"), cron)
            self.assertNotEqual(minute, "0", "the start of the hour is when GitHub drops runs")
        self.assertNotIn("timezone:", new_year, "the build reads the year in UTC")
        self.assertIn("gh workflow run stage.yml", new_year)
        self.assertIn("--ref stage", new_year)
        self.assertRegex(new_year, r"(?m)^\s+actions: write")
        stage = (workflows / "stage.yml").read_text(encoding="utf-8")
        self.assertRegex(stage, r"(?m)^\s+workflow_dispatch:")


if __name__ == "__main__":
    unittest.main()
