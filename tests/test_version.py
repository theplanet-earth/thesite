"""Version rules of scripts/version.py, on throwaway git repositories."""
from __future__ import annotations

import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "version.py"


class VersionTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.repo = Path(self.tmp.name)
        self.git("init", "-q", "-b", "master")
        self.git("config", "user.email", "test@example.org")
        self.git("config", "user.name", "Test")
        self.git("config", "commit.gpgsign", "false")
        self.git("config", "tag.gpgsign", "false")

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def git(self, *args: str) -> str:
        return subprocess.run(["git", *args], cwd=self.repo, check=True, capture_output=True, text=True).stdout

    def commit(self, message: str) -> None:
        (self.repo / "file.txt").write_text(message, encoding="utf-8")
        self.git("add", "file.txt")
        self.git("commit", "-q", "-m", message)

    def version(self, *args: str) -> str:
        result = subprocess.run([sys.executable, str(SCRIPT), *args], cwd=self.repo, capture_output=True, text=True)
        return result.stdout.strip()

    def test_first_release_is_0_1_0(self) -> None:
        self.commit("feat: first capability")
        self.assertEqual(self.version("next"), "0.1.0")
        self.assertEqual(self.version("current"), "0.1.0-dev")

    def test_minor_for_feat_patch_for_everything_else(self) -> None:
        self.commit("feat: first capability")
        self.git("tag", "v0.1.0")
        self.assertEqual(self.version("current"), "0.1.0")
        self.commit("fix: typo")
        self.assertEqual(self.version("next"), "0.1.1")
        self.commit("docs: explain the setup")
        self.commit("refactor: split the module")
        self.assertEqual(self.version("next"), "0.1.1")
        self.commit("feat: new command")
        self.assertEqual(self.version("next"), "0.2.0")

    def test_major_is_never_automatic(self) -> None:
        self.commit("feat: first capability")
        self.git("tag", "v0.3.2")
        self.commit("feat!: change the interface\n\nBREAKING CHANGE: new interface")
        self.assertEqual(self.version("next"), "0.4.0")
        self.assertEqual(self.version("next", "--bump", "major"), "1.0.0")

    def test_squashed_commit_counts_body_lines(self) -> None:
        self.commit("feat: first capability")
        self.git("tag", "v1.0.0")
        self.commit("chore: merge work\n\nfix: typo\nfeat: new build step\n- feat: not a line start")
        self.assertEqual(self.version("next"), "1.1.0")
        notes = self.version("notes")
        self.assertIn("### Features", notes)
        self.assertIn("### Fixes", notes)
        self.assertIn("new build step", notes)
        self.assertNotIn("not a line start", notes)

    def test_unconventional_subject_is_listed_as_other(self) -> None:
        self.commit("feat: first capability")
        self.git("tag", "v0.1.0")
        self.commit("Update the readme")
        self.assertEqual(self.version("next"), "0.1.1")
        self.assertIn("### Other changes", self.version("notes"))

    def test_no_changes_since_tag(self) -> None:
        self.commit("feat: first capability")
        self.git("tag", "v0.1.0")
        self.assertEqual(self.version("next"), "")


if __name__ == "__main__":
    unittest.main()
