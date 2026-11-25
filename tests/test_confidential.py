"""Confidentiality guard of scripts/check-confidential.py: path rules, and terms on a
throwaway git repository that holds a copy of the script."""
from __future__ import annotations

import importlib.util
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "check-confidential.py"


def load():
    spec = importlib.util.spec_from_file_location("check_confidential", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class BlockedPathsTest(unittest.TestCase):
    tool = load()

    def test_private_files_are_blocked(self) -> None:
        for name in ("confidential-terms.local", "notes.local.md", ".env", ".env.production",
                     "private/a.pdf", "docs/private/a.pdf", "keys/server.key", "cert.pem", "store.p12"):
            self.assertTrue(self.tool.blocked(name), name)

    def test_ordinary_files_pass(self) -> None:
        for name in (".env.example", "README.md", "src/private_api.py", "docs/keyboard.md"):
            self.assertFalse(self.tool.blocked(name), name)


class TermsTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.repo = Path(self.tmp.name)
        (self.repo / "scripts").mkdir()
        shutil.copy(SCRIPT, self.repo / "scripts" / SCRIPT.name)
        self.git("init", "-q", "-b", "master")
        (self.repo / "confidential-terms.local").write_text("# a comment\nAcme Secret Corp\n", encoding="utf-8")

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def git(self, *args: str) -> None:
        subprocess.run(["git", *args], cwd=self.repo, check=True, capture_output=True)

    def check(self, *args: str) -> subprocess.CompletedProcess:
        return subprocess.run([sys.executable, str(self.repo / "scripts" / SCRIPT.name), *args],
                              cwd=self.repo, capture_output=True, text=True)

    def test_staged_term_is_blocked_without_being_printed(self) -> None:
        (self.repo / "notes.md").write_text("Meeting with acme secret corp.\n", encoding="utf-8")
        self.git("add", "notes.md")
        out = self.check("--staged")
        self.assertEqual(out.returncode, 1)
        self.assertIn("notes.md:1: contains confidential term no. 1", out.stderr)
        self.assertNotIn("acme", (out.stdout + out.stderr).casefold())

    def test_clean_files_pass(self) -> None:
        (self.repo / "notes.md").write_text("Meeting with the client.\n", encoding="utf-8")
        self.git("add", "notes.md")
        self.assertEqual(self.check("--staged").returncode, 0)
        self.assertEqual(self.check("--all").returncode, 0)


if __name__ == "__main__":
    unittest.main()
