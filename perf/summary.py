"""Render a pytest-benchmark ``output.json`` as a Markdown table.

Used by the performance workflow to write a guaranteed-visible results table to
``$GITHUB_STEP_SUMMARY`` (independent of the benchmark-action comment/history).

    python perf/summary.py output.json >> "$GITHUB_STEP_SUMMARY"
"""

from __future__ import annotations

import json
import sys


def render(path: str) -> str:
    with open(path) as fh:
        data = json.load(fh)

    benchmarks = data.get("benchmarks", [])
    rows = []
    for b in benchmarks:
        stats = b["stats"]
        rows.append((
            b["name"].replace("test_", ""),
            stats["min"] * 1000,
            stats["median"] * 1000,
            stats["mean"] * 1000,
            stats["max"] * 1000,
            stats["ops"],
        ))
    # Slowest first — that's where attention is most useful.
    rows.sort(key=lambda r: r[3], reverse=True)

    machine = data.get("machine_info", {})
    lines = [
        "## API Endpoint Performance",
        "",
        f"{len(rows)} endpoint benchmarks · "
        f"Python {machine.get('python_version', '?')} · {machine.get('system', '?')}",
        "",
        "| Endpoint | Min (ms) | Median (ms) | Mean (ms) | Max (ms) | Ops/s |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for name, mn, med, mean, mx, ops in rows:
        lines.append(
            f"| {name} | {mn:.2f} | {med:.2f} | {mean:.2f} | {mx:.2f} | {ops:.1f} |"
        )
    lines.append("")
    return "\n".join(lines)


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else "output.json"
    print(render(out))
