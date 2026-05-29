# Mobile Simulator Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build cross-project tooling that gives Claude semantic (accessibility-tree) visibility + precise interaction on iOS simulators and Android emulators, and hard-gates "UI task complete" claims behind a passing simulator verification.

**Architecture:** A Python toolkit (`mobile_verify`) holds all deterministic, testable logic — UI-diff hashing, a11y-hierarchy parsing, element matching, proof read/write, and the Stop-gate evaluation. A thin shell wrapper exposes it as the `gate-mobile-verify.sh` Stop hook. A `mobile-verifier` sub-agent (prompt) drives devices and calls the toolkit; a `verify-on-simulator` skill (prompt) orchestrates from the main thread. All artifacts live at user level (`~/.claude/`) and self-detect mobile repos so they no-op elsewhere.

**Tech Stack:** Python 3.9 (stdlib only: `argparse`, `json`, `xml.etree`, `hashlib`, `subprocess`, `unittest`), Bash wrappers, `xcrun simctl` + `idb` (iOS), `adb` + `emulator` (Android), Claude Code agents/skills/hooks.

---

## Scope Boundary (read before Task 1)

The `Stop` hook cannot read conversation/task intent — it only sees the git diff + proof file. Therefore:

- **Hook-enforced (mechanical):** repo is mobile · a UI-affecting diff exists · a proof exists whose `ui_diff_hash` matches the current diff · proof's `app.name`/`app.version` match `package.json` · `passed_platforms` covers the project-policy `required_platforms` · proof is not degraded-without-acknowledgement.
- **Agent/skill-enforced (semantic):** choosing the *correct* target screens + assertions from the diff and recording them in the proof.

The project-policy `required_platforms` lives in `.claude/mobile-verify/config.json` (default `["ios","android"]`), so "iOS and Android by default" is a deterministic policy the hook can check rather than per-task inference.

## File Structure

```
~/.claude/tools/mobile-verify/
  mobile_verify/
    __init__.py          # package marker
    __main__.py          # `python -m mobile_verify` -> cli.main()
    config.py            # default UI globs + project config.json override + required_platforms policy
    diffhash.py          # compute_ui_diff_hash(repo_root, globs): tracked diff + untracked content
    proof.py             # proof read/write/validate, evaluate(), app identity, head commit
    inspect.py           # parse iOS idb JSON + Android uiautomator XML -> nodes; find(); center()
    gate.py              # detect_mobile_repo(); run_gate(stdin) -> emits block JSON or no-ops
    cli.py               # argparse dispatch: gate|hash|parse|find|write-proof
  tests/
    __init__.py
    test_diffhash.py
    test_proof.py
    test_inspect.py
    test_gate.py
    fixtures/
      android_basic.xml          # one unambiguous + nested nodes
      android_ambiguous.xml      # two nodes with same label
      android_offscreen.xml      # node whose bounds are below the screen
      ios_describe.json          # idb ui describe-all sample
  mv                       # executable: PYTHONPATH shim -> python -m mobile_verify "$@"
  run-tests.sh             # python3 -m unittest discover -s tests

~/.claude/hooks/
  gate-mobile-verify.sh    # Stop-hook entry: exec mv gate (reads stdin)

~/.claude/agents/
  mobile-verifier.md       # executor sub-agent (tools: Bash, Read)

~/.claude/skills/verify-on-simulator/
  SKILL.md                 # orchestrator skill (main thread)

# Per project (created at first run / by Task 16):
<repo>/.claude/mobile-verify/last-pass.json   # gate proof (git-ignored)
<repo>/.claude/mobile-verify/config.json       # optional policy/path override
```

Each Python module has one responsibility and is unit-tested in isolation. The agent/skill prompts contain no logic that isn't in the toolkit; they orchestrate and call `mv`.

---

## Task 1: Install prerequisites and scaffold the package

**Files:**
- Create: `~/.claude/tools/mobile-verify/mobile_verify/__init__.py`
- Create: `~/.claude/tools/mobile-verify/mobile_verify/__main__.py`
- Create: `~/.claude/tools/mobile-verify/tests/__init__.py`
- Create: `~/.claude/tools/mobile-verify/run-tests.sh`

- [ ] **Step 1: Install iOS + Android tooling**

```bash
brew install facebook/fb/idb-companion
pipx install fb-idb || python3 -m pip install --user fb-idb
brew install --cask android-platform-tools
# Optional but recommended: hardened XML parsing for uiautomator dumps.
python3 -m pip install --user defusedxml
```

- [ ] **Step 2: Verify the tools resolve**

```bash
idb --version; idb_companion --version; adb --version; xcrun simctl help >/dev/null && echo "simctl ok"
```
Expected: each prints a version (or `simctl ok`). If `idb`/`adb` are still missing, note it — Task 17/18 will degrade, but the toolkit (Tasks 2–13) does not depend on them.

- [ ] **Step 3: Create package skeleton**

```bash
mkdir -p ~/.claude/tools/mobile-verify/mobile_verify ~/.claude/tools/mobile-verify/tests/fixtures
```

`~/.claude/tools/mobile-verify/mobile_verify/__init__.py`:
```python
"""mobile_verify: deterministic toolkit for mobile simulator verification."""
```

`~/.claude/tools/mobile-verify/mobile_verify/__main__.py`:
```python
import sys

from mobile_verify.cli import main

if __name__ == "__main__":
    sys.exit(main())
```

`~/.claude/tools/mobile-verify/tests/__init__.py`:
```python
```

`~/.claude/tools/mobile-verify/run-tests.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PYTHONPATH="$(pwd)" python3 -m unittest discover -s tests -p 'test_*.py' -v
```

- [ ] **Step 4: Make the runner executable and confirm discovery works**

```bash
chmod +x ~/.claude/tools/mobile-verify/run-tests.sh
~/.claude/tools/mobile-verify/run-tests.sh
```
Expected: `Ran 0 tests` (no tests yet) and exit 0.

- [ ] **Step 5: Commit**

```bash
cd ~/.claude/tools/mobile-verify
git init -q 2>/dev/null || true   # only if you choose to version ~/.claude; otherwise skip
echo "Scaffold created (not necessarily a git repo at ~/.claude)."
```
Note: `~/.claude` may not be a git repo. If it isn't, skip the commit step here; the repo-side commits in this plan happen in the project repo for the spec/plan docs only.

---

## Task 2: `diffhash.py` — UI diff hash over tracked + untracked files

**Files:**
- Create: `~/.claude/tools/mobile-verify/mobile_verify/diffhash.py`
- Test: `~/.claude/tools/mobile-verify/tests/test_diffhash.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_diffhash.py`:
```python
from __future__ import annotations

import os
import subprocess
import tempfile
import unittest

from mobile_verify.diffhash import compute_ui_diff_hash

GLOBS = ["src/app/**", "src/components/**", "package.json"]


def _git(repo, *args):
    subprocess.run(["git", *args], cwd=repo, check=True,
                   capture_output=True, text=True)


def _write(repo, rel, content):
    path = os.path.join(repo, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        fh.write(content)


class DiffHashTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        _git(self.dir, "init")
        _git(self.dir, "config", "user.email", "t@t.t")
        _git(self.dir, "config", "user.name", "t")
        _write(self.dir, "src/app/index.tsx", "export default 1;\n")
        _write(self.dir, "README.md", "readme\n")
        _git(self.dir, "add", "-A")
        _git(self.dir, "commit", "-m", "init")

    def test_clean_tree_returns_empty(self):
        self.assertEqual(compute_ui_diff_hash(self.dir, GLOBS), "")

    def test_tracked_ui_change_produces_hash(self):
        _write(self.dir, "src/app/index.tsx", "export default 2;\n")
        self.assertNotEqual(compute_ui_diff_hash(self.dir, GLOBS), "")

    def test_non_ui_change_is_ignored(self):
        _write(self.dir, "README.md", "changed\n")
        self.assertEqual(compute_ui_diff_hash(self.dir, GLOBS), "")

    def test_untracked_ui_file_is_included(self):
        _write(self.dir, "src/components/New.tsx", "export const x = 1;\n")
        self.assertNotEqual(compute_ui_diff_hash(self.dir, GLOBS), "")

    def test_hash_is_stable_for_same_state(self):
        _write(self.dir, "src/app/index.tsx", "export default 3;\n")
        first = compute_ui_diff_hash(self.dir, GLOBS)
        second = compute_ui_diff_hash(self.dir, GLOBS)
        self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: FAIL — `ModuleNotFoundError: No module named 'mobile_verify.diffhash'`.

- [ ] **Step 3: Implement `diffhash.py`**

`mobile_verify/diffhash.py`:
```python
from __future__ import annotations

