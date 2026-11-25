"""The deploys of the two sites (CLAUDE.md, Section 1): stage.yml publishes stage on GitHub
Pages; production.yml publishes master on the Worker at theplanet.observer, called by
release.yml and gated by DEPLOY_PRODUCTION; new-year.yml starts both on 1 January, so that
the year of the notice moves on (the owner, 2026-11-25). Standard library only: the
workflows are read as text."""
import os
import re
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
WORKFLOWS = ROOT / ".github" / "workflows"


def workflow(name: str) -> str:
    return (WORKFLOWS / name).read_text(encoding="utf-8")


class NewYearTest(unittest.TestCase):
    def setUp(self):
        self.text = workflow("new-year.yml")

    def test_it_runs_on_the_first_of_january_in_utc(self):
        crons = re.findall(r'^\s*- cron: "([^"]+)"', self.text, flags=re.M)
        self.assertTrue(crons)
        for cron in crons:
            minute, hour, day, month, weekday = cron.split()
            self.assertEqual((day, month, weekday), ("1", "1", "*"), cron)
            self.assertNotEqual(minute, "0", "the start of the hour is when GitHub drops runs")
        self.assertNotIn("timezone:", self.text, "the build reads the year in UTC")

    def test_it_starts_both_deploys_on_their_branches(self):
        # A run of a schedule has the ref of master; github-pages accepts stage only.
        self.assertIn('gh workflow run stage.yml --repo "$GITHUB_REPOSITORY" --ref stage', self.text)
        self.assertIn('gh workflow run production.yml --repo "$GITHUB_REPOSITORY" --ref master', self.text)
        self.assertRegex(self.text, r"(?m)^\s+actions: write")
        for name in ("stage.yml", "production.yml"):
            self.assertRegex(workflow(name), r"(?m)^\s+workflow_dispatch:", name)


class ProductionTest(unittest.TestCase):
    def setUp(self):
        self.text = workflow("production.yml")

    def test_it_deploys_master_only_once_the_owner_allows_it(self):
        self.assertIn("if: github.ref == 'refs/heads/master' && vars.DEPLOY_PRODUCTION == 'true'", self.text)
        self.assertRegex(self.text, r"(?m)^\s+name: production$")
        self.assertIn("run: bash scripts/worker.sh deploy", self.text)

    def test_the_credentials_come_from_the_environment(self):
        for name in ("CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"):
            self.assertIn(f"{name}: ${{{{ secrets.{name} }}}}", self.text)
        wrangler = (ROOT / "wrangler.jsonc").read_text(encoding="utf-8")
        self.assertNotIn("account_id", wrangler)

    def test_every_release_calls_it(self):
        release = workflow("release.yml")
        self.assertIn("uses: ./.github/workflows/production.yml", release)
        self.assertIn("version: ${{ needs.release.outputs.version }}", release)
        self.assertIn("secrets: inherit", release)

    def test_the_deploy_refuses_to_start_without_credentials(self):
        env = {k: v for k, v in os.environ.items() if not k.startswith("CLOUDFLARE_")}
        result = subprocess.run(["bash", str(ROOT / "scripts" / "worker.sh"), "deploy"],
                                env=env, capture_output=True, text=True, timeout=60)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID", result.stderr + result.stdout)


if __name__ == "__main__":
    unittest.main()
