// Posts cuya versión en inglés está tan incompleta que no debería estar en el
// índice de Google (issue #7).
//
// Medición del 2026-08-20 sobre los 66 posts publicados, comparando el texto
// servido en /blog/... contra /en/blog/...: 27 tienen el inglés por debajo del
// 80% del español, y 10 por debajo del 50%. No es un corte de la migración —
// las versiones inglesas cierran bien, con secciones completas; les faltan
// secciones enteras del original. `xml-sitemap-automation` en inglés
// directamente no tiene cuerpo.
//
// Mientras esas páginas sigan indexadas, juan-tech.com/en le muestra a Google
// contenido delgado que compite con el español y no le sirve a nadie. Salen del
// índice hasta que se traduzcan; volver a entrar es borrar una línea de acá.
//
// Los 17 que están entre el 50% y el 80% NO entran en esta lista: son
// artículos completos con menos desarrollo, no páginas huecas. Se completan por
// tanda, priorizando por impresiones de Search Console.
//
// Segunda tanda (2026-08-25): hay una clase distinta de fallo que la medición
// por ratio no ve. Seis posts sirven el español ENTERO bajo /en por el fallback
// de locale de Payload, así que su ratio da ~100% y pasaban como traducciones
// perfectas. Search Console ya los había marcado: cuatro de los seis figuran
// como "Rastreada, actualmente sin indexar" (`seo-off-page-guia` no se
// re-rastrea desde el 17 de abril), y `tablas-hash` sí está indexada, o sea dos
// URLs con el mismo texto español compitiendo en el índice.
//
// Para volver a medir:
//   python3 scripts/seo/measure-translations.py
export const EN_TRANSLATION_INCOMPLETE: ReadonlySet<string> = new Set([
  // slug                            // % del ES, medido 2026-08-20
  'recursividad', //                    22%  (4368 -> 966)
  'xml-sitemap-automation', //          24%  (1681 -> 406), sin cuerpo en EN
  'hidratacion-web', //                 29%  (2982 -> 882)
  'complejidad-algoritmica', //         30%  (5624 -> 1719)
  'big-o-notation', //                  35%  (4733 -> 1674)
  'algoritmos-estructuras-datos', //    37%  (4625 -> 1749)
  'sql-vs-nosql', //                    40%  (4437 -> 1799)
  'react-19', //                        44%  (2153 -> 962)
  'robots-txt-best-practices', //       46%  (3504 -> 1614)
  'programacion-dinamica', //           48%  (3069 -> 1482)
  // Sin fila en `en`: la página sirve el español por el fallback de locale, o
  // sea que /en/blog/development/que-es-css es la versión española con el
  // chrome en inglés. Detectado el 2026-08-20 al escribir las meta
  // descriptions del issue #8.
  'que-es-css',

  // Mismo caso que `que-es-css`: sirven el español entero bajo /en. Detectados
  // el 2026-08-25 con la auditoría, seis a la vez.
  //
  // Por qué no los agarró la medición del 2026-08-20: ese pase comparaba solo
  // el ratio de longitud EN/ES, y una página que sirve el español verbatim da
  // ~100%. O sea que aparecían como las traducciones MÁS completas del blog.
  // `measure-translations.py` ahora mide también qué fracción de las oraciones
  // largas del español aparece tal cual bajo /en, que es lo que los separa.
  //
  // Medido el 2026-08-25 sobre el HTML servido, oraciones ES compartidas con
  // la versión inglesa. El control es `guia-eeat`, traducido de verdad: 0%.
  'estrategia-seo', //             88%  (4182 -> 4169 palabras)
  'technical-seo-guide', //        91%  (3664 -> 3634)
  'estrategia-de-contenidos', //   86%  (3776 -> 3763)
  'seo-off-page-guia', //          86%  (3753 -> 3740)
  'tablas-hash', //                85%  (3243 -> 3136)
  'mejores-cursos-seo-espanol', // 59%  (1292 -> 1279)
])

/** ¿Esta URL debe quedar fuera del índice por traducción incompleta? */
export function isEnTranslationIncomplete(locale: string, slug: string | undefined): boolean {
  return locale === 'en' && !!slug && EN_TRANSLATION_INCOMPLETE.has(slug)
}
