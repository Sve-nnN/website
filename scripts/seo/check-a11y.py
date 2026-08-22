#!/usr/bin/env python3
"""Verifica los tres fallos de accesibilidad del issue #10 sobre el HTML servido.

    python3 scripts/seo/check-a11y.py
    python3 scripts/seo/check-a11y.py /blog /servicios   # solo esas rutas

Por qué no Lighthouse: los tres audits (`aria-valid-attr-value`, `heading-order`,
`image-redundant-alt`) son reglas de axe que se resuelven mirando el markup, y
una corrida de Lighthouse cuesta ~2 minutos por ruta. Esto tarda segundos y da
el mismo veredicto sobre las 9 rutas afectadas. La corrida completa de
Lighthouse sigue siendo la medición de referencia para el rendimiento (#6),
donde sí hace falta un navegador de verdad.

Sale con código 1 si algo falla.
"""
import re
import subprocess
import sys
from html import unescape

SITE = 'https://juan-tech.com'

# Las rutas del baseline del issue #10, más /blog/development y /blog/seo que
# comparten plantilla con las otras del índice de blog.
DEFAULT_ROUTES = [
    '/blog',
    '/blog/cs-fundamentals',
    '/blog/development',
    '/blog/general',
    '/blog/seo',
    '/blog/tech-seo',
    '/servicios',
    '/seo-tecnico-madrid',
    '/seo-tecnico-lima',
]


def fetch(path: str) -> str:
    return subprocess.run(
        ['curl', '-sS', '--max-time', '40', f'{SITE}{path}'],
        capture_output=True,
        text=True,
    ).stdout


def strip_tags(fragment: str) -> str:
    return unescape(re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', fragment))).strip()


def check_aria_controls(html: str) -> list[str]:
    """10.1: todo `aria-controls` tiene que apuntar a un id que exista."""
    problems = []
    for target in sorted(set(re.findall(r'aria-controls="([^"]+)"', html))):
        if f'id="{target}"' not in html:
            problems.append(f'aria-controls="{target}" apunta a un id inexistente')
    return problems


def check_heading_order(html: str) -> list[str]:
    """10.2: ningún salto de nivel hacia abajo mayor a uno (h1 -> h3)."""
    levels = [
        (int(level), strip_tags(text)[:60])
        for level, text in re.findall(r'<h([1-6])[^>]*>(.*?)</h\1>', html, re.S)
    ]
    problems = []
    previous = None
    for level, text in levels:
        if previous is not None and level > previous + 1:
            problems.append(f'salto de h{previous} a h{level} en "{text}"')
        previous = level
    return problems


def check_redundant_alt(html: str) -> list[str]:
    """10.3: el `alt` de una imagen no debe repetir texto que ya está al lado.

    El caso real son las tarjetas de post: la imagen lleva como `alt` el mismo
    título que aparece como texto en la propia tarjeta, así que un lector de
    pantalla lo lee dos veces seguidas.
    """
    problems = []
    for alt in sorted({a for a in re.findall(r'<img[^>]+alt="([^"]{12,})"', html)}):
        text_without_alts = re.sub(r'alt="[^"]*"', '', html)
        if unescape(alt) in strip_tags(text_without_alts):
            problems.append(f'alt="{alt[:60]}" repite texto visible de la misma pagina')
    return problems


CHECKS = (
    ('aria-controls', check_aria_controls),
    ('heading-order', check_heading_order),
    ('alt-redundante', check_redundant_alt),
)


def main() -> int:
    routes = sys.argv[1:] or DEFAULT_ROUTES
    failed = False

    for route in routes:
        html = fetch(route)
        if not html:
            print(f'{route}: sin respuesta')
            failed = True
            continue

        findings = [(name, problems) for name, fn in CHECKS if (problems := fn(html))]

        if not findings:
            print(f'PASS  {route}')
            continue

        failed = True
        print(f'FAIL  {route}')
        for name, problems in findings:
            for problem in problems[:4]:
                print(f'        [{name}] {problem}')
            if len(problems) > 4:
                print(f'        [{name}] ... y {len(problems) - 4} mas')

    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
