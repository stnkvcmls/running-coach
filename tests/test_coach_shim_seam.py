"""Guards the app.ai_coach monkeypatch seam (P3-1 code review finding).

app/coach/{providers,jobs,plans,chat}.py deliberately call back through
``app.ai_coach`` (``from app import ai_coach as _shim`` + ``_shim.<name>``)
instead of the locally-imported name, so that tests monkeypatching
``app.ai_coach.<name>`` keep affecting behavior after the P3-1 module split.
That convention has no import-time enforcement — a `_shim.<name>` reference
to something not re-exported by app.ai_coach fails only when the code path
actually runs. This test statically verifies every such reference resolves.
"""
import ast
from pathlib import Path

import app.ai_coach as ai_coach

COACH_DIR = Path(__file__).resolve().parent.parent / "app" / "coach"


def _shim_attribute_names(source: str) -> set[str]:
    """Return every ``_shim.<name>`` attribute access in a module's source."""
    tree = ast.parse(source)
    names = set()
    for node in ast.walk(tree):
        if (
            isinstance(node, ast.Attribute)
            and isinstance(node.value, ast.Name)
            and node.value.id == "_shim"
        ):
            names.add(node.attr)
    return names


def test_all_shim_references_resolve_on_ai_coach():
    missing: dict[str, set[str]] = {}
    for path in sorted(COACH_DIR.glob("*.py")):
        names = _shim_attribute_names(path.read_text())
        unresolved = {n for n in names if not hasattr(ai_coach, n)}
        if unresolved:
            missing[path.name] = unresolved
    assert not missing, f"app.ai_coach is missing shim-referenced attributes: {missing}"
