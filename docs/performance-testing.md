# Performance Testing

The performance suite benchmarks **every API endpoint** in `app/api.py` against a
**real, committed SQLite database** holding three years of realistic data for a
single amateur marathon runner. It runs on every pull request and publishes the
results to GitHub.

## What it measures

Each route handler is driven in-process via FastAPI's `TestClient` against the
seeded database and timed with [`pytest-benchmark`](https://pytest-benchmark.readthedocs.io/).
Running in-process (rather than over real HTTP) removes network noise, so the
numbers reflect the app's own work — query cost and response serialization — and
stay stable enough in CI to detect regressions.

| Component | Path |
| --- | --- |
| Seed script (builds the DB) | `perf/seed_perf_db.py` |
| Committed database | `perf/perf.db` |
| Fixtures + external-call mocks | `perf/conftest.py` |
| One benchmark per endpoint | `perf/test_perf_endpoints.py` |
| Step-summary table renderer | `perf/summary.py` |
| CI workflow | `.github/workflows/performance.yml` |
| Extra dependencies | `requirements-perf.txt` |

## The seeded database

`perf/perf.db` (~4.5 MB) is generated deterministically (`random.seed`) from the
app's own SQLAlchemy models, so its schema can never drift from production. It
contains three years ending on the generation date:

- **~295 running days/year** (>250) across a weekly microcycle of easy /
  interval / tempo / long runs, **~3,600 km/year** (>2,000).
- **1,095 daily health summaries** (365/year): steps, resting/max HR, stress,
  sleep, body battery, intensity minutes, calories.
- One athlete profile (with thresholds), ~200 AI insights, calendar workouts and
  upcoming races (incl. a goal Marathon), a periodised 4-week training plan, and
  sync metadata.

Activities carry the rich JSON blobs the detail endpoints read (lap splits,
per-sample detail streams, HR/power zones, weather, mean-maximal curves). To keep
the committed file small, the heavy per-sample streams are attached only to runs
from the last 90 days — the window the activity-detail benchmark draws from.

### Regenerating the database

```bash
pip install -r requirements-perf.txt
python -m perf.seed_perf_db   # rewrites perf/perf.db, prints + asserts the totals
```

The script asserts the brief is met (≥250 running days/year, ≥2,000 km/year,
1,095 daily summaries) so a regenerated artifact is self-validating. Commit the
updated `perf/perf.db` alongside any schema change.

## Running locally

```bash
pip install -r requirements-perf.txt
pytest perf/ --benchmark-json=output.json
python perf/summary.py output.json      # optional Markdown table
```

`perf/conftest.py` copies `perf/perf.db` to a temp path and points `DB_PATH` at
the copy before importing the app, so runs never mutate the committed file. The
main test suite is unaffected — `pyproject.toml` scopes default collection to
`tests/`, so `perf/` only runs when invoked explicitly.

### Mocked boundaries

So that the AI and Garmin endpoints can be benchmarked without API keys or
network access, `conftest.py` stubs the external boundary only:

- `app.ai_coach.analyze_activity_force` / `analyze_activity_with_feedback` → no-op
- `app.ai_coach.generate_training_plan` → returns the seeded plan instantly
- `app.garmin_sync.sync_calendar` → no-op

Everything else (routing, DB access, serialization) runs for real. `/sync/{type}`
is benchmarked with `calendar`, which keeps `app.main` (and its `frontend/dist`
static mount) out of the import path.

## Results on GitHub

The workflow publishes results two ways:

1. **Job summary** — `perf/summary.py` writes a Markdown table (slowest endpoint
   first) to the Actions run summary on every run, always visible.
2. **[github-action-benchmark](https://github.com/benchmark-action/github-action-benchmark)** —
   comments the run-over-run comparison on the PR/commit, and on pushes to the
   default branch stores trend history on the `gh-pages` branch (viewable as a
   chart). The first push to the default branch seeds that history.

## Setting the regression threshold

A threshold is intentionally **not enforced yet**. In
`.github/workflows/performance.yml`:

```yaml
alert-threshold: '200%'   # flag an endpoint that is >2× its baseline
fail-on-alert: false      # comment only; do not fail the job
```

When the team agrees on a regression budget, tighten `alert-threshold` (e.g.
`'150%'`) and set `fail-on-alert: true` to make the `Performance` check block PRs
that regress beyond it. The comparison baseline is the latest entry stored on
`gh-pages`.