import hashlib
import os
import subprocess
from typing import List


def _pathspecs(globs: List[str]) -> List[str]:
    return [":(glob)%s" % g for g in globs]


def _run(args: List[str], cwd: str) -> str:
    proc = subprocess.run(args, cwd=cwd, capture_output=True, text=True)
    return proc.stdout if proc.returncode == 0 else ""


def compute_ui_diff_hash(repo_root: str, globs: List[str]) -> str:
    """Hash of UI-affecting changes (tracked diff vs HEAD + untracked content).

    Returns "" when there is no UI-affecting change.
    """
    specs = _pathspecs(globs)
    patch = _run(["git", "diff", "HEAD", "--", *specs], repo_root)
    others = _run(
        ["git", "ls-files", "--others", "--exclude-standard", "--", *specs],
        repo_root,
    )
    untracked = sorted(p for p in others.splitlines() if p.strip())

    parts: List[str] = []
    if patch.strip():
        parts.append("PATCH\n" + patch)
    for rel in untracked:
        abs_path = os.path.join(repo_root, rel)
        try:
            with open(abs_path, "rb") as fh:
                digest = hashlib.sha256(fh.read()).hexdigest()
        except OSError:
            continue
        parts.append("UNTRACKED %s %s" % (rel, digest))

    if not parts:
        return ""
    blob = "\n".join(parts).encode("utf-8", "replace")
    return hashlib.sha256(blob).hexdigest()
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: PASS — 5 tests in `DiffHashTest`.

- [ ] **Step 5: Commit** (project repo holds only docs; toolkit lives in `~/.claude`. If you version `~/.claude`, commit there; otherwise this step is a no-op checkpoint.)

---

## Task 3: `config.py` — default globs + project policy override

**Files:**
- Create: `~/.claude/tools/mobile-verify/mobile_verify/config.py`
- Test: `~/.claude/tools/mobile-verify/tests/test_config.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_config.py`:
```python
from __future__ import annotations

import json
import os
import tempfile
import unittest

from mobile_verify.config import load_config, DEFAULT_REQUIRED_PLATFORMS


class ConfigTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def test_defaults_when_no_file(self):
        cfg = load_config(self.dir)
        self.assertEqual(cfg["required_platforms"], DEFAULT_REQUIRED_PLATFORMS)
        self.assertTrue(cfg["require_semantic"])
        self.assertIn("src/app/**", cfg["ui_globs"])

    def test_project_override_merges_known_keys(self):
        cfgdir = os.path.join(self.dir, ".claude", "mobile-verify")
        os.makedirs(cfgdir)
        with open(os.path.join(cfgdir, "config.json"), "w") as fh:
            json.dump({"required_platforms": ["ios"], "unknown": 1}, fh)
        cfg = load_config(self.dir)
        self.assertEqual(cfg["required_platforms"], ["ios"])
        self.assertNotIn("unknown", cfg)

    def test_malformed_file_falls_back_to_defaults(self):
        cfgdir = os.path.join(self.dir, ".claude", "mobile-verify")
        os.makedirs(cfgdir)
        with open(os.path.join(cfgdir, "config.json"), "w") as fh:
            fh.write("{ not json")
        cfg = load_config(self.dir)
        self.assertEqual(cfg["required_platforms"], DEFAULT_REQUIRED_PLATFORMS)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: FAIL — `No module named 'mobile_verify.config'`.

- [ ] **Step 3: Implement `config.py`**

`mobile_verify/config.py`:
```python
from __future__ import annotations

import json
import os
from typing import Any, Dict, List

DEFAULT_UI_GLOBS: List[str] = [
    "src/app/**", "app/**", "src/components/**", "components/**",
    "src/constants/**", "src/hooks/**", "src/stores/**", "src/navigation/**",
    "assets/**",
    "app.json", "app.config.js", "app.config.ts", "app.config.mjs",
    "package.json", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "ios/**", "android/**",
]

DEFAULT_REQUIRED_PLATFORMS: List[str] = ["ios", "android"]


def load_config(repo_root: str) -> Dict[str, Any]:
    cfg: Dict[str, Any] = {
        "ui_globs": list(DEFAULT_UI_GLOBS),
        "required_platforms": list(DEFAULT_REQUIRED_PLATFORMS),
        "require_semantic": True,
    }
    path = os.path.join(repo_root, ".claude", "mobile-verify", "config.json")
    if os.path.isfile(path):
        try:
            with open(path) as fh:
                user = json.load(fh)
        except (OSError, ValueError):
            return cfg
        if isinstance(user, dict):
            for key in list(cfg.keys()):
                if key in user:
                    cfg[key] = user[key]
    return cfg
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: PASS — 3 tests in `ConfigTest`.

- [ ] **Step 5: Commit** (checkpoint)

---

## Task 4: `proof.py` — proof read/write/validate, evaluate, identity

**Files:**
- Create: `~/.claude/tools/mobile-verify/mobile_verify/proof.py`
- Test: `~/.claude/tools/mobile-verify/tests/test_proof.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_proof.py`:
```python
from __future__ import annotations

import json
import os
import tempfile
import unittest

from mobile_verify import proof as P


def _valid_proof():
    return {
        "schema_version": 1,
        "ui_diff_hash": "abc",
        "app": {"name": "demo", "version": "1.0.0"},
        "required_platforms": ["ios", "android"],
        "passed_platforms": ["ios", "android"],
        "targets": [{"id": "t", "route": "/t", "assertions": []}],
        "timestamp": "2026-05-29T00:00:00+00:00",
        "degraded": False,
    }


POLICY = {"required_platforms": ["ios", "android"], "require_semantic": True}
APP = {"name": "demo", "version": "1.0.0"}


class ProofIOTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def test_validate_rejects_bad_schema(self):
        bad = _valid_proof()
        bad["schema_version"] = 2
        self.assertTrue(P.validate_proof(bad))

    def test_validate_accepts_good(self):
        self.assertEqual(P.validate_proof(_valid_proof()), [])

    def test_write_then_load_roundtrip(self):
        P.write_proof(self.dir, _valid_proof())
        loaded = P.load_proof(self.dir)
        self.assertEqual(loaded["ui_diff_hash"], "abc")

    def test_write_rejects_invalid(self):
        with self.assertRaises(ValueError):
            P.write_proof(self.dir, {"schema_version": 9})

    def test_load_missing_returns_none(self):
        self.assertIsNone(P.load_proof(self.dir))


class EvaluateTest(unittest.TestCase):
    def test_pass_when_everything_matches(self):
        ok, _ = P.evaluate(_valid_proof(), "abc", APP, POLICY)
        self.assertTrue(ok)

    def test_block_when_hash_stale(self):
        ok, reason = P.evaluate(_valid_proof(), "DIFFERENT", APP, POLICY)
        self.assertFalse(ok)
        self.assertIn("stale", reason)

    def test_block_when_no_proof(self):
        ok, reason = P.evaluate(None, "abc", APP, POLICY)
        self.assertFalse(ok)
        self.assertIn("no verification proof", reason)

    def test_block_when_platform_missing(self):
        pf = _valid_proof()
        pf["passed_platforms"] = ["ios"]
        ok, reason = P.evaluate(pf, "abc", APP, POLICY)
        self.assertFalse(ok)
        self.assertIn("android", reason)

    def test_block_when_app_mismatch(self):
        ok, reason = P.evaluate(_valid_proof(), "abc",
                                {"name": "other", "version": "1.0.0"}, POLICY)
        self.assertFalse(ok)
        self.assertIn("different app", reason)

    def test_block_when_degraded_without_ack(self):
        pf = _valid_proof()
        pf["degraded"] = True
        ok, reason = P.evaluate(pf, "abc", APP, POLICY)
        self.assertFalse(ok)
        self.assertIn("degraded", reason)

    def test_pass_when_degraded_acknowledged(self):
        pf = _valid_proof()
        pf["degraded"] = True
        pf["degraded_acknowledged"] = True
        ok, _ = P.evaluate(pf, "abc", APP, POLICY)
        self.assertTrue(ok)

    def test_current_app_identity_reads_package_json(self):
        with open(os.path.join(self.dir if hasattr(self, "dir") else ".",
                                "package.json"), "w"):
            pass


if __name__ == "__main__":
    unittest.main()
```

