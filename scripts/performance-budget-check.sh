#!/usr/bin/env bash
set -euo pipefail

EVIDENCE_DATE="${EVIDENCE_DATE:-$(date +%F)}"
EVIDENCE_DIR="${EVIDENCE_DIR:-evidence/${EVIDENCE_DATE}}"

REQUESTS="${REQUESTS:-1000}"
CONCURRENCY="${CONCURRENCY:-20}"
RUNS="${RUNS:-30}"

BFF_P95_THRESHOLD_MS="${BFF_P95_THRESHOLD_MS:-550}"
DASHBOARD_TARGET_SECONDS="${DASHBOARD_TARGET_SECONDS:-2.5}"
DASHBOARD_PASSRATE_MIN="${DASHBOARD_PASSRATE_MIN:-95}"
SKIP_COMPOSE_UP="${SKIP_COMPOSE_UP:-0}"

export EVIDENCE_DATE
export EVIDENCE_DIR
export REQUESTS
export CONCURRENCY
export RUNS
export BFF_P95_THRESHOLD_MS
export DASHBOARD_TARGET_SECONDS
export DASHBOARD_PASSRATE_MIN
export SKIP_COMPOSE_UP

echo "== Performance budget gate =="
echo "evidence_dir=${EVIDENCE_DIR}"

echo "[1/3] Running BFF constrained performance benchmark"
bash scripts/docker-bff-performance-evidence.sh

echo "[2/3] Running dashboard constrained load benchmark"
bash scripts/docker-dashboard-load-evidence.sh

echo "[3/3] Evaluating budgets"
python3 - <<'PY'
import csv
import glob
import os
import statistics
import sys

bff_p95_threshold = float(os.environ['BFF_P95_THRESHOLD_MS'])
dashboard_target = float(os.environ['DASHBOARD_TARGET_SECONDS'])
dashboard_passrate_min = float(os.environ['DASHBOARD_PASSRATE_MIN'])
evidence_dir = os.environ['EVIDENCE_DIR']

failures = []
lines = ['# Performance Budget Report', '']

bff_csv = sorted(glob.glob(f'{evidence_dir}/docker-bff-performance-summary-*.csv'))
if not bff_csv:
    failures.append('Missing BFF performance CSV artifact')
else:
    rows = list(csv.DictReader(open(bff_csv[-1], newline='')))
    lines.append('## BFF budgets')
    for row in rows:
        endpoint = row['endpoint']
        p95 = float(row['p95_ms'])
        failed = int(float(row['failed']))
        status = 'PASS' if p95 < bff_p95_threshold and failed == 0 else 'FAIL'
        lines.append(f'- {endpoint}: p95={p95:.1f}ms failed={failed} => {status}')
        if p95 >= bff_p95_threshold:
            failures.append(f'{endpoint}: p95 {p95:.1f}ms >= {bff_p95_threshold:.1f}ms')
        if failed > 0:
            failures.append(f'{endpoint}: failed requests {failed} > 0')


dashboard_csv = sorted(glob.glob(f'{evidence_dir}/docker-dashboard-load-runs-*.csv'))
if not dashboard_csv:
    failures.append('Missing dashboard load CSV artifact')
else:
    rows = list(csv.DictReader(open(dashboard_csv[-1], newline='')))
    totals = [float(row['total_s']) for row in rows]
    n = len(totals)
    if n == 0:
        failures.append('Dashboard load CSV has no data rows')
    else:
        totals_sorted = sorted(totals)
        median = statistics.median(totals)
        p95 = totals_sorted[max(0, int(0.95 * n) - 1)]
        pass_rate = sum(1 for value in totals if value < dashboard_target) / n * 100.0

        lines.append('')
        lines.append('## Dashboard budgets')
        lines.append(f'- median={median:.3f}s p95={p95:.3f}s pass-rate={pass_rate:.1f}%')

        if p95 >= dashboard_target:
            failures.append(f'Dashboard p95 {p95:.3f}s >= {dashboard_target:.3f}s')
        if pass_rate < dashboard_passrate_min:
            failures.append(
                f'Dashboard pass-rate {pass_rate:.1f}% < {dashboard_passrate_min:.1f}%'
            )

report = '\n'.join(lines)
print(report)

if failures:
    print('\n## Failures')
    for failure in failures:
        print(f'- {failure}')
    sys.exit(1)
PY

echo "Performance budget gate completed"
