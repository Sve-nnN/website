#!/usr/bin/env python3
"""Mide rendimiento con PageSpeed Insights, que corre en servidores de Google.

    python3 scripts/seo/pagespeed.py                    # las rutas clave
    python3 scripts/seo/pagespeed.py / /blog            # rutas sueltas
    python3 scripts/seo/pagespeed.py --runs 3 /         # promedia varias corridas
    python3 scripts/seo/pagespeed.py --strategy desktop /

Por qué no Lighthouse local: las corridas desde una laptop en Perú contra un
VPS en Alemania dieron performance 39, 67, 69 y 87 sobre la MISMA página, el
mismo día. Con esa dispersión ningún criterio de aceptación se puede dar por
cumplido ni por incumplido. PSI corre en infraestructura de Google, así que
saca de la ecuación la red y la CPU de quien mide.

Además trae datos de campo (CrUX) cuando el sitio tiene tráfico suficiente:
`loadingExperience` son usuarios reales, no laboratorio, y ese es el número que
Google usa de verdad. Si no aparece, es que no hay muestra suficiente.

La clave sale de `PAGESPEED_API_KEY` en el entorno o en `.env`. Sin clave, la
cuota anónima es de unas pocas consultas por día compartidas con todo internet
(probado el 2026-08-22: `Quota exceeded`).
"""
import argparse
import json
import os
import statistics
import subprocess
import sys
import urllib.parse

SITE = 'https://juan-tech.com'
API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

DEFAULT_ROUTES = ['/', '/blog', '/servicios', '/blog/tech-seo/nextjs-seo', '/contact']

METRICS = [
    ('largest-contentful-paint', 'LCP'),
    ('first-contentful-paint', 'FCP'),
    ('total-blocking-time', 'TBT'),
    ('cumulative-layout-shift', 'CLS'),
    ('speed-index', 'SI'),
    ('server-response-time', 'TTFB'),
]


def api_key() -> str:
    key = os.environ.get('PAGESPEED_API_KEY', '')
    if key:
        return key
    try:
        for line in open('.env'):
            if line.startswith('PAGESPEED_API_KEY='):
                return line.split('=', 1)[1].strip()
    except FileNotFoundError:
        pass
    return ''


def run_psi(url: str, strategy: str, key: str) -> dict | None:
    params = {'url': url, 'strategy': strategy, 'category': 'performance'}
    if key:
        params['key'] = key
    query = urllib.parse.urlencode(params)

    out = subprocess.run(
        ['curl', '-sS', '--max-time', '180', f'{API}?{query}'],
        capture_output=True,
        text=True,
    ).stdout
    try:
        data = json.loads(out)
    except json.JSONDecodeError:
        print(f'  respuesta ilegible para {url}', file=sys.stderr)
        return None

    if 'error' in data:
        print(f"  ERROR {url}: {data['error'].get('message')}", file=sys.stderr)
        return None
    return data


def summarise(data: dict) -> dict:
    lh = data['lighthouseResult']
    audits = lh['audits']
    row = {
        'score': round(lh['categories']['performance']['score'] * 100),
        'metrics': {label: audits[key].get('numericValue') for key, label in METRICS},
        'display': {label: audits[key].get('displayValue') for key, label in METRICS},
    }

    # Datos de campo: usuarios reales de los ultimos 28 dias.
    field = data.get('loadingExperience', {}).get('metrics')
    if field:
        row['field'] = {
            'LCP': field.get('LARGEST_CONTENTFUL_PAINT_MS', {}).get('percentile'),
            'CLS': field.get('CUMULATIVE_LAYOUT_SHIFT_SCORE', {}).get('percentile'),
            'INP': field.get('INTERACTION_TO_NEXT_PAINT', {}).get('percentile'),
        }
    return row


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('routes', nargs='*', default=None)
    parser.add_argument('--runs', type=int, default=1, help='corridas por ruta, se reporta la mediana')
    parser.add_argument('--strategy', default='mobile', choices=['mobile', 'desktop'])
    args = parser.parse_args()

    key = api_key()
    if not key:
        print('Sin PAGESPEED_API_KEY (ni en el entorno ni en .env).', file=sys.stderr)
        print('La cuota anonima no alcanza para esto; ver la cabecera del script.', file=sys.stderr)
        return 1

    routes = args.routes or DEFAULT_ROUTES
    failed = False

    print(f'PageSpeed Insights · {args.strategy} · {args.runs} corrida(s) por ruta\n')

    for route in routes:
        url = f'{SITE}{route}'
        rows = [r for r in (run_psi(url, args.strategy, key) for _ in range(args.runs)) if r]
        if not rows:
            failed = True
            continue

        summaries = [summarise(r) for r in rows]
        score = statistics.median(s['score'] for s in summaries)

        print(f'{route}  ->  performance {score:.0f}')
        for _, label in METRICS:
            values = [s['metrics'][label] for s in summaries if s['metrics'][label] is not None]
            if not values:
                continue
            median = statistics.median(values)
            unit = '' if label == 'CLS' else ' ms'
            spread = ''
            if len(values) > 1:
                spread = f'   (min {min(values):.0f}, max {max(values):.0f})'
            print(f'    {label:5} {median:8.0f}{unit}{spread}' if label != 'CLS'
                  else f'    {label:5} {median:8.3f}{spread}')

        field = summaries[0].get('field')
        if field and any(v is not None for v in field.values()):
            print(f"    campo (usuarios reales, 28 dias): {field}")
        else:
            print('    campo: sin muestra suficiente en CrUX')
        print()

    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