Remove the dangling `test_current_app_identity_reads_package_json` stub (it was illustrative); replace with this focused test appended inside `EvaluateTest` is unnecessary — instead add a dedicated class:

```python
class IdentityTest(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()

    def test_current_app_identity_reads_package_json(self):
        with open(os.path.join(self.dir, "package.json"), "w") as fh:
            json.dump({"name": "demo", "version": "9.9.9"}, fh)
        ident = P.current_app_identity(self.dir)
        self.assertEqual(ident, {"name": "demo", "version": "9.9.9"})
```

(Delete the broken stub method shown above before running.)

- [ ] **Step 2: Run tests, verify they fail**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: FAIL — `No module named 'mobile_verify.proof'`.

- [ ] **Step 3: Implement `proof.py`**

`mobile_verify/proof.py`:
```python
from __future__ import annotations

import json
import os
import subprocess
from typing import Any, Dict, List, Optional, Tuple

SCHEMA_VERSION = 1
PROOF_REL = os.path.join(".claude", "mobile-verify", "last-pass.json")

_REQUIRED_FIELDS = (
    "ui_diff_hash", "app", "required_platforms",
    "passed_platforms", "targets", "timestamp",
)


def proof_path(repo_root: str) -> str:
    return os.path.join(repo_root, PROOF_REL)


def load_proof(repo_root: str) -> Optional[Dict[str, Any]]:
    path = proof_path(repo_root)
    if not os.path.isfile(path):
        return None
    try:
        with open(path) as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return None


def validate_proof(proof: Dict[str, Any]) -> List[str]:
    errors: List[str] = []
    if proof.get("schema_version") != SCHEMA_VERSION:
        errors.append("schema_version must be %d" % SCHEMA_VERSION)
    for key in _REQUIRED_FIELDS:
        if key not in proof:
            errors.append("missing field: %s" % key)
    if "app" in proof and not isinstance(proof["app"], dict):
        errors.append("app must be an object")
    return errors


def write_proof(repo_root: str, proof: Dict[str, Any]) -> str:
    errors = validate_proof(proof)
    if errors:
        raise ValueError("invalid proof: " + "; ".join(errors))
    path = proof_path(repo_root)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        json.dump(proof, fh, indent=2, sort_keys=True)
    return path


def evaluate(
    proof: Optional[Dict[str, Any]],
    current_hash: str,
    current_app: Dict[str, Any],
    policy: Dict[str, Any],
) -> Tuple[bool, str]:
    if not proof:
        return False, "no verification proof found"
    errors = validate_proof(proof)
    if errors:
        return False, "proof invalid: " + "; ".join(errors)
    if proof.get("ui_diff_hash") != current_hash:
        return False, "proof is stale: UI has changed since last verification"
    app = proof.get("app", {})
    if app.get("name") != current_app.get("name") or \
            app.get("version") != current_app.get("version"):
        return False, "proof is for a different app/version"
    required = set(policy.get("required_platforms", []))
    passed = set(proof.get("passed_platforms", []))
    missing = required - passed
    if missing:
        return False, "platforms not verified: " + ", ".join(sorted(missing))
    if (policy.get("require_semantic", True)
            and proof.get("degraded")
            and not proof.get("degraded_acknowledged")):
        return False, ("verification ran in degraded (screenshot-only) mode "
                       "without acknowledgement")
    return True, "verified"


def head_commit(repo_root: str) -> Optional[str]:
    proc = subprocess.run(["git", "rev-parse", "HEAD"], cwd=repo_root,
                          capture_output=True, text=True)
    return proc.stdout.strip() if proc.returncode == 0 else None


def current_app_identity(repo_root: str) -> Dict[str, Any]:
    pkg: Dict[str, Any] = {}
    path = os.path.join(repo_root, "package.json")
    if os.path.isfile(path):
        try:
            with open(path) as fh:
                pkg = json.load(fh)
        except (OSError, ValueError):
            pkg = {}
    return {"name": pkg.get("name"), "version": pkg.get("version")}
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: PASS — `ProofIOTest`, `EvaluateTest`, `IdentityTest`.

- [ ] **Step 5: Commit** (checkpoint)

---

## Task 5: `inspect.py` — hierarchy parsing + element matching

**Files:**
- Create: `~/.claude/tools/mobile-verify/mobile_verify/inspect.py`
- Create fixtures: `tests/fixtures/android_basic.xml`, `android_ambiguous.xml`, `android_offscreen.xml`, `ios_describe.json`
- Test: `~/.claude/tools/mobile-verify/tests/test_inspect.py`

- [ ] **Step 1: Create fixtures**

`tests/fixtures/android_basic.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<hierarchy rotation="0">
  <node class="android.widget.FrameLayout" bounds="[0,0][1080,2400]">
    <node resource-id="com.demo:id/bookmarks_tab" class="android.widget.Button"
          text="Bookmarks" content-desc="Bookmarks" enabled="true"
          clickable="true" bounds="[810,2280][1080,2400]"/>
    <node resource-id="com.demo:id/title" class="android.widget.TextView"
          text="My Bookmarks" enabled="true" clickable="false"
          bounds="[40,200][700,280]"/>
  </node>
</hierarchy>
```

`tests/fixtures/android_ambiguous.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<hierarchy rotation="0">
  <node class="android.widget.FrameLayout" bounds="[0,0][1080,2400]">
    <node class="android.widget.TextView" text="Save" enabled="true"
          clickable="true" bounds="[40,400][300,480]"/>
    <node class="android.widget.TextView" text="Save" enabled="true"
          clickable="true" bounds="[40,600][300,680]"/>
  </node>
</hierarchy>
```

`tests/fixtures/android_offscreen.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<hierarchy rotation="0">
  <node class="android.widget.FrameLayout" bounds="[0,0][1080,2400]">
    <node resource-id="com.demo:id/footer" class="android.widget.TextView"
          text="Footer" enabled="true" clickable="true"
          bounds="[40,2600][1040,2700]"/>
  </node>
</hierarchy>
```

`tests/fixtures/ios_describe.json`:
```json
[
  {"AXLabel": "Bookmarks", "type": "Button", "AXUniqueId": "bookmarks-tab",
   "frame": {"x": 300, "y": 760, "width": 80, "height": 50}},
  {"AXLabel": "My Bookmarks", "type": "StaticText",
   "frame": {"x": 20, "y": 120, "width": 200, "height": 30}},
  {"AXLabel": "Save", "type": "Button",
   "AXFrame": "{{20, 200}, {120, 44}}"}
]
```

- [ ] **Step 2: Write the failing tests**

`tests/test_inspect.py`:
```python
from __future__ import annotations

import os
import unittest

from mobile_verify import inspect as I

FIX = os.path.join(os.path.dirname(__file__), "fixtures")


def _read(name):
    with open(os.path.join(FIX, name)) as fh:
        return fh.read()


class AndroidParseTest(unittest.TestCase):
    def test_parses_bounds_and_ids(self):
        nodes = I.parse_android(_read("android_basic.xml"))
        tab = next(n for n in nodes
                   if n["resource_id"] == "com.demo:id/bookmarks_tab")
        self.assertEqual(tab["frame"], {"x": 810, "y": 2280, "w": 270, "h": 120})
        self.assertEqual(tab["label"], "Bookmarks")


class IosParseTest(unittest.TestCase):
    def test_parses_frame_dict_and_axframe_string(self):
        nodes = I.parse_ios(_read("ios_describe.json"))
        save = next(n for n in nodes if n["label"] == "Save")
        self.assertEqual(save["frame"], {"x": 20, "y": 200, "w": 120, "h": 44})


class CenterTest(unittest.TestCase):
    def test_center_of_frame(self):
        self.assertEqual(I.center({"x": 10, "y": 20, "w": 100, "h": 40}),
                         {"x": 60, "y": 40})


