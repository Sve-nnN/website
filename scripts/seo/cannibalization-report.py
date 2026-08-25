#!/usr/bin/env python3
"""Reúne, por cada grupo canibalizado del issue #5, lo que se puede medir sin GSC.

    python3 scripts/seo/cannibalization-report.py

Qué NO hace: elegir la ganadora. Esa decisión la manda Search Console — gana la
URL que ya tiene impresiones o clics, no la más larga ni la más enlazada.
Consolidar hacia la URL equivocada tira la señal que ya existe, y eso no se
recupera con un 301.

Qué sí hace: dejar todo lo demás listo para el momento en que haya datos.

- **Enlaces internos entrantes**: recorre el árbol español del blog y cuenta
  cuántas páginas apuntan a cada candidata. Es la señal de autoridad interna
  que hoy sostiene a cada URL, y también la lista de lo que hay que reescribir
  cuando una gane, porque un 301 que deja los enlaces viejos apuntando al
  redirect es trabajo a medias.
- **Palabras y fecha de publicación**: cuánto contenido habría que fusionar y
  cuál es la más vieja (a igualdad de todo lo demás, la antigüedad suele venir
  con enlaces externos que no vemos desde acá).
- **Estado HTTP**: por si alguna ya redirige y el issue quedó desactualizado.
"""
import html
import re
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

SITE = 'https://juan-tech.com'

GROUPS: dict[str, list[str]] = {
    'copywriting SEO (triple)': [
        '/blog/seo/seo-copywriting',
        '/blog/seo/seo-copywriting-guide',
        '/blog/seo/redaccion-seo',
    ],
    'estrategia de contenidos': [
        '/blog/seo/estrategia-de-contenidos',
        '/blog/seo/seo-content-strategy',
    ],
    'topic clusters': [
        '/blog/seo/estrategia-topic-clusters',
        '/blog/seo/topic-clusters-seo',
    ],
    'guia SEO tecnico': [
        '/blog/tech-seo/tech-seo-guide',
        '/blog/tech-seo/technical-seo-guide',
    ],
    'pillar page': [
        '/blog/seo/content-pillar',
        '/blog/seo/pillar-page-seo',
    ],
    'keyword research': [
        '/blog/seo/guia-keyword-research',
        '/blog/seo/keyword-research-guide',
    ],
    'next.js SEO': [
        '/blog/tech-seo/nextjs-seo',
        '/blog/tech-seo/nextjs-seo-optimization',
    ],
}


def curl(url: str) -> str:
    """Con reintentos: el VPS corta conexiones bajo rafaga.

    Medido el 2026-08-23 recorriendo 71 paginas con 6 hilos: aparecen
    `SSL connection timeout` y `Recv failure: Connection reset by peer`
    sueltos. Sin reintento, esas respuestas vuelven vacias y el reporte dice
    "0 palabras" para una pagina que responde 200 perfecto — un cero que se
    lee como un hallazgo y no como lo que es, un error de red.
    """
    for _ in range(3):
        out = subprocess.run(
            ['curl', '-sS', '--max-time', '45', '--retry', '2', '--retry-delay', '1', url],
            capture_output=True,
            text=True,
        ).stdout
        if len(out) > 500:
            return out
    return ''


def status(path: str) -> str:
    out = subprocess.run(
        ['curl', '-sS', '-o', '/dev/null', '-w', '%{http_code} %{redirect_url}',
         '--max-time', '40', f'{SITE}{path}'],
        capture_output=True,
        text=True,
    ).stdout.strip()
    return out


def all_blog_paths() -> list[str]:
    sitemap = curl(f'{SITE}/sitemap.xml')
    locs = re.findall(r'<loc>([^<]+)</loc>', sitemap)
    paths = {u.replace(SITE, '') for u in locs if '/blog/' in u and '/en/' not in u}
    return sorted(paths)


def page_facts(path: str) -> dict:
    body = curl(f'{SITE}{path}')
    if not body:
        return {'words': -1, 'published': 'sin respuesta', 'title': '?', 'links': set()}

    main = re.search(r'<main.*?</main>', body, re.S)
    article = main.group(0) if main else body
    text = re.sub(r'<script.*?</script>', '', article, flags=re.S)
    text = html.unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', text)))

    published = re.search(r'"datePublished":"([^"]+)"', body)
    title = re.search(r'<title>(.*?)</title>', body, re.S)

    return {
        'words': len(text.split()),
        'published': (published.group(1)[:10] if published else '?'),
        'title': html.unescape(title.group(1)).strip()[:70] if title else '?',
        'links': set(re.findall(r'href="(/blog/[a-z0-9-]+/[a-z0-9-]+)"', body)),
    }


def main() -> int:
    candidates = [p for paths in GROUPS.values() for p in paths]

    print(f'Rastreando el arbol español del blog para contar enlaces internos...')
    blog_paths = all_blog_paths()
    # Tres hilos y no seis: con seis, el VPS empieza a cortar conexiones.
    with ThreadPoolExecutor(max_workers=3) as pool:
        facts = dict(zip(blog_paths, pool.map(page_facts, blog_paths)))

    inbound: dict[str, list[str]] = {c: [] for c in candidates}
    for source, data in facts.items():
        for target in data['links']:
            if target in inbound and target != source:
                inbound[target].append(source)

    print(f'{len(blog_paths)} paginas rastreadas\n')

    for group, paths in GROUPS.items():
        print(f'== {group} ==')
        for path in paths:
            data = facts.get(path)
            if data is None:
                print(f'  {path}: no esta en el sitemap  ({status(path)})')
                continue
            links = inbound.get(path, [])
            print(f'  {path}')
            print(
                f'      {data["words"]:5} palabras   publicado {data["published"]}'
                f'   enlaces internos: {len(links)}'
            )
            for link in sorted(links)[:4]:
                print(f'         <- {link}')
            if len(links) > 4:
                print(f'         <- ... y {len(links) - 4} mas')
        print()

    print('La ganadora de cada grupo la decide Search Console, no esta tabla.')
    print('Esto es para saber que hay que fusionar y que enlaces reescribir despues.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
