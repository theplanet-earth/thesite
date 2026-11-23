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

    def commit(self, message: str, name: str = "file.txt") -> None:
        (self.repo / name).write_text(message, encoding="utf-8")
        self.git("add", name)
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

    def test_squash_merge_then_merge_back_leaves_out_released_commits(self) -> None:
        self.commit("feat: first capability")
        self.git("tag", "v0.1.0")
        self.git("checkout", "-q", "-b", "dev")
        self.commit("feat: released capability", "a.txt")
        self.commit("fix: released fix", "b.txt")
        self.git("checkout", "-q", "master")
        self.git("merge", "-q", "--squash", "dev")
        self.git("commit", "-q", "-m", "feat: released capability (#1)")
        self.git("tag", "v0.2.0")
        self.git("checkout", "-q", "dev")
        self.commit("docs: written before the merge back", "c.txt")
        self.git("merge", "-q", "--no-ff", "-m", "Merge branch 'master' into dev", "master")
        self.assertEqual(self.version("next"), "0.2.1")
        self.commit("fix: written after the merge back", "d.txt")
        self.assertEqual(self.version("next"), "0.2.1")
        notes = self.version("notes")
        self.assertIn("before the merge back", notes)
        self.assertIn("after the merge back", notes)
        self.assertNotIn("released", notes)
        # The merge commit a pull request is checked on: master first, dev second.
        self.git("checkout", "-q", "master")
        self.git("merge", "-q", "--no-ff", "-m", "Merge dev", "dev")
        self.assertEqual(self.version("next"), "0.2.1")

    def test_chain_dev_stage_master_counts_each_change_once(self) -> None:
        self.commit("feat: first capability")
        self.git("tag", "v0.1.0")
        self.git("branch", "stage")
        self.git("checkout", "-q", "-b", "dev")
        self.commit("feat: released capability", "a.txt")
        self.commit("fix: released fix", "b.txt")
        # dev into stage, then stage back into dev.
        self.git("checkout", "-q", "stage")
        self.git("merge", "-q", "--squash", "dev")
        self.git("commit", "-q", "-m", "feat: released capability (#1)")
        self.git("checkout", "-q", "dev")
        self.git("merge", "-q", "--no-ff", "-m", "Merge branch 'stage' into dev", "stage")
        self.commit("fix: waiting on stage", "c.txt")
        self.git("checkout", "-q", "stage")
        self.git("merge", "-q", "--squash", "dev")
        self.git("commit", "-q", "-m", "fix: waiting on stage (#2)")
        self.git("checkout", "-q", "dev")
        self.git("merge", "-q", "--no-ff", "-m", "Merge branch 'stage' into dev", "stage")
        # Before stage reaches master, each change counts once, through stage.
        self.assertEqual(self.version("next"), "0.2.0")
        notes = self.version("notes")
        self.assertIn("released capability (#1)", notes)
        self.assertNotIn("released fix", notes)
        self.assertEqual(notes.count("waiting on stage"), 1)
        # stage into master (released), then master back into stage and stage into dev.
        self.git("checkout", "-q", "master")
        self.git("merge", "-q", "--squash", "stage")
        self.git("commit", "-q", "-m", "feat: released capability (#3)")
        self.git("tag", "v0.2.0")
        self.git("checkout", "-q", "stage")
        self.git("merge", "-q", "--no-ff", "-m", "Merge branch 'master' into stage", "master")
        self.git("checkout", "-q", "dev")
        self.commit("docs: written before the merge back", "d.txt")
        self.git("merge", "-q", "--no-ff", "-m", "Merge branch 'stage' into dev", "stage")
        self.commit("fix: written after the merge back", "e.txt")
        self.assertEqual(self.version("next"), "0.2.1")
        notes = self.version("notes")
        self.assertIn("before the merge back", notes)
        self.assertIn("after the merge back", notes)
        self.assertNotIn("released", notes)
        self.assertNotIn("waiting on stage", notes)
        # The merge commit a pull request from dev to stage is checked on.
        self.git("checkout", "-q", "stage")
        self.git("merge", "-q", "--no-ff", "-m", "Merge dev", "dev")
        self.assertEqual(self.version("next"), "0.2.1")

    def test_branch_merged_into_dev_with_a_merge_commit_counts_its_commits(self) -> None:
        self.commit("feat: first capability")
        self.git("tag", "v0.1.0")
        self.git("checkout", "-q", "-b", "dev")
        self.commit("fix: on dev", "a.txt")
        self.git("checkout", "-q", "-b", "work")
        self.commit("feat: on a branch of work", "b.txt")
        self.git("checkout", "-q", "dev")
        self.commit("docs: on dev meanwhile", "c.txt")
        self.git("merge", "-q", "--no-ff", "-m", "Merge branch 'work' into dev", "work")
        self.assertEqual(self.version("next"), "0.2.0")
        notes = self.version("notes")
        for text in ("on dev", "on a branch of work", "on dev meanwhile"):
            self.assertIn(text, notes)

    def test_merge_back_keeps_work_that_master_does_not_hold(self) -> None:
        self.commit("feat: first capability")
        self.git("tag", "v0.1.0")
        self.git("checkout", "-q", "-b", "dev")
        self.commit("feat: unreleased capability", "a.txt")
        self.git("checkout", "-q", "master")
        self.commit("fix: hotfix on master", "b.txt")
        self.git("tag", "v0.1.1")
        self.git("checkout", "-q", "dev")
        self.git("merge", "-q", "--no-ff", "-m", "Merge branch 'master' into dev", "master")
        self.assertEqual(self.version("next"), "0.2.0")
        self.assertIn("unreleased capability", self.version("notes"))

    def test_no_changes_since_tag(self) -> None:
        self.commit("feat: first capability")
        self.git("tag", "v0.1.0")
        self.assertEqual(self.version("next"), "")


if __name__ == "__main__":
    unittest.main()