class FindTest(unittest.TestCase):
    def test_exact_resource_id(self):
        nodes = I.parse_android(_read("android_basic.xml"))
        res = I.find(nodes, resource_id="com.demo:id/bookmarks_tab")
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["tier"], "resource_id")
        self.assertEqual(res["center"], {"x": 945, "y": 2340})

    def test_exact_text(self):
        nodes = I.parse_ios(_read("ios_describe.json"))
        res = I.find(nodes, text="Bookmarks")
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["tier"], "text")

    def test_label_scoped_by_class(self):
        nodes = I.parse_android(_read("android_basic.xml"))
        res = I.find(nodes, label="my bookmarks",
                     klass="android.widget.TextView")
        self.assertEqual(res["status"], "ok")
        self.assertEqual(res["tier"], "label")

    def test_ambiguous_match_fails(self):
        nodes = I.parse_android(_read("android_ambiguous.xml"))
        res = I.find(nodes, text="Save")
        self.assertEqual(res["status"], "ambiguous")
        self.assertEqual(len(res["matches"]), 2)

    def test_not_found(self):
        nodes = I.parse_android(_read("android_basic.xml"))
        res = I.find(nodes, resource_id="com.demo:id/nope")
        self.assertEqual(res["status"], "not_found")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: FAIL — `No module named 'mobile_verify.inspect'`.

- [ ] **Step 4: Implement `inspect.py`**

`mobile_verify/inspect.py`:
```python
from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

# Prefer defusedxml (hardened against XXE / billion-laughs) when installed;
# fall back to stdlib so the toolkit keeps a zero-hard-dependency footprint.
# Input is a uiautomator dump from an emulator we control, but parsing
# defensively costs nothing.
try:
    from defusedxml.ElementTree import fromstring as _xml_fromstring
except ImportError:  # pragma: no cover - exercised only without defusedxml
    from xml.etree.ElementTree import fromstring as _xml_fromstring

_BOUNDS = re.compile(r"\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]")
_NUM = re.compile(r"-?\d+\.?\d*")


def _norm(value: Optional[str]) -> str:
    return " ".join((value or "").split()).strip().lower()


def parse_android(xml_text: str) -> List[Dict[str, Any]]:
    root = _xml_fromstring(xml_text)
    nodes: List[Dict[str, Any]] = []
    for el in root.iter("node"):
        frame = None
        match = _BOUNDS.match(el.get("bounds", ""))
        if match:
            x1, y1, x2, y2 = (int(v) for v in match.groups())
            frame = {"x": x1, "y": y1, "w": x2 - x1, "h": y2 - y1}
        text = el.get("text") or None
        desc = el.get("content-desc") or None
        nodes.append({
            "platform": "android",
            "resource_id": el.get("resource-id") or None,
            "label": text or desc,
            "text": text,
            "content_desc": desc,
            "class": el.get("class") or None,
            "frame": frame,
            "enabled": el.get("enabled") == "true",
            "clickable": el.get("clickable") == "true",
        })
    return nodes


def _ios_frame(el: Dict[str, Any]) -> Optional[Dict[str, int]]:
    fr = el.get("frame")
    if isinstance(fr, dict):
        return {"x": int(fr.get("x", 0)), "y": int(fr.get("y", 0)),
                "w": int(fr.get("width", 0)), "h": int(fr.get("height", 0))}
    ax = el.get("AXFrame")
    if isinstance(ax, str):
        nums = _NUM.findall(ax)
        if len(nums) >= 4:
            x, y, w, h = (float(n) for n in nums[:4])
            return {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}
    return None


def parse_ios(json_text: str) -> List[Dict[str, Any]]:
    data = json.loads(json_text)
    if isinstance(data, dict):
        data = data.get("elements") or data.get("children") or [data]
    nodes: List[Dict[str, Any]] = []
    for el in data:
        if not isinstance(el, dict):
            continue
        label = el.get("AXLabel") or el.get("label") or el.get("title")
        nodes.append({
            "platform": "ios",
            "resource_id": el.get("AXUniqueId") or el.get("identifier") or None,
            "label": label or None,
            "text": label or None,
            "content_desc": el.get("AXValue") or el.get("value") or None,
            "class": el.get("type") or el.get("role") or None,
            "frame": _ios_frame(el),
            "enabled": bool(el.get("enabled", True)),
            "clickable": True,
        })
    return nodes


def center(frame: Optional[Dict[str, int]]) -> Optional[Dict[str, int]]:
    if not frame:
        return None
    return {"x": int(frame["x"] + frame["w"] / 2),
            "y": int(frame["y"] + frame["h"] / 2)}


def find(
    nodes: List[Dict[str, Any]],
    resource_id: Optional[str] = None,
    text: Optional[str] = None,
    label: Optional[str] = None,
    klass: Optional[str] = None,
) -> Dict[str, Any]:
    """Match by precedence: resource_id -> text/desc -> normalized label.

    Returns {status, tier, matches, node, center}. status is one of
    ok | ambiguous | not_found.
    """
    matches: List[Dict[str, Any]] = []
    tier: Optional[str] = None

    if resource_id:
        tier = "resource_id"
        matches = [n for n in nodes if n.get("resource_id") == resource_id]
    if not matches and text:
        tier = "text"
        matches = [n for n in nodes
                   if n.get("text") == text or n.get("content_desc") == text]
    if not matches and label:
        tier = "label"
        wanted = _norm(label)
        matches = [
            n for n in nodes
            if _norm(n.get("label")) == wanted
            and (klass is None or n.get("class") == klass)
        ]

    if not matches:
        return {"status": "not_found", "tier": tier, "matches": [],
                "node": None, "center": None}
    if len(matches) > 1:
        return {"status": "ambiguous", "tier": tier, "matches": matches,
                "node": None, "center": None}
    node = matches[0]
    return {"status": "ok", "tier": tier, "matches": matches,
            "node": node, "center": center(node.get("frame"))}
```

- [ ] **Step 5: Run tests, verify they pass**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: PASS — all `*ParseTest`, `CenterTest`, `FindTest`.

- [ ] **Step 6: Commit** (checkpoint)

---

## Task 6: `gate.py` — mobile-repo detection + gate decision

**Files:**
- Create: `~/.claude/tools/mobile-verify/mobile_verify/gate.py`
- Test: `~/.claude/tools/mobile-verify/tests/test_gate.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_gate.py`:
```python
from __future__ import annotations

import io
import json
import os
import subprocess
import tempfile
import unittest
from contextlib import redirect_stdout

from mobile_verify import gate
from mobile_verify import proof as P


def _git(repo, *args):
    subprocess.run(["git", *args], cwd=repo, check=True,
                   capture_output=True, text=True)


def _write(repo, rel, content):
    path = os.path.join(repo, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as fh:
        fh.write(content)


def _mobile_repo():
    d = tempfile.mkdtemp()
    _git(d, "init")
    _git(d, "config", "user.email", "t@t.t")
    _git(d, "config", "user.name", "t")
    _write(d, "package.json",
           json.dumps({"name": "demo", "version": "1.0.0",
                       "dependencies": {"expo": "*", "react-native": "*"}}))
    _write(d, "app.json", "{}")
    _write(d, "src/app/index.tsx", "export default 1;\n")
    _git(d, "add", "-A")
    _git(d, "commit", "-m", "init")
    return d


def _run(repo, payload):
    text = json.dumps(payload)
    buf = io.StringIO()
    with redirect_stdout(buf):
        code = gate.run_gate(text)
    return code, buf.getvalue()


class DetectTest(unittest.TestCase):
    def test_detects_expo_app(self):
        self.assertTrue(gate.detect_mobile_repo(_mobile_repo()))

    def test_non_mobile_repo(self):
        d = tempfile.mkdtemp()
        with open(os.path.join(d, "package.json"), "w") as fh:
            json.dump({"name": "web", "dependencies": {"react": "*"}}, fh)
        self.assertFalse(gate.detect_mobile_repo(d))

    def test_detects_app_config_ts(self):
        d = tempfile.mkdtemp()
        open(os.path.join(d, "app.config.ts"), "w").close()
        self.assertTrue(gate.detect_mobile_repo(d))

    def test_detects_monorepo_package(self):
        d = tempfile.mkdtemp()
        pkgdir = os.path.join(d, "packages", "mobile")
        os.makedirs(pkgdir)
        with open(os.path.join(pkgdir, "package.json"), "w") as fh:
            json.dump({"dependencies": {"react-native": "*"}}, fh)
        self.assertTrue(gate.detect_mobile_repo(d))


class GateDecisionTest(unittest.TestCase):
    def test_noop_in_non_mobile_repo(self):
        d = tempfile.mkdtemp()
        with open(os.path.join(d, "package.json"), "w") as fh:
            json.dump({"name": "web"}, fh)
        code, out = _run(d, {"cwd": d})
        self.assertEqual(code, 0)
        self.assertEqual(out.strip(), "")

    def test_release_when_clean_tree(self):
        d = _mobile_repo()
        code, out = _run(d, {"cwd": d})
        self.assertEqual(out.strip(), "")

    def test_block_when_ui_changed_and_no_proof(self):
        d = _mobile_repo()
        _write(d, "src/app/index.tsx", "export default 2;\n")
        code, out = _run(d, {"cwd": d})
        decision = json.loads(out)
        self.assertEqual(decision["decision"], "block")

    def test_release_when_proof_matches(self):
        d = _mobile_repo()
        _write(d, "src/app/index.tsx", "export default 2;\n")
        from mobile_verify.config import load_config
        from mobile_verify.diffhash import compute_ui_diff_hash
        h = compute_ui_diff_hash(d, load_config(d)["ui_globs"])
        P.write_proof(d, {
            "schema_version": 1, "ui_diff_hash": h,
            "app": {"name": "demo", "version": "1.0.0"},
            "required_platforms": ["ios", "android"],
            "passed_platforms": ["ios", "android"],
            "targets": [{"id": "t", "route": "/t", "assertions": []}],
            "timestamp": "2026-05-29T00:00:00+00:00", "degraded": False,
        })
        code, out = _run(d, {"cwd": d})
        self.assertEqual(out.strip(), "")

    def test_block_when_only_one_platform_passed(self):
        d = _mobile_repo()
        _write(d, "src/app/index.tsx", "export default 2;\n")
        from mobile_verify.config import load_config
        from mobile_verify.diffhash import compute_ui_diff_hash
        h = compute_ui_diff_hash(d, load_config(d)["ui_globs"])
        P.write_proof(d, {
            "schema_version": 1, "ui_diff_hash": h,
            "app": {"name": "demo", "version": "1.0.0"},
            "required_platforms": ["ios", "android"],
            "passed_platforms": ["ios"],
            "targets": [{"id": "t", "route": "/t", "assertions": []}],
            "timestamp": "2026-05-29T00:00:00+00:00", "degraded": False,
        })
        code, out = _run(d, {"cwd": d})
        self.assertEqual(json.loads(out)["decision"], "block")

    def test_loop_guard_releases_without_pass(self):
        d = _mobile_repo()
        _write(d, "src/app/index.tsx", "export default 2;\n")
        code, out = _run(d, {"cwd": d, "stop_hook_active": True})
        self.assertEqual(code, 0)
        self.assertEqual(out.strip(), "")  # no block JSON on stdout


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: FAIL — `No module named 'mobile_verify.gate'`.

- [ ] **Step 3: Implement `gate.py`**

`mobile_verify/gate.py`:
```python
from __future__ import annotations

