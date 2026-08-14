#!/usr/bin/env python3
"""Valida los 3 fallos de accesibilidad del issue SEO-10 sobre reportes de unlighthouse.

Uso:
    claude-seo run unlighthouse_run.py https://juan-tech.com --device mobile \
      --max-routes 40 --output-dir ./ulh-a11y --timeout 1500 --json
    ./scripts/seo/validate-a11y.py ./ulh-a11y

Tambien imprime el resumen de performance para comparar contra el baseline del
issue SEO-06, porque ambos issues se validan con la misma corrida.

Baseline 2026-08-14 (62 rutas, mobile):
    aria-valid-attr-value  6 rutas
    heading-order          8 rutas
    image-redundant-alt    6 rutas
    performance            mediana 74.5, min 46 (home), max 92
    home LCP               7.9 s
    home TTFB              3.82 s

Exit 0 si los 3 audits pasan en todas las rutas, 1 si no.
"""

import json
import glob
import statistics
import sys
from collections import Counter
from pathlib import Path

AUDITS = ["aria-valid-attr-value", "heading-order", "image-redundant-alt"]
BASELINE = {"aria-valid-attr-value": 6, "heading-order": 8, "image-redundant-alt": 6}
BASELINE_PERF_MEDIAN = 74.5
BASELINE_HOME_PERF = 46


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__)
        return 2

    root = Path(sys.argv[1])
    files = glob.glob(str(root / "**" / "lighthouse.json"), recursive=True)
    if not files:
        print(f"No se encontro ningun lighthouse.json bajo {root}", file=sys.stderr)
        print("Corriste unlighthouse_run.py con --output-dir apuntando ahi?", file=sys.stderr)
        return 2

    failures: Counter = Counter()
    offenders: dict[str, list[str]] = {a: [] for a in AUDITS}
    perf: list[float] = []
    home = None

    for f in files:
        try:
            d = json.load(open(f))
        except (json.JSONDecodeError, OSError):
            continue

        url = d.get("requestedUrl", f)
        cat = d.get("categories", {}).get("performance", {})
        if cat.get("score") is not None:
            perf.append(cat["score"] * 100)
        if url.rstrip("/").endswith("juan-tech.com"):
            home = d

        for aid in AUDITS:
            if d.get("audits", {}).get(aid, {}).get("score") == 0:
                failures[aid] += 1
                offenders[aid].append(url)

    print(f"Reportes leidos: {len(files)}\n")

    print("=== Accesibilidad (issue SEO-10) ===")
    ok = True
    for aid in AUDITS:
        n = failures[aid]
        base = BASELINE[aid]
        if n == 0:
            print(f"  PASS  {aid}: 0 rutas (baseline {base})")
        else:
            ok = False
            print(f"  FAIL  {aid}: {n} rutas (baseline {base})")
            for u in sorted(offenders[aid])[:8]:
                print(f"          {u}")
            if n > 8:
                print(f"          ... y {n - 8} mas")

    print("\n=== Performance (issue SEO-06, informativo) ===")
    if perf:
        med = statistics.median(perf)
        arrow = "mejor" if med > BASELINE_PERF_MEDIAN else "peor"
        print(f"  mediana {med:.1f}  (baseline {BASELINE_PERF_MEDIAN}, {arrow})")
        print(f"  min {min(perf):.1f}   max {max(perf):.1f}")

    if home:
        a = home["audits"]
        hp = home["categories"]["performance"]["score"] * 100
        arrow = "mejor" if hp > BASELINE_HOME_PERF else "peor"
        print(f"\n  home performance {hp:.0f}  (baseline {BASELINE_HOME_PERF}, {arrow})")
        for m in [
            "first-contentful-paint",
            "largest-contentful-paint",
            "total-blocking-time",
            "cumulative-layout-shift",
            "speed-index",
            "server-response-time",
        ]:
            if m in a:
                print(f"    {m:26} {a[m].get('displayValue')}")

        el = a.get("largest-contentful-paint-element", {})
        try:
            snip = el["details"]["items"][0]["items"][0]["node"]["snippet"]
            print(f"    elemento LCP               {snip[:90]}")
        except (KeyError, IndexError, TypeError):
            pass
    else:
        print("\n  (no se encontro el reporte de la home)")

    print()
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
