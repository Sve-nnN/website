#!/usr/bin/env node
// Test del parseo del header `Link` que hace src/middleware.ts.
//
// El riesgo real de ese fix no es la idea (borrar los alternates de next-intl
// y dejar el <head> como unica anotacion), es el split: un header `Link` trae
// varias entradas separadas por coma, y las propias entradas contienen comas
// dentro de sus parametros. Un split ingenuo por "," parte una entrada al medio
// y se lleva puesto un preload de fuente.
//
// Este archivo replica la funcion tal cual esta en el middleware. Si la tocas
// alla, tocala aca. No se importa directamente porque el middleware corre en el
// runtime Edge de Next y arrastra next-intl al importarlo.
//
// Uso: node scripts/verify-link-header-strip.mjs

function stripAlternates(link) {
  if (!link) return link

  const kept = link
    .split(/,\s*(?=<)/)
    .filter((entry) => !/rel="?alternate"?/i.test(entry))
    .join(', ')

  return kept || null
}

const CASES = [
  {
    name: 'quita los tres alternates que emite next-intl',
    input:
      '<https://juan-tech.com/servicios>; rel="alternate"; hreflang="es", ' +
      '<https://juan-tech.com/en/servicios>; rel="alternate"; hreflang="en", ' +
      '<https://juan-tech.com/servicios>; rel="alternate"; hreflang="x-default"',
    expect: null,
  },
  {
    name: 'conserva los preload de fuentes intactos',
    input:
      '</_next/static/media/0b78ff376f6b9734-s.p.woff2>; rel=preload; as="font"; crossorigin=""; type="font/woff2", ' +
      '</_next/static/css/322aed48714b98cd.css>; rel=preload; as="style"',
    expect:
      '</_next/static/media/0b78ff376f6b9734-s.p.woff2>; rel=preload; as="font"; crossorigin=""; type="font/woff2", ' +
      '</_next/static/css/322aed48714b98cd.css>; rel=preload; as="style"',
  },
  {
    name: 'mezcla: quita alternates y deja el resto',
    input:
      '<https://juan-tech.com/servicios>; rel="alternate"; hreflang="es", ' +
      '</_next/static/css/x.css>; rel=preload; as="style", ' +
      '<https://juan-tech.com/en/services>; rel="alternate"; hreflang="en"',
    expect: '</_next/static/css/x.css>; rel=preload; as="style"',
  },
  {
    name: 'acepta rel sin comillas',
    input: '<https://juan-tech.com/servicios>; rel=alternate; hreflang=es',
    expect: null,
  },
  {
    name: 'no rompe con header ausente',
    input: null,
    expect: null,
  },
  {
    name: 'una entrada con coma dentro de un parametro no se parte al medio',
    input: '</a.woff2>; rel=preload; as="font"; type="font/woff2, x", </b.css>; rel=preload',
    expect: '</a.woff2>; rel=preload; as="font"; type="font/woff2, x", </b.css>; rel=preload',
  },
]

let failed = 0
for (const c of CASES) {
  const got = stripAlternates(c.input)
  if (got === c.expect) {
    console.log(`  PASS  ${c.name}`)
  } else {
    failed++
    console.log(`  FAIL  ${c.name}`)
    console.log(`          esperado: ${JSON.stringify(c.expect)}`)
    console.log(`          obtenido: ${JSON.stringify(got)}`)
  }
}

console.log()
if (failed) {
  console.log(`${CASES.length} casos, ${failed} fallan.`)
  process.exit(1)
}
console.log(`${CASES.length} casos, todos pasan.`)
