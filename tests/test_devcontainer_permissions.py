"""The caution at the top of README.md must list every permission that
.devcontainer/devcontainer.json asks for on the other repositories of the organization,
with its level, so that whoever authorizes a Codespace knows what they grant; and the only
permission written is the one the owner asked for on 2026-11-24 (CLAUDE.md Section 2)."""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def devcontainer() -> dict:
    """devcontainer.json is JSON with comments: drop the lines that are comments only."""
    text = (ROOT / ".devcontainer" / "devcontainer.json").read_text(encoding="utf-8")
    return json.loads(re.sub(r"^\s*//.*$", "", text, flags=re.M))


def caution() -> str:
    """The first block quote of README.md, before the first section."""
    lines = (ROOT / "README.md").read_text(encoding="utf-8").splitlines()
    block = []
    for line in lines[1:]:
        if line.startswith(">"):
            block.append(line)
        elif block and not line.strip():
            break
    return "\n".join(block)


class DevcontainerPermissionsTest(unittest.TestCase):
    def setUp(self):
        repositories = devcontainer()["customizations"]["codespaces"]["repositories"]
        self.assertEqual(list(repositories), ["theplanet-earth/*"])
        self.permissions = repositories["theplanet-earth/*"]["permissions"]
        self.text = caution()

    def test_caution_is_at_the_top(self):
        self.assertTrue(self.text.startswith("> [!CAUTION]"), self.text[:80])

    def test_every_permission_is_listed_with_its_level(self):
        rows = [line for line in self.text.splitlines()
                if line.startswith("> | Every other repository")]
        write_row = next(row for row in rows if "**Write**" in row)
        read_row = next(row for row in rows if "| Read on" in row)
        for name, level in self.permissions.items():
            row = write_row if level == "write" else read_row
            self.assertIn(f"`{name}`", row, f"{name} ({level}) missing from the caution")

    def test_only_issues_are_written(self):
        # The owner's instruction of 2026-11-24: open issues in every repository of the
        # organization; no push to another repository.
        written = sorted(name for name, level in self.permissions.items() if level == "write")
        self.assertEqual(written, ["issues"])
        self.assertEqual(self.permissions["contents"], "read")
        self.assertNotIn("workflows", self.permissions)
        self.assertNotIn("administration", self.permissions)
        self.assertIn("Not granted: write on `contents`, `pull_requests`, `workflows`", self.text)


if __name__ == "__main__":
    unittest.main()
