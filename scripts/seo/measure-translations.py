#!/usr/bin/env python3
"""Mide cuánto le falta al inglés de cada post del blog (issue #7).

Compara el texto servido en /blog/<cat>/<slug> contra /en/blog/<cat>/<slug>,
sobre el HTML en vivo y no sobre la base: lo que importa es lo que ve Google.

    python3 scripts/seo/measure-translations.py
    python3 scripts/seo/measure-translations.py --json  # para procesarlo

Sale con código 1 si algún post está por debajo del 50%, que es el umbral con
el que se decidió sacarlos del índice inglés. Los que quedan entre 50% y 80%
se listan como pendientes de completar, sin hacer fallar la corrida: son
artículos completos con menos desarrollo, no páginas huecas.

La lista de `src/lib/translation-gaps.ts` sale de acá. Después de traducir un
post, corré esto de nuevo y borrá el slug de esa lista si ya pasa el umbral.
"""
import argparse
import html
import json
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

SITE = 'https://juan-tech.com'
NOINDEX_THRESHOLD = 0.50
COMPLETE_THRESHOLD = 0.80


def fetch_text(url: str) -> str:
    """Texto visible dentro de <main>, sin scripts ni estilos."""
    out = subprocess.run(
        ['curl', '-sS', '--max-time', '40', url], capture_output=True, text=True
    ).stdout
    match = re.search(r'<main.*?</main>', out, re.S)
    body = match.group(0) if match else out
    body = re.sub(r'<script.*?</script>', '', body, flags=re.S)
    body = re.sub(r'<style.*?</style>', '', body, flags=re.S)
    body = re.sub(r'<[^>]+>', ' ', body)
    return html.unescape(re.sub(r'\s+', ' ', body)).strip()


def post_paths() -> list[str]:
    sitemap = subprocess.run(
        ['curl', '-sS', '--max-time', '60', f'{SITE}/sitemap.xml'],
        capture_output=True,
        text=True,
    ).stdout
    locs = re.findall(r'<loc>([^<]+)</loc>', sitemap)
    paths = [u.replace(SITE, '') for u in locs if '/blog/' in u and '/en/' not in u]
    return sorted(p for p in paths if re.fullmatch(r'/blog/[a-z0-9-]+/[a-z0-9-]+', p))


def measure(path: str) -> dict:
    es = fetch_text(SITE + path)
    en = fetch_text(f'{SITE}/en{path}')
    es_words, en_words = len(es.split()), len(en.split())
    return {
        'path': path,
        'slug': path.rsplit('/', 1)[-1],
        'es': es_words,
        'en': en_words,
        'ratio': round(en_words / es_words, 3) if es_words else 0.0,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument('--json', action='store_true', help='salida JSON cruda')
    args = parser.parse_args()

    paths = post_paths()
    with ThreadPoolExecutor(max_workers=6) as pool:
        rows = list(pool.map(measure, paths))

    if args.json:
        json.dump(rows, sys.stdout, indent=2)
        return 0

    noindex = sorted((r for r in rows if r['ratio'] < NOINDEX_THRESHOLD), key=lambda r: r['ratio'])
    partial = sorted(
        (r for r in rows if NOINDEX_THRESHOLD <= r['ratio'] < COMPLETE_THRESHOLD),
        key=lambda r: r['ratio'],
    )

    print(f'{len(rows)} posts medidos contra {SITE}\n')

    print(f'== Bajo el {int(NOINDEX_THRESHOLD * 100)}%: fuera del indice ingles ==')
    for r in noindex:
        print(f"  {int(r['ratio'] * 100):3}%  ES {r['es']:5}  EN {r['en']:5}  {r['slug']}")

    print(f'\n== Entre {int(NOINDEX_THRESHOLD * 100)}% y {int(COMPLETE_THRESHOLD * 100)}%: a completar ==')
    for r in partial:
        print(f"  {int(r['ratio'] * 100):3}%  ES {r['es']:5}  EN {r['en']:5}  {r['slug']}")

    missing = sum(int(r['es'] * 0.9) - r['en'] for r in noindex + partial)
    print(f'\nPalabras que faltan para llegar al 90% del español: {missing:,}')

    return 1 if noindex else 0


if __name__ == '__main__':
    sys.exit(main())