import json
import os
import subprocess
import sys
from typing import Any, Dict, List

from mobile_verify import config as config_mod
from mobile_verify import proof as proof_mod
from mobile_verify.diffhash import compute_ui_diff_hash


def _exists_any(repo: str, names: List[str]) -> bool:
    return any(os.path.exists(os.path.join(repo, n)) for n in names)


def _read_pkg(repo: str) -> Dict[str, Any]:
    path = os.path.join(repo, "package.json")
    if os.path.isfile(path):
        try:
            with open(path) as fh:
                return json.load(fh)
        except (OSError, ValueError):
            return {}
    return {}


def _has_mobile_dep(pkg: Dict[str, Any]) -> bool:
    deps: Dict[str, Any] = {}
    for key in ("dependencies", "devDependencies"):
        deps.update(pkg.get(key) or {})
    if any(name in deps for name in ("expo", "react-native", "expo-router")):
        return True
    return any(name.startswith("@react-native/")
               or name.startswith("@react-native-") for name in deps)


def detect_mobile_repo(repo: str) -> bool:
    candidates = [repo]
    for base in ("packages", "apps"):
        base_dir = os.path.join(repo, base)
        if os.path.isdir(base_dir):
            for name in sorted(os.listdir(base_dir)):
                candidates.append(os.path.join(base_dir, name))
    for cand in candidates:
        if not os.path.isdir(cand):
            continue
        if _exists_any(cand, ["app.json", "app.config.js",
                              "app.config.ts", "app.config.mjs"]):
            return True
        if (_exists_any(cand, ["ios", "android"])
                and os.path.isfile(os.path.join(cand, "package.json"))):
            return True
        pkg = _read_pkg(cand)
        if pkg and ("expo" in pkg or _has_mobile_dep(pkg)):
            return True
    return False


def _git_root(start: str):
    proc = subprocess.run(["git", "rev-parse", "--show-toplevel"],
                          cwd=start, capture_output=True, text=True)
    return proc.stdout.strip() if proc.returncode == 0 else None


def run_gate(stdin_text: str) -> int:
    try:
        payload = json.loads(stdin_text or "{}")
    except ValueError:
        payload = {}

    cwd = payload.get("cwd") or os.getcwd()
    repo = _git_root(cwd) or cwd

    if not detect_mobile_repo(repo):
        return 0

    cfg = config_mod.load_config(repo)
    current_hash = compute_ui_diff_hash(repo, cfg["ui_globs"])
    if not current_hash:
        return 0

    proof = proof_mod.load_proof(repo)
    current_app = proof_mod.current_app_identity(repo)
    ok, reason = proof_mod.evaluate(proof, current_hash, current_app, cfg)
    if ok:
        return 0

    if payload.get("stop_hook_active"):
        # Loop guard: never silently convert an incomplete proof into a pass.
        sys.stderr.write(
            "Mobile simulator verification did NOT complete: %s\n" % reason)
        return 0

    print(json.dumps({
        "decision": "block",
        "reason": (
            "UI changes are not verified on the simulator (%s). Run the "
            "verify-on-simulator skill to drive the affected screen(s) on the "
            "required platform(s) and produce a passing proof before claiming "
            "completion." % reason
        ),
    }))
    return 0


def main() -> int:
    return run_gate(sys.stdin.read())
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: PASS — `DetectTest`, `GateDecisionTest`.

- [ ] **Step 5: Commit** (checkpoint)

---

## Task 7: `cli.py` — command dispatch + `mv` shim

**Files:**
- Create: `~/.claude/tools/mobile-verify/mobile_verify/cli.py`
- Create: `~/.claude/tools/mobile-verify/mv`
- Test: `~/.claude/tools/mobile-verify/tests/test_cli.py`

- [ ] **Step 1: Write the failing tests**

`tests/test_cli.py`:
```python
from __future__ import annotations

import io
import os
import unittest
from contextlib import redirect_stdout

from mobile_verify.cli import main

FIX = os.path.join(os.path.dirname(__file__), "fixtures")


def _capture(argv):
    buf = io.StringIO()
    with redirect_stdout(buf):
        code = main(argv)
    return code, buf.getvalue()


class CliTest(unittest.TestCase):
    def test_find_ok_prints_center(self):
        code, out = _capture([
            "find", "--platform", "android",
            "--input", os.path.join(FIX, "android_basic.xml"),
            "--resource-id", "com.demo:id/bookmarks_tab",
        ])
        self.assertEqual(code, 0)
        self.assertIn('"status": "ok"', out)
        self.assertIn('"center"', out)

    def test_find_ambiguous_exit_3(self):
        code, out = _capture([
            "find", "--platform", "android",
            "--input", os.path.join(FIX, "android_ambiguous.xml"),
            "--text", "Save",
        ])
        self.assertEqual(code, 3)
        self.assertIn("ambiguous", out)

    def test_find_offscreen_exit_4(self):
        code, out = _capture([
            "find", "--platform", "android",
            "--input", os.path.join(FIX, "android_offscreen.xml"),
            "--resource-id", "com.demo:id/footer",
            "--screen", "1080x2400",
        ])
        self.assertEqual(code, 4)
        self.assertIn("offscreen", out)

    def test_parse_prints_nodes(self):
        code, out = _capture([
            "parse", "--platform", "ios",
            "--input", os.path.join(FIX, "ios_describe.json"),
        ])
        self.assertEqual(code, 0)
        self.assertIn("Bookmarks", out)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests, verify they fail**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: FAIL — `No module named 'mobile_verify.cli'`.

- [ ] **Step 3: Implement `cli.py`**

`mobile_verify/cli.py`:
```python
from __future__ import annotations

import argparse
import datetime
import json
import os
import sys
from typing import List, Optional

from mobile_verify import config as config_mod
from mobile_verify import inspect as inspect_mod
from mobile_verify import proof as proof_mod
from mobile_verify.diffhash import compute_ui_diff_hash
from mobile_verify.gate import _git_root, run_gate


