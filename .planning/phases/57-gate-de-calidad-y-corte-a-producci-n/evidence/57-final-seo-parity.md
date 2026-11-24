# Paridad SEO del preview contra producción

Generado 2026-11-24T05:56:34.533Z con `scripts/verify/57-seo-parity-all.mjs`. Preview https://dev.juan-tech.com, producción https://juan-tech.com.

Resultado: **FAIL**. 170 de 174 URLs sin diferencias (166 del sitemap de producción, 6 fuera del sitemap, 2 rutas nuevas). Diferencias totales: 4 (b: 2, sin-clasificar: 2).

Clases: **a** se corrige en 57-06; **b** diferencia legítima del rediseño que Juan acepta por escrito en 57-09; **c** falso positivo del extractor, corregido en el script.

## Diferencias por URL

| URL | Campo | Detalle | Clase | Motivo |
|---|---|---|---|---|
| /blog/general | palabras | palabras en main: 120 contra 135 en producción (11.1% menos; tolerancia 2%) | b | Categoría general vacía: el rediseño quita el contador "0 artículos" y la fila repetida "Otros temas del blog" con sus cuatro enlaces. El copy propio de la página es idéntico. Juan lo acepta en 57-09 |
| /en/blog/general | palabras | palabras en main: 124 contra 138 en producción (10.1% menos; tolerancia 2%) | b | Categoría general vacía: el rediseño quita el contador "0 artículos" y la fila repetida "Otros temas del blog" con sus cuatro enlaces. El copy propio de la página es idéntico. Juan lo acepta en 57-09 |
| /blog/confirm | estado | el preview responde 500 (producción 200) | sin-clasificar |  |
| /en/blog/confirm | estado | el preview responde 500 (producción 200) | sin-clasificar |  |

## Presupuesto del autor (F5)

- /authors/juan-carlos-angulo: 360441 bytes en el preview, 2785008 en producción, límite 500000: PASS
- /en/authors/juan-carlos-angulo: 354390 bytes en el preview, 2247901 en producción, límite 500000: PASS

## Enlaces internos (F4 y F12)

Destinos revisados en el preview: 177. Fallos: 0. Enlaces a gemelos noindex en producción (referencia): 14.

## Peso de HTML por plantilla (bytes sin comprimir)

| Plantilla | URLs | Preview medio | Producción medio | Preview máximo | Producción máximo |
|---|---|---|---|---|---|
| stack | 2 | 231721 | 172721 | 233153 | 173785 |
| landing-local | 4 | 210118 | 101870 | 216829 | 103585 |
| servicio | 8 | 286508 | 182239 | 303109 | 190799 |
| servicios | 4 | 192737 | 86792 | 193524 | 87462 |
| legal | 4 | 164282 | 66666 | 174539 | 68292 |
| contacto | 2 | 189398 | 71124 | 190004 | 71436 |
| blog | 2 | 263531 | 151029 | 265434 | 151610 |
| home | 2 | 368249 | 205063 | 369715 | 205702 |
| post | 96 | 309260 | 338505 | 469082 | 594585 |
| caso | 14 | 242076 | 113711 | 247585 | 116604 |
| autor | 2 | 357416 | 2516455 | 360441 | 2785008 |
| sitio | 12 | 217348 | 75220 | 219297 | 76118 |
| blog-categoria | 10 | 168211 | 127993 | 185610 | 159154 |
| sitios | 2 | 206500 | 70653 | 207132 | 70950 |
| casos | 2 | 184444 | 80545 | 185231 | 80978 |
| autores | 2 | 162180 | 62811 | 162415 | 63068 |
| busqueda | 2 | 132071 | 60071 | 132631 | 60294 |
| blog-confirmacion | 2 | 86801 | 56551 | 87326 | 56783 |
| sobre-mi | 2 | 207674 | 5316 | 209568 | 5319 |

## Todas las URLs

