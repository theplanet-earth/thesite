"""The Meshy client, scripts/meshy.py, against a fake API: no network, no key, no credits."""
from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "meshy.py"


def load():
    spec = importlib.util.spec_from_file_location("meshy", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class FakeApi:
    """Answers like the examples of the Meshy documentation; records every request."""

    def __init__(self, rig_status: str = "SUCCEEDED") -> None:
        self.calls: list[tuple[str, str, dict | None]] = []
        self.polls = {"image-to-3d/model-1": ["PENDING", "IN_PROGRESS", "SUCCEEDED"], "rigging/rig-1": ["IN_PROGRESS", rig_status]}

    def __call__(self, method: str, path: str, body: dict | None) -> dict:
        self.calls.append((method, path, body))
        if method == "POST":
            return {"result": {"image-to-3d": "model-1", "rigging": "rig-1"}[path]}
        status = self.polls[path].pop(0)
        if path.startswith("image-to-3d"):
            return {"id": "model-1", "status": status, "progress": 50, "consumed_credits": 30, "task_error": None,
                    "model_urls": {"glb": "https://assets.example.org/model.glb?Expires=1&Signature=s"},
                    "thumbnail_url": "https://assets.example.org/preview.png?Expires=1&Signature=s"}
        if status == "FAILED":
            return {"id": "rig-1", "status": status, "task_error": {"message": "not a biped"}, "result": None}
        return {"id": "rig-1", "status": status, "consumed_credits": 5, "task_error": None, "result": {
            "rigged_character_glb_url": "https://assets.example.org/Character_output.glb?Expires=1&Signature=s",
            "basic_animations": {"walking_glb_url": "https://assets.example.org/walking.glb?Expires=1&Signature=s",
                                 "running_glb_url": ""}}}


class MeshyTest(unittest.TestCase):
    tool = load()

    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)
        self.image = self.dir / "logo.png"
        self.image.write_bytes(b"\x89PNG\r\n\x1a\nfake")

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def run_generate(self, api: FakeApi) -> dict:
        return self.tool.generate(api, self.image, self.dir / "out", fetch=lambda url: url.encode(),
                                  sleep=lambda seconds: None, log=lambda line: None)

    def test_image_to_3d_then_rigging_then_files(self) -> None:
        api = FakeApi()
        provenance = self.run_generate(api)
        method, path, body = api.calls[0]
        self.assertEqual((method, path), ("POST", "image-to-3d"))
        self.assertTrue(body["image_url"].startswith("data:image/png;base64,"))
        self.assertEqual(body["pose_mode"], "t-pose")
        self.assertEqual(body["target_formats"], ["glb"])
        self.assertIn(("POST", "rigging", {"input_task_id": "model-1", "animation_type": "biped"}), api.calls)
        out = self.dir / "out"
        names = sorted(p.name for p in out.iterdir())
        self.assertEqual(names, ["mascot-rigged.glb", "mascot-thumbnail.png", "mascot-walking.glb", "mascot.glb", "provenance.json"])
        self.assertEqual(provenance["image_to_3d"]["credits"], 30)
        self.assertEqual(provenance["rigging"]["credits"], 5)

    def test_provenance_holds_no_signed_address(self) -> None:
        self.run_generate(FakeApi())
        text = (self.dir / "out" / "provenance.json").read_text(encoding="utf-8")
        self.assertNotIn("Signature", text)
        self.assertNotIn("assets.example.org", text)
        self.assertIn("model-1", text)

    def test_failed_task_stops_with_its_message(self) -> None:
        with self.assertRaisesRegex(self.tool.MeshyError, "FAILED: not a biped"):
            self.run_generate(FakeApi(rig_status="FAILED"))

    def test_wait_gives_up_after_the_timeout(self) -> None:
        def pending(method, path, body):
            return {"status": "IN_PROGRESS", "progress": 1}
        with self.assertRaisesRegex(self.tool.MeshyError, "still IN_PROGRESS"):
            self.tool.wait(pending, "image-to-3d/x", interval=10, timeout=30, sleep=lambda s: None, log=lambda l: None)

    def test_without_key_nothing_is_sent(self) -> None:
        env = {k: v for k, v in os.environ.items() if k != "MESHY_API_KEY"}
        result = subprocess.run([sys.executable, str(SCRIPT), "--out", str(self.dir / "out")], env=env, capture_output=True, text=True)
        self.assertEqual(result.returncode, 2)
        self.assertIn("MESHY_API_KEY is not set", result.stderr)
        self.assertFalse((self.dir / "out").exists())

    def test_dry_run_prints_the_requests(self) -> None:
        result = subprocess.run([sys.executable, str(SCRIPT), "--dry-run", "--image", str(self.image)], capture_output=True, text=True)
        self.assertEqual(result.returncode, 0)
        requests = json.loads(result.stdout)
        self.assertEqual(requests["POST image-to-3d"]["target_polycount"], 30000)


if __name__ == "__main__":
    unittest.main()