def _repo() -> str:
    return _git_root(os.getcwd()) or os.getcwd()


def _load_nodes(platform: str, path: str):
    with open(path) as fh:
        text = fh.read()
    if platform == "android":
        return inspect_mod.parse_android(text)
    return inspect_mod.parse_ios(text)


def cmd_gate(_args) -> int:
    return run_gate(sys.stdin.read())


def cmd_hash(_args) -> int:
    repo = _repo()
    cfg = config_mod.load_config(repo)
    print(compute_ui_diff_hash(repo, cfg["ui_globs"]))
    return 0


def cmd_parse(args) -> int:
    print(json.dumps(_load_nodes(args.platform, args.input), indent=2))
    return 0


def cmd_find(args) -> int:
    nodes = _load_nodes(args.platform, args.input)
    res = inspect_mod.find(nodes, resource_id=args.resource_id,
                           text=args.text, label=args.label, klass=args.klass)
    if res["status"] == "ambiguous":
        print(json.dumps({"status": "ambiguous",
                          "count": len(res["matches"]),
                          "matches": res["matches"][:10]}, indent=2))
        return 3
    if res["status"] == "not_found":
        print(json.dumps({"status": "not_found", "tier": res["tier"]}))
        return 2
    if args.screen and res["center"]:
        try:
            width, height = (int(v) for v in args.screen.lower().split("x"))
        except ValueError:
            width = height = None
        if width is not None:
            cx, cy = res["center"]["x"], res["center"]["y"]
            inside = 0 <= cx <= width and 0 <= cy <= height
            if not inside and not args.allow_offscreen:
                print(json.dumps({"status": "offscreen",
                                  "center": res["center"],
                                  "screen": [width, height]}))
                return 4
    print(json.dumps({"status": "ok", "tier": res["tier"],
                      "center": res["center"], "node": res["node"]}, indent=2))
    return 0


def cmd_write_proof(args) -> int:
    repo = _repo()
    with open(args.file) as fh:
        proof = json.load(fh)
    cfg = config_mod.load_config(repo)
    proof.setdefault("schema_version", proof_mod.SCHEMA_VERSION)
    proof["ui_diff_hash"] = compute_ui_diff_hash(repo, cfg["ui_globs"])
    proof["commit"] = proof_mod.head_commit(repo)
    proof.setdefault("app", proof_mod.current_app_identity(repo))
    proof.setdefault("required_platforms", cfg["required_platforms"])
    proof.setdefault(
        "timestamp",
        datetime.datetime.now(datetime.timezone.utc).isoformat())
    print(proof_mod.write_proof(repo, proof))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="mobile_verify")
    sub = parser.add_subparsers(dest="cmd")
    sub.required = True

    sub.add_parser("gate").set_defaults(func=cmd_gate)
    sub.add_parser("hash").set_defaults(func=cmd_hash)

    parse_p = sub.add_parser("parse")
    parse_p.add_argument("--platform", required=True,
                         choices=["ios", "android"])
    parse_p.add_argument("--input", required=True)
    parse_p.set_defaults(func=cmd_parse)

    find_p = sub.add_parser("find")
    find_p.add_argument("--platform", required=True,
                        choices=["ios", "android"])
    find_p.add_argument("--input", required=True)
    find_p.add_argument("--resource-id", dest="resource_id")
    find_p.add_argument("--text")
    find_p.add_argument("--label")
    find_p.add_argument("--class", dest="klass")
    find_p.add_argument("--screen")
    find_p.add_argument("--allow-offscreen", action="store_true")
    find_p.set_defaults(func=cmd_find)

    wp = sub.add_parser("write-proof")
    wp.add_argument("--file", required=True)
    wp.set_defaults(func=cmd_write_proof)
    return parser


def main(argv: Optional[List[str]] = None) -> int:
    args = build_parser().parse_args(argv)
    return args.func(args)
```

- [ ] **Step 4: Run tests, verify they pass**

Run: `~/.claude/tools/mobile-verify/run-tests.sh`
Expected: PASS — `CliTest` (4 tests) plus all prior suites.

- [ ] **Step 5: Create the `mv` shim and confirm module invocation**

`~/.claude/tools/mobile-verify/mv`:
```bash
#!/usr/bin/env bash
exec env PYTHONPATH="$HOME/.claude/tools/mobile-verify" python3 -m mobile_verify "$@"
```

```bash
chmod +x ~/.claude/tools/mobile-verify/mv
~/.claude/tools/mobile-verify/mv find --platform android \
  --input ~/.claude/tools/mobile-verify/tests/fixtures/android_basic.xml \
  --resource-id com.demo:id/bookmarks_tab
```
Expected: JSON with `"status": "ok"` and a `center` of `{"x": 945, "y": 2340}`.

- [ ] **Step 6: Commit** (checkpoint)

---

## Task 8: Stop-hook wrapper + registration in `settings.json`

**Files:**
- Create: `~/.claude/hooks/gate-mobile-verify.sh`
- Modify: `~/.claude/settings.json` (add `hooks.Stop`)

- [ ] **Step 1: Create the hook wrapper**

`~/.claude/hooks/gate-mobile-verify.sh`:
```bash
#!/usr/bin/env bash
# Stop hook: block "UI task complete" until simulator verification passes.
# Reads hook JSON on stdin; emits a block decision JSON or exits 0 (no-op).
exec env PYTHONPATH="$HOME/.claude/tools/mobile-verify" \
  python3 -m mobile_verify gate
```

```bash
mkdir -p ~/.claude/hooks
chmod +x ~/.claude/hooks/gate-mobile-verify.sh
```

- [ ] **Step 2: Smoke-test the wrapper (no-op outside a mobile repo)**

```bash
echo '{"cwd":"'"$HOME"'","stop_hook_active":false}' | ~/.claude/hooks/gate-mobile-verify.sh; echo "exit=$?"
```
Expected: no stdout, `exit=0` (home dir is not a mobile repo).

- [ ] **Step 3: Smoke-test the wrapper (blocks in the alfurqan repo with an unverified UI diff)**

```bash
echo '{"cwd":"/Users/ahmeddaraz/VibeCoding/worktree/alfurqan/reading-enhancments","stop_hook_active":false}' \
  | ~/.claude/hooks/gate-mobile-verify.sh; echo "exit=$?"
```
Expected: a JSON object with `"decision":"block"` on stdout (the worktree currently has many modified `*.tsx` files and no proof), `exit=0`.

- [ ] **Step 4: Register the Stop hook in user settings (safe merge)**

Run this Python merge (idempotent — won't duplicate the entry):
```bash
python3 - <<'PY'
import json, os
p = os.path.expanduser("~/.claude/settings.json")
with open(p) as f:
    cfg = json.load(f)
cmd = os.path.expanduser("~/.claude/hooks/gate-mobile-verify.sh")
hooks = cfg.setdefault("hooks", {})
stop = hooks.setdefault("Stop", [])
exists = any(
    h.get("command") == cmd
    for group in stop for h in group.get("hooks", [])
)
if not exists:
    stop.append({"hooks": [{"type": "command", "command": cmd}]})
with open(p, "w") as f:
    json.dump(cfg, f, indent=2)
print("registered" if not exists else "already present")
PY
```
Expected: prints `registered`.

- [ ] **Step 5: Validate settings JSON is still well-formed**

```bash
python3 -c "import json,os;json.load(open(os.path.expanduser('~/.claude/settings.json')));print('valid json')"
```
Expected: `valid json`.

---

## Task 9: `mobile-verifier` sub-agent

**Files:**
- Create: `~/.claude/agents/mobile-verifier.md`

- [ ] **Step 1: Write the agent definition**

`~/.claude/agents/mobile-verifier.md`:
```markdown
---
name: mobile-verifier
description: Use to verify a UI change on an iOS simulator and/or Android emulator. Drives the app to target screen(s), reads the accessibility tree via idb/uiautomator, runs assertions, captures one screenshot per screen, and returns a compact PASS/FAIL verdict. Writes the verification proof on a complete pass. Invoke after UI-affecting changes, before claiming completion.
tools: Bash, Read
---

You are an isolated mobile simulator verification executor. You receive: the
required platform set, the launch command, the target screens/routes, and a list
of assertions (each with an id, a mode of `semantic` or `screenshot`, and an
expected value). You return ONLY a compact verdict. NEVER dump full accessibility
trees or base64 image bytes into your final message.

