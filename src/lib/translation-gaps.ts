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
])

/** ¿Esta URL debe quedar fuera del índice por traducción incompleta? */
export function isEnTranslationIncomplete(locale: string, slug: string | undefined): boolean {
  return locale === 'en' && !!slug && EN_TRANSLATION_INCOMPLETE.has(slug)
}
