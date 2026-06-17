# Lessons

## CI: `pytest` vs `python -m pytest` and the `app` import

**Symptom:** Tests passed locally with `python3 -m pytest` but CI failed at
collection with `ModuleNotFoundError: No module named 'app'`.

**Cause:** `python -m pytest` prepends the current directory to `sys.path`, so a
top-level `app` package is importable. The bare `pytest` console script (what CI
ran) does **not** add cwd to `sys.path`, so `from app import ...` in conftest failed.

**Fix:** Add `pythonpath = ["."]` under `[tool.pytest.ini_options]`. pytest inserts
this (relative to rootdir = the config file's dir) into `sys.path` regardless of how
it's launched. Don't rely on the `-m` invocation form to make first-party packages
importable.

**Verify-as-CI tip:** Reproduce the bare-`pytest` path condition by running from a
different cwd (e.g. `cd /tmp && pytest <repo>/tests`) rather than only
`python -m pytest` from the repo root, which masks sys.path issues.