## Toolkit

A deterministic helper lives at `~/.claude/tools/mobile-verify/mv`. Use it for all
hierarchy parsing and element matching — do not eyeball coordinates from
screenshots.

- `mv parse --platform <ios|android> --input <file>` — normalized node list.
- `mv find --platform <ios|android> --input <file> [--resource-id X] [--text X] [--label X] [--class X] [--screen WxH]` — match one element. Exit codes: 0 ok (prints `center`), 2 not_found, 3 ambiguous, 4 offscreen.
- `mv write-proof --file <proof.json>` — validate + write `.claude/mobile-verify/last-pass.json` (fills `ui_diff_hash`, `commit`, `app`, `timestamp`).

## iOS mechanics

- Booted sim id: `xcrun simctl list devices booted`.
- Boot if needed: `xcrun simctl boot <udid>`; `open -a Simulator`.
- Launch / deep link: `xcrun simctl launch booted <bundle-id>`; route via
  `xcrun simctl openurl booted "<scheme>://<path>"` when the app defines a scheme.
- Accessibility tree: `idb ui describe-all --udid <udid> --json > /tmp/ios_tree.json`,
  then `mv find --platform ios --input /tmp/ios_tree.json ...`.
- Interact at computed center: `idb ui tap <x> <y> --udid <udid>`;
  `idb ui text "<value>" --udid <udid>`; `idb ui swipe <x1> <y1> <x2> <y2> --udid <udid>`.
- Screenshot: `xcrun simctl io booted screenshot /tmp/verify-ios-<target>.png`.

## Android mechanics

- Devices: `adb devices`. Boot an emulator if none: `emulator -list-avds` then
  `emulator @<avd> &` and wait for `adb wait-for-device`.
- Launch: `adb shell monkey -p <applicationId> -c android.intent.category.LAUNCHER 1`
  or `adb shell am start -n <applicationId>/<activity>`; deep link via
  `adb shell am start -a android.intent.action.VIEW -d "<scheme>://<path>"`.
- Accessibility hierarchy: `adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml /tmp/android_tree.xml`,
  then `mv find --platform android --input /tmp/android_tree.xml ...`.
- Interaction is element-derived coordinate interaction: take `center` from
  `mv find`, then `adb shell input tap <x> <y>`; `adb shell input text "<escaped>"`;
  `adb shell input swipe <x1> <y1> <x2> <y2>`. After any interaction, re-dump and
  re-run `mv find` to confirm the expected state changed.
- Screen size for off-screen detection: `adb shell wm size` → pass as `--screen WxH`.
- Screenshot: `adb exec-out screencap -p > /tmp/verify-android-<target>.png`.

## Matching discipline

- Prefer `--resource-id`, then `--text`, then `--label` scoped by `--class`.
- On exit code 3 (ambiguous), FAIL that assertion with an ambiguity report — never
  guess. On exit 4 (offscreen), scroll then re-dump ONLY if the assertion declares
  the element may be off-screen; otherwise FAIL.

## WebView fallback

