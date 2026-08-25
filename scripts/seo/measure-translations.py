#!/usr/bin/env python3
"""Mide cuánto le falta al inglés de cada post del blog (issue #7).

Compara el texto servido en /blog/<cat>/<slug> contra /en/blog/<cat>/<slug>,
sobre el HTML en vivo y no sobre la base: lo que importa es lo que ve Google.

    python3 scripts/seo/measure-translations.py
    python3 scripts/seo/measure-translations.py --json  # para procesarlo

Mide dos cosas distintas, porque el ratio solo no alcanza:

1. Ratio de longitud EN/ES. Detecta traducciones truncadas.
2. Oraciones del español que aparecen TAL CUAL bajo /en. Detecta páginas que
   directamente sirven el español por el fallback de locale de Payload.

El punto 2 se agregó el 2026-08-25. La corrida del 2026-08-20 usaba solo el
ratio y por eso se le escaparon seis posts: una página que sirve el español
verbatim puntúa ~100% de ratio, o sea aparece como la traducción más perfecta
del sitio. Search Console ya los había marcado "Rastreada, actualmente sin
indexar", que es Google diciendo lo mismo por otro canal.

Sale con código 1 si algún post sirve español bajo /en o si está por debajo del
50% del original, que es el umbral con el que se decidió sacarlos del índice
inglés. Los que quedan entre 50% y 80% se listan como pendientes de completar,
sin hacer fallar la corrida: son artículos completos con menos desarrollo, no
páginas huecas.

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
# Fracción de oraciones largas del español que aparecen TAL CUAL en la versión
# inglesa. El control medido el 2026-08-25 sobre `guia-eeat`, que sí está
# traducido de verdad, dio 0%. Los seis posts que servían español dieron entre
# 59% y 91%. 30% deja margen de sobra entre los dos casos.
SHARED_THRESHOLD = 0.30


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


def long_sentences(text: str) -> set[str]:
    """Oraciones de más de 8 palabras. Las cortas dan falsos positivos: nombres
    de producto, encabezados y fragmentos de código coinciden entre idiomas."""
    return {
        s.strip() for s in re.split(r'(?<=[.!?])\s+', text) if len(s.split()) > 8
    }


def measure(path: str) -> dict:
    es = fetch_text(SITE + path)
    en = fetch_text(f'{SITE}/en{path}')
    es_words, en_words = len(es.split()), len(en.split())
    es_sentences = long_sentences(es)
    shared = (
        len(es_sentences & long_sentences(en)) / len(es_sentences) if es_sentences else 0.0
    )
    return {
        'path': path,
        'slug': path.rsplit('/', 1)[-1],
        'es': es_words,
        'en': en_words,
        'ratio': round(en_words / es_words, 3) if es_words else 0.0,
        'shared': round(shared, 3),
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

    untranslated = sorted(
        (r for r in rows if r['shared'] >= SHARED_THRESHOLD),
        key=lambda r: -r['shared'],
    )
    untranslated_slugs = {r['slug'] for r in untranslated}
    # Un post que sirve el español no entra además en los cortes por ratio: su
    # ratio es ~100% justamente porque el texto es el mismo, y aparecería como
    # traducción perfecta.
    scored = [r for r in rows if r['slug'] not in untranslated_slugs]

    noindex = sorted((r for r in scored if r['ratio'] < NOINDEX_THRESHOLD), key=lambda r: r['ratio'])
    partial = sorted(
        (r for r in scored if NOINDEX_THRESHOLD <= r['ratio'] < COMPLETE_THRESHOLD),
        key=lambda r: r['ratio'],
    )

    print(f'{len(rows)} posts medidos contra {SITE}\n')

    print('== Sirven el español bajo /en: fuera del indice ingles ==')
    for r in untranslated:
        print(
            f"  {int(r['shared'] * 100):3}% de oraciones ES compartidas  "
            f"ratio {int(r['ratio'] * 100):3}%  {r['slug']}"
        )

    print(f'\n== Bajo el {int(NOINDEX_THRESHOLD * 100)}%: fuera del indice ingles ==')
    for r in noindex:
        print(f"  {int(r['ratio'] * 100):3}%  ES {r['es']:5}  EN {r['en']:5}  {r['slug']}")

    print(f'\n== Entre {int(NOINDEX_THRESHOLD * 100)}% y {int(COMPLETE_THRESHOLD * 100)}%: a completar ==')
    for r in partial:
        print(f"  {int(r['ratio'] * 100):3}%  ES {r['es']:5}  EN {r['en']:5}  {r['slug']}")

    missing = sum(int(r['es'] * 0.9) - r['en'] for r in untranslated + noindex + partial)
    print(f'\nPalabras que faltan para llegar al 90% del español: {missing:,}')

    return 1 if (untranslated or noindex) else 0


if __name__ == '__main__':
    sys.exit(main())