| URL | Origen | Estado preview | Palabras main preview / producción | Resultado |
|---|---|---|---|---|
| /stack | sitemap | 200 | 2323 / 2070 | PASS |
| /en/stack | sitemap | 200 | 2219 / 1995 | PASS |
| /seo-tecnico-madrid | sitemap | 200 | 578 / 544 | PASS |
| /en/seo-tecnico-madrid | sitemap | 200 | 538 / 507 | PASS |
| /seo-tecnico-lima | sitemap | 200 | 569 / 536 | PASS |
| /en/seo-tecnico-lima | sitemap | 200 | 536 / 506 | PASS |
| /servicios/ai-seo-geo | sitemap | 200 | 796 / 738 | PASS |
| /en/services/ai-seo-geo | sitemap | 200 | 769 / 710 | PASS |
| /servicios/fullstack-development | sitemap | 200 | 846 / 785 | PASS |
| /en/services/fullstack-development | sitemap | 200 | 793 / 732 | PASS |
| /servicios/seo-consulting | sitemap | 200 | 884 / 814 | PASS |
| /en/services/seo-consulting | sitemap | 200 | 836 / 767 | PASS |
| /servicios/seo-technical-audit | sitemap | 200 | 916 / 856 | PASS |
| /en/services/seo-technical-audit | sitemap | 200 | 898 / 836 | PASS |
| /servicios | sitemap | 200 | 432 / 149 | PASS |
| /en/services | sitemap | 200 | 427 / 150 | PASS |
| /terms | sitemap | 200 | 552 / 163 | PASS |
| /en/terms | sitemap | 200 | 583 / 158 | PASS |
| /privacy | sitemap | 200 | 1206 / 328 | PASS |
| /en/privacy | sitemap | 200 | 1277 / 317 | PASS |
| /contact | sitemap | 200 | 254 / 45 | PASS |
| /en/contact | sitemap | 200 | 288 / 42 | PASS |
| /blog | sitemap | 200 | 1048 / 700 | PASS |
| /en/blog | sitemap | 200 | 951 / 655 | PASS |
| / | sitemap | 200 | 1525 / 975 | PASS |
| /en | sitemap | 200 | 1552 / 983 | PASS |
| /blog/cs-fundamentals/complejidad-algoritmica | sitemap | 200 | 7078 / 6251 | PASS |
| /blog/development/sql-vs-nosql | sitemap | 200 | 4836 / 4391 | PASS |
| /blog/cs-fundamentals/algoritmos-ordenamiento | sitemap | 200 | 5562 / 5227 | PASS |
| /en/blog/cs-fundamentals/algoritmos-ordenamiento | sitemap | 200 | 3887 / 3624 | PASS |
| /blog/cs-fundamentals/arboles-binarios | sitemap | 200 | 4461 / 4091 | PASS |
| /en/blog/cs-fundamentals/arboles-binarios | sitemap | 200 | 3789 / 3468 | PASS |
| /blog/cs-fundamentals/diseno-bases-datos | sitemap | 200 | 5312 / 4663 | PASS |
| /en/blog/cs-fundamentals/diseno-bases-datos | sitemap | 200 | 4083 / 3669 | PASS |
| /blog/cs-fundamentals/normalizacion-bases-datos | sitemap | 200 | 3790 / 3401 | PASS |
| /en/blog/cs-fundamentals/normalizacion-bases-datos | sitemap | 200 | 2956 / 2729 | PASS |
| /blog/seo/guia-eeat | sitemap | 200 | 1835 / 1642 | PASS |
| /en/blog/seo/guia-eeat | sitemap | 200 | 3415 / 3042 | PASS |
| /blog/seo/enlaces-internos-guia | sitemap | 200 | 3878 / 3458 | PASS |
| /en/blog/seo/enlaces-internos-guia | sitemap | 200 | 2551 / 2339 | PASS |
| /blog/seo/guia-keyword-research | sitemap | 200 | 2308 / 2118 | PASS |
| /en/blog/seo/guia-keyword-research | sitemap | 200 | 1991 / 1812 | PASS |
| /blog/seo/redaccion-seo | sitemap | 200 | 4519 / 3950 | PASS |
| /en/blog/seo/redaccion-seo | sitemap | 200 | 3385 / 3072 | PASS |
| /blog/development/experiencia-de-usuario | sitemap | 200 | 4407 / 4194 | PASS |
| /en/blog/development/experiencia-de-usuario | sitemap | 200 | 2941 / 2673 | PASS |
| /blog/seo/mejores-cursos-seo-espanol | sitemap | 200 | 1363 / 1248 | PASS |
| /blog/development/que-es-css | sitemap | 200 | 1291 / 1172 | PASS |
| /blog/cs-fundamentals/tablas-hash | sitemap | 200 | 3242 / 3198 | PASS |
| /blog/tech-seo/non-developers-guide | sitemap | 200 | 3288 / 2890 | PASS |
| /en/blog/tech-seo/non-developers-guide | sitemap | 200 | 1783 / 1675 | PASS |
| /blog/tech-seo/web-performance-guide | sitemap | 200 | 2220 / 2010 | PASS |
| /en/blog/tech-seo/web-performance-guide | sitemap | 200 | 1554 / 1437 | PASS |
| /blog/tech-seo/core-web-vitals-guide | sitemap | 200 | 3569 / 3204 | PASS |
| /en/blog/tech-seo/core-web-vitals-guide | sitemap | 200 | 2983 / 2658 | PASS |
| /blog/tech-seo/robots-txt-best-practices | sitemap | 200 | 3888 / 3498 | PASS |
| /blog/tech-seo/schema-markup-guide | sitemap | 200 | 3726 / 3439 | PASS |
| /en/blog/tech-seo/schema-markup-guide | sitemap | 200 | 3282 / 2909 | PASS |
| /blog/tech-seo/ssr-vs-csr-seo | sitemap | 200 | 1487 / 1405 | PASS |
| /en/blog/tech-seo/ssr-vs-csr-seo | sitemap | 200 | 3712 / 3329 | PASS |
| /blog/tech-seo/xml-sitemap-automation | sitemap | 200 | 1811 / 1688 | PASS |
| /blog/tech-seo/headless-cms-seo | sitemap | 200 | 3612 / 3171 | PASS |
| /en/blog/tech-seo/headless-cms-seo | sitemap | 200 | 2650 / 2400 | PASS |
| /blog/seo/topic-clusters-seo | sitemap | 200 | 2850 / 2317 | PASS |
| /en/blog/seo/topic-clusters-seo | sitemap | 200 | 2163 / 1987 | PASS |
| /blog/seo/estrategia-de-contenidos | sitemap | 200 | 4167 / 3718 | PASS |
| /blog/seo/estrategia-seo | sitemap | 200 | 4708 / 4151 | PASS |
| /blog/seo/seo-off-page-guia | sitemap | 200 | 4156 / 3678 | PASS |
| /blog/seo/pillar-page-seo | sitemap | 200 | 2270 / 2131 | PASS |
| /en/blog/seo/pillar-page-seo | sitemap | 200 | 3308 / 2969 | PASS |
| /blog/cs-fundamentals/data-structures | sitemap | 200 | 3527 / 3137 | PASS |
| /en/blog/cs-fundamentals/data-structures | sitemap | 200 | 3161 / 2840 | PASS |
| /blog/cs-fundamentals/binary-search-tree | sitemap | 200 | 2696 / 2317 | PASS |
| /en/blog/cs-fundamentals/binary-search-tree | sitemap | 200 | 1383 / 1268 | PASS |
| /blog/cs-fundamentals/dynamic-programming | sitemap | 200 | 2682 / 2501 | PASS |
| /en/blog/cs-fundamentals/dynamic-programming | sitemap | 200 | 2449 / 2216 | PASS |
| /blog/cs-fundamentals/graph-algorithms | sitemap | 200 | 2120 / 2031 | PASS |
| /en/blog/cs-fundamentals/graph-algorithms | sitemap | 200 | 2469 / 2256 | PASS |
| /blog/cs-fundamentals/heap-data-structure | sitemap | 200 | 2048 / 1884 | PASS |
| /en/blog/cs-fundamentals/heap-data-structure | sitemap | 200 | 1978 / 1819 | PASS |
| /blog/cs-fundamentals/merge-sort-python | sitemap | 200 | 2017 / 1872 | PASS |
| /en/blog/cs-fundamentals/merge-sort-python | sitemap | 200 | 1978 / 1863 | PASS |
| /blog/cs-fundamentals/queue-data-structure | sitemap | 200 | 2595 / 2329 | PASS |
| /en/blog/cs-fundamentals/queue-data-structure | sitemap | 200 | 1632 / 1520 | PASS |
| /blog/cs-fundamentals/quicksort-python | sitemap | 200 | 2448 / 2200 | PASS |
| /en/blog/cs-fundamentals/quicksort-python | sitemap | 200 | 2937 / 2759 | PASS |
| /blog/cs-fundamentals/space-complexity | sitemap | 200 | 2436 / 2204 | PASS |
| /en/blog/cs-fundamentals/space-complexity | sitemap | 200 | 2242 / 2025 | PASS |
| /blog/cs-fundamentals/time-complexity | sitemap | 200 | 1655 / 1506 | PASS |
| /en/blog/cs-fundamentals/time-complexity | sitemap | 200 | 2532 / 2273 | PASS |
| /blog/cs-fundamentals/tree-traversal | sitemap | 200 | 2474 / 2078 | PASS |
| /en/blog/cs-fundamentals/tree-traversal | sitemap | 200 | 1566 / 1465 | PASS |
| /blog/development/astro-vs-nextjs | sitemap | 200 | 2534 / 2260 | PASS |
| /en/blog/development/astro-vs-nextjs | sitemap | 200 | 3695 / 3425 | PASS |
| /blog/development/headless-cms-comparison | sitemap | 200 | 2719 / 2345 | PASS |
| /en/blog/development/headless-cms-comparison | sitemap | 200 | 1788 / 1666 | PASS |
| /blog/development/nextjs-cms | sitemap | 200 | 2608 / 2233 | PASS |
| /en/blog/development/nextjs-cms | sitemap | 200 | 3836 / 3422 | PASS |
| /blog/development/payload-cms-guide | sitemap | 200 | 2095 / 1963 | PASS |
| /en/blog/development/payload-cms-guide | sitemap | 200 | 1900 / 1754 | PASS |
| /blog/tech-seo/auditoria-seo | sitemap | 200 | 3098 / 2759 | PASS |
| /en/blog/tech-seo/auditoria-seo | sitemap | 200 | 2688 / 2404 | PASS |
| /blog/tech-seo/nextjs-seo | sitemap | 200 | 2614 / 2153 | PASS |
| /en/blog/tech-seo/nextjs-seo | sitemap | 200 | 1882 / 1700 | PASS |
| /blog/tech-seo/seo-on-page-guia | sitemap | 200 | 3733 / 3338 | PASS |
| /en/blog/tech-seo/seo-on-page-guia | sitemap | 200 | 3243 / 2906 | PASS |
| /blog/tech-seo/structured-data-seo | sitemap | 200 | 3991 / 3409 | PASS |
| /en/blog/tech-seo/structured-data-seo | sitemap | 200 | 3324 / 2987 | PASS |
| /blog/tech-seo/technical-seo-checklist | sitemap | 200 | 2941 / 2617 | PASS |
| /en/blog/tech-seo/technical-seo-checklist | sitemap | 200 | 3162 / 2915 | PASS |
| /blog/tech-seo/technical-seo-guide | sitemap | 200 | 3645 / 3672 | PASS |
| /blog/cs-fundamentals/pilas-y-colas | sitemap | 200 | 1952 / 1850 | PASS |
| /en/blog/cs-fundamentals/pilas-y-colas | sitemap | 200 | 1124 / 1012 | PASS |
| /blog/cs-fundamentals/recursividad | sitemap | 200 | 4661 / 4332 | PASS |
| /blog/development/hidratacion-web | sitemap | 200 | 3243 / 2991 | PASS |
| /blog/development/react-19 | sitemap | 200 | 2320 / 2156 | PASS |
| /blog/seo/canibalizacion-seo | sitemap | 200 | 2392 / 2153 | PASS |
| /en/blog/seo/canibalizacion-seo | sitemap | 200 | 1226 / 1090 | PASS |
| /blog/tech-seo/guia-google-search-console | sitemap | 200 | 1996 / 1812 | PASS |
| /en/blog/tech-seo/guia-google-search-console | sitemap | 200 | 1500 / 1467 | PASS |
| /blog/tech-seo/javascript-seo | sitemap | 200 | 1534 / 1435 | PASS |
| /en/blog/tech-seo/javascript-seo | sitemap | 200 | 1423 / 1333 | PASS |
| /case-studies/pittsburgh-criminal-defense-legal-content-seo | sitemap | 200 | 989 / 599 | PASS |
| /en/case-studies/pittsburgh-criminal-defense-legal-content-seo | sitemap | 200 | 869 / 502 | PASS |
| /case-studies/fabricante-baldosa-hidraulica-seo-espana | sitemap | 200 | 920 / 530 | PASS |
| /en/case-studies/fabricante-baldosa-hidraulica-seo-espana | sitemap | 200 | 828 / 461 | PASS |
| /case-studies/immigration-law-atlanta-seo | sitemap | 200 | 965 / 567 | PASS |
| /en/case-studies/immigration-law-atlanta-seo | sitemap | 200 | 857 / 486 | PASS |
| /case-studies/talleres-costura-miami-lanzamiento-seo-local | sitemap | 200 | 928 / 517 | PASS |
| /en/case-studies/talleres-costura-miami-lanzamiento-seo-local | sitemap | 200 | 844 / 458 | PASS |
| /case-studies/urologo-seo-local-salud-santiago-rd | sitemap | 200 | 910 / 512 | PASS |
| /en/case-studies/urologo-seo-local-salud-santiago-rd | sitemap | 200 | 815 / 443 | PASS |
| /case-studies/edtech-financiera-infantil-crecimiento-organico-seo | sitemap | 200 | 996 / 595 | PASS |
| /en/case-studies/edtech-financiera-infantil-crecimiento-organico-seo | sitemap | 200 | 889 / 515 | PASS |
| /case-studies/migracion-ecommerce-nextjs-seo-tecnico | sitemap | 200 | 692 / 473 | PASS |
| /en/case-studies/migracion-ecommerce-nextjs-seo-tecnico | sitemap | 200 | 618 / 413 | PASS |
| /authors/juan-carlos-angulo | sitemap | 200 | 2986 / 2320 | PASS |
| /en/authors/juan-carlos-angulo | sitemap | 200 | 2494 / 1953 | PASS |
| /websites/juan-tech-com | sitemap | 200 | 277 / 80 | PASS |
| /en/websites/juan-tech-com | sitemap | 200 | 279 / 78 | PASS |
| /websites/apturio-com | sitemap | 200 | 275 / 71 | PASS |
| /en/websites/apturio-com | sitemap | 200 | 275 / 67 | PASS |
| /websites/drmanuelvargashidalgo-com | sitemap | 200 | 269 / 79 | PASS |
| /en/websites/drmanuelvargashidalgo-com | sitemap | 200 | 266 / 72 | PASS |
| /websites/estylopia-com | sitemap | 200 | 270 / 68 | PASS |
| /en/websites/estylopia-com | sitemap | 200 | 265 / 59 | PASS |
| /websites/aprendoclub-com | sitemap | 200 | 272 / 72 | PASS |
| /en/websites/aprendoclub-com | sitemap | 200 | 268 / 64 | PASS |
| /websites/ariannalupi-com | sitemap | 200 | 282 / 88 | PASS |
| /en/websites/ariannalupi-com | sitemap | 200 | 276 / 78 | PASS |
| /blog/tech-seo | sitemap | 200 | 677 / 644 | PASS |
| /en/blog/tech-seo | sitemap | 200 | 616 / 614 | PASS |
| /blog/cs-fundamentals | sitemap | 200 | 812 / 806 | PASS |
| /en/blog/cs-fundamentals | sitemap | 200 | 610 / 605 | PASS |
| /blog/general | sitemap | 200 | 120 / 135 | FAIL (palabras) |
| /en/blog/general | sitemap | 200 | 124 / 138 | FAIL (palabras) |
| /blog/development | sitemap | 200 | 399 / 379 | PASS |
| /en/blog/development | sitemap | 200 | 323 / 320 | PASS |
| /blog/seo | sitemap | 200 | 688 / 670 | PASS |
| /en/blog/seo | sitemap | 200 | 628 / 631 | PASS |
| /websites | sitemap | 200 | 310 / 56 | PASS |
| /en/websites | sitemap | 200 | 311 / 53 | PASS |
| /case-studies | sitemap | 200 | 362 / 191 | PASS |
| /en/case-studies | sitemap | 200 | 344 / 175 | PASS |
| /authors | sitemap | 200 | 104 / 13 | PASS |
| /en/authors | sitemap | 200 | 141 / 11 | PASS |
| /search | fuera-del-sitemap | 200 | 9 / 2 | PASS |
| /en/search | fuera-del-sitemap | 200 | 8 / 2 | PASS |
| /blog/confirm | fuera-del-sitemap | 500 | - / - | FAIL (estado) |
| /en/blog/confirm | fuera-del-sitemap | 500 | - / - | FAIL (estado) |
| /services | fuera-del-sitemap | 200 | 432 / 149 | PASS |
| /en/servicios | fuera-del-sitemap | 200 | 427 / 150 | PASS |
| /sobre-mi | nueva | 200 | 556 / - | PASS |
| /en/sobre-mi | nueva | 200 | 512 / - | PASS |