`idb`/`uiautomator` do not see inside a WebView's DOM. If a target's body is a
WebView (e.g. a Qur'an mushaf page), semantic assertions for body content cannot
pass; use `mode: screenshot` assertions for the WebView body and keep semantic
assertions for the surrounding native chrome. Record such runs honestly.

## Procedure

1. Detect available devices for each required platform; boot if needed. If a
   required platform's device cannot be brought up, that platform FAILS.
2. For each platform × target: launch, navigate to the route, dump the tree, run
   each assertion (`semantic` via `mv find`/value comparison; `screenshot` by
   capturing the artifact and visually confirming), capture one screenshot.
3. Build a proof object covering required_platforms, passed_platforms, targets
   (with assertion ids/modes/expected), devices, artifacts, and `degraded`
   (+`degraded_reason`) if any semantic assertion fell back to screenshot. Set
   `degraded_acknowledged` only if the caller explicitly authorized degraded mode.
4. ONLY if every required platform passed every assertion: `mv write-proof --file <proof.json>`.
   A partial pass MUST NOT write the proof.

## Output (your final message)

Return only:
- `VERDICT: PASS` or `VERDICT: FAIL`
- One line per assertion: `[platform] <target>/<assertion-id>: pass|fail (<mode>)`
- Screenshot paths (one per platform/target)
- If FAIL: the specific reason(s)
- Whether the proof was written
```

- [ ] **Step 2: Confirm the agent is discoverable**

```bash
test -f ~/.claude/agents/mobile-verifier.md && head -5 ~/.claude/agents/mobile-verifier.md
```
Expected: prints the YAML frontmatter (`name: mobile-verifier`).

---

## Task 10: `verify-on-simulator` orchestrator skill

**Files:**
- Create: `~/.claude/skills/verify-on-simulator/SKILL.md`

- [ ] **Step 1: Write the skill**

`~/.claude/skills/verify-on-simulator/SKILL.md`:
```markdown
---
name: verify-on-simulator
description: Use after making a UI-affecting change to a mobile (Expo/React Native) app, before claiming the task is complete. Resolves the target screens, dispatches the mobile-verifier sub-agent on the required platforms, relays the verdict, and ensures a passing proof is written so the Stop gate releases. Also use when the user asks to verify/test a change on the simulator or emulator.
---

# Verify on Simulator

Orchestrates simulator/emulator verification of UI changes and satisfies the
`gate-mobile-verify.sh` Stop hook.

## When to run

After any change touching rendered UI (routes under `app/`/`src/app`, components,
theme/constants, assets) and before you claim the task complete. The Stop hook
will block completion until a matching passing proof exists.

## Preflight

1. Check tooling: `idb --version`, `idb_companion --version`, `adb --version`,
   `xcrun simctl help >/dev/null`. If `idb` or `adb` are missing, print the
   install commands from the project verification docs and note that affected
   semantic assertions cannot pass — only `screenshot`-mode assertions can, and a
   degraded run needs explicit user acknowledgement.
2. Determine the required platform set from `.claude/mobile-verify/config.json`
   (`required_platforms`, default `["ios","android"]`). Use a single platform only
   when the user/task explicitly scopes the change to it.
3. Find the launch command: read the project `CLAUDE.md` "Verification" section and
   `package.json` scripts (`npm run ios` / `npm run android`). If undeterminable,
   ask the user once.

## Resolve targets

From the diff (`git diff --name-only` over UI paths), map changed files to the
screens/routes they render, and define assertions per target. Each assertion has:
`id`, `mode` (`semantic` preferred; `screenshot` for WebView bodies / when tooling
is degraded), and `expected`. Keep assertions tied to the visible behavior the
change affects (something that should have changed, or should be intact).

## Dispatch

Dispatch the `mobile-verifier` sub-agent with: required platform set, launch
command, target screens/routes, and the assertion list. The sub-agent runs in
isolation so trees/screenshots stay out of the main context; it returns a compact
verdict and, on a complete pass, writes `.claude/mobile-verify/last-pass.json`.

## Relay + gate

- Relay the sub-agent's verdict to the user, including screenshot paths.
- On PASS: confirm the proof was written (`.claude/mobile-verify/last-pass.json`
  exists). The Stop hook will now release for this exact UI state.
- On FAIL: report the failing assertions. Do NOT claim the work is complete or
  verified. Fix the issue (or surface it to the user) and re-verify.
- NEVER hand-write or fabricate the proof file to bypass the gate. Only the
  verifier's `mv write-proof` (after a real pass) may create it.

## First-run setup

If `.claude/mobile-verify/` is not git-ignored, add it to the project `.gitignore`
(see the gitignore task) so proofs are not committed.
```

- [ ] **Step 2: Confirm the skill is discoverable**

```bash
test -f ~/.claude/skills/verify-on-simulator/SKILL.md && head -3 ~/.claude/skills/verify-on-simulator/SKILL.md
```
Expected: prints the frontmatter (`name: verify-on-simulator`).

---

## Task 11: Per-project wiring — git-ignore the proof directory

**Files:**
- Modify: `/Users/ahmeddaraz/VibeCoding/worktree/alfurqan/reading-enhancments/.gitignore`

- [ ] **Step 1: Add the ignore entry (idempotent)**

```bash
cd /Users/ahmeddaraz/VibeCoding/worktree/alfurqan/reading-enhancments
grep -qxF '.claude/mobile-verify/' .gitignore || printf '\n# mobile-verify simulator proofs\n.claude/mobile-verify/\n' >> .gitignore
grep -n 'mobile-verify' .gitignore
```
Expected: shows the new ignore line.

- [ ] **Step 2: Commit the gitignore change**

```bash
cd /Users/ahmeddaraz/VibeCoding/worktree/alfurqan/reading-enhancments
git add .gitignore
git commit -m "chore: git-ignore mobile-verify simulator proofs

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 12: iOS live dry-run (end-to-end happy path)

**Files:** none (live verification against the booted `iPhone 17 Pro Max`).

- [ ] **Step 1: Confirm a booted iOS sim and the installed app**

```bash
xcrun simctl list devices booted
```
Expected: `iPhone 17 Pro Max (... ) (Booted)`. Ensure the alfurqan dev build is installed/running (`npm run ios` from the repo if not).

- [ ] **Step 2: Capture the iOS accessibility tree and find the Bookmarks tab**

```bash
UDID=$(xcrun simctl list devices booted | sed -n 's/.*(\([0-9A-F-]\{36\}\)).*/\1/p' | head -1)
idb ui describe-all --udid "$UDID" --json > /tmp/ios_tree.json
~/.claude/tools/mobile-verify/mv parse --platform ios --input /tmp/ios_tree.json | grep -i bookmark
```
Expected: the tree contains a node whose `label` is the Bookmarks tab label (matches `strings.ts`). If `idb` is unavailable, this run is degraded — record it and require user acknowledgement.

- [ ] **Step 3: Dispatch the mobile-verifier for iOS only and confirm a PASS**

Invoke the `verify-on-simulator` skill scoped to iOS, target `/(tabs)/bookmarks`,
with a `semantic` assertion that the Bookmarks tab/screen label is present. Confirm
the verdict is `VERDICT: PASS` and the proof exists:
```bash
cat /Users/ahmeddaraz/VibeCoding/worktree/alfurqan/reading-enhancments/.claude/mobile-verify/last-pass.json
```
Expected: JSON with `passed_platforms` including `"ios"` and a matching `ui_diff_hash`.

---

## Task 13: Android live dry-run (create AVD, verify same target)

**Files:** none (live verification; creates an Android AVD since none exists).

- [ ] **Step 1: Create and boot an emulator (no AVD exists yet)**

```bash
sdkmanager "system-images;android-34;google_apis;arm64-v8a" 2>/dev/null || true
avdmanager create avd -n mv_pixel -k "system-images;android-34;google_apis;arm64-v8a" --device pixel_6 || true
emulator @mv_pixel -no-snapshot -no-boot-anim & 
adb wait-for-device
adb shell getprop sys.boot_completed | tr -d '\r'
```
Expected: prints `1` once boot completes. If `sdkmanager`/`avdmanager` are not on PATH, use Android Studio's Device Manager to create a Pixel + API 34 AVD, then re-run from `emulator @<avd>`.

- [ ] **Step 2: Install/launch the app and dump the hierarchy**

```bash
cd /Users/ahmeddaraz/VibeCoding/worktree/alfurqan/reading-enhancments
npm run android
adb shell uiautomator dump /sdcard/ui.xml && adb pull /sdcard/ui.xml /tmp/android_tree.xml
adb shell wm size
~/.claude/tools/mobile-verify/mv parse --platform android --input /tmp/android_tree.xml | grep -i bookmark
```
Expected: hierarchy contains the Bookmarks node; `wm size` prints e.g. `Physical size: 1080x2400`.

- [ ] **Step 3: Dispatch the mobile-verifier for Android and confirm a PASS**

Invoke `verify-on-simulator` scoped to Android, same target/assertion, using
`mv find --screen <WxH>` for the tap target. Confirm `VERDICT: PASS`, then:
```bash
cat /Users/ahmeddaraz/VibeCoding/worktree/alfurqan/reading-enhancments/.claude/mobile-verify/last-pass.json
```
Expected: `passed_platforms` now includes `"android"` (full cross-platform pass when both runs target the same UI state).

---

## Task 14: Full gate integration test (block → verify → release)

**Files:** none (exercises the registered Stop hook against the real repo).

- [ ] **Step 1: Make a trivial UI edit and confirm the gate would BLOCK**

```bash
cd /Users/ahmeddaraz/VibeCoding/worktree/alfurqan/reading-enhancments
# touch a UI file in a no-op way to create a fresh diff state
python3 - <<'PY'
import pathlib
p = pathlib.Path("src/app/(tabs)/bookmarks.tsx")
p.write_text(p.read_text() + "\n// mv gate test\n")
print("edited")
PY
echo '{"cwd":"'"$PWD"'","stop_hook_active":false}' | ~/.claude/hooks/gate-mobile-verify.sh
```
Expected: a `{"decision":"block", ...}` JSON (proof is now stale vs the new diff).

- [ ] **Step 2: Re-verify, then confirm the gate RELEASES**

Run `verify-on-simulator` (both platforms) to refresh the proof for the new UI
state, then:
```bash
cd /Users/ahmeddaraz/VibeCoding/worktree/alfurqan/reading-enhancments
echo '{"cwd":"'"$PWD"'","stop_hook_active":false}' | ~/.claude/hooks/gate-mobile-verify.sh; echo "exit=$?"
```
Expected: no stdout, `exit=0` (proof's `ui_diff_hash` now matches).

- [ ] **Step 3: Confirm the loop guard never fabricates a pass**

```bash
cd /Users/ahmeddaraz/VibeCoding/worktree/alfurqan/reading-enhancments
python3 - <<'PY'
import pathlib
p = pathlib.Path("src/app/(tabs)/bookmarks.tsx")
p.write_text(p.read_text() + "\n// second edit invalidates proof\n")
PY
echo '{"cwd":"'"$PWD"'","stop_hook_active":true}' | ~/.claude/hooks/gate-mobile-verify.sh; echo "exit=$?"
```
Expected: no block JSON on stdout, a stderr line `Mobile simulator verification did NOT complete: proof is stale...`, `exit=0`.

- [ ] **Step 4: Revert the test edits**

```bash
cd /Users/ahmeddaraz/VibeCoding/worktree/alfurqan/reading-enhancments
git checkout -- "src/app/(tabs)/bookmarks.tsx"
```
Expected: the test comment lines are gone.

---

## Self-Review (completed during planning)

- **Spec coverage:**
  - Semantic + pixel visibility → Tasks 5 (parse/find), 9, 12–13.
  - iOS + Android both → Tasks 9, 12, 13.
  - Full setup (idb/adb) → Task 1.
  - Auto + gate completion → Tasks 6, 8, 14.
  - Skill + agent + hook architecture → Tasks 9, 10, 8.
  - Proof schema (platforms/targets/assertions/app/devices/mode/degraded) → Task 4 + agent step 3.
  - Hook logic: mobile detection, tracked+untracked hash, full-proof match, loop guard, no-op non-mobile → Tasks 2, 6, 8.
  - Android element-derived interaction + matching rules (resource-id→text→label; ambiguity; off-screen) → Tasks 5, 7, 9.
  - WebView fallback → agent Task 9 + skill Task 10.
  - Degraded-mode acknowledgement → Tasks 4 (evaluate), 9, 10.
  - Test matrix (block w/o marker, release on match, one-of-two platforms, untracked included, non-mobile no-op, app.config.ts + monorepo detection, stop_hook_active release without pass, empty diff release, fixtures for exact/ambiguous/off-screen) → Tasks 2, 5, 6, 7, 14. **Note:** the "target screens/assertions differ" block case is enforced by the agent/skill (semantic), not the hook — see Scope Boundary; the hook gates platform coverage + freshness + integrity only.
- **Placeholder scan:** none — every code step contains complete, runnable code; the one illustrative broken test stub in Task 4 is explicitly called out for deletion.
- **Type consistency:** `compute_ui_diff_hash(repo_root, globs)`, `find(...)→{status,tier,matches,node,center}`, `evaluate(proof,current_hash,current_app,policy)→(ok,reason)`, `write_proof/load_proof/validate_proof`, and `run_gate(stdin_text)→int` are used identically across tasks.

## Notes carried to handoff

- The hook gates **platform coverage + freshness + integrity**, not per-task screen correctness (a shell hook can't read task intent). The agent/skill own choosing correct targets. This is a deliberate, surfaced interpretation of spec step 4.
- `~/.claude` may not be a git repo; toolkit "commit" steps are checkpoints. Only the spec/plan/gitignore commits land in the alfurqan repo.
```
