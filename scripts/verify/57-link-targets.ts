/**
 * Prueba de destinos de enlace (plan 57-06, D-04 F4 y enlaces rotos de 57-02).
 *
 * `isPrefixableHref` decide si un href interno recibe el prefijo `/en` en las
 * páginas en inglés. Debe negarlo para los archivos de la raíz (sitemap.html,
 * llms.txt, llms-full.txt), para api, admin y go, y para los posts con la
 * traducción EN incompleta (su gemelo EN es noindex: el enlace va al español).
 *
 * Uso: node_modules/.bin/tsx scripts/verify/57-link-targets.ts
 */
const { isPrefixableHref, isIncompleteEnPostPath } = await import('../../src/i18n/navigation')
const { EN_TRANSLATION_INCOMPLETE } = await import('../../src/lib/translation-gaps')

let failed = 0
function check(name: string, ok: boolean) {
  if (ok) console.log(`PASS ${name}`)
  else {
    failed++
    console.log(`FAIL ${name}`)
  }
}

for (const href of ['/sitemap.html', '/llms.txt', '/llms-full.txt', '/robots.txt', '/sitemap.xml', '/api/x', '/admin', '/go/notion']) {
  check(`${href} no recibe prefijo de idioma`, !isPrefixableHref(href))
}
for (const href of ['/', '/blog', '/services/ai-seo-geo', '/blog/seo/guia-eeat', '/entrevistas', '/golang-para-seo', '/apis-guia', '/blog/seo']) {
  check(`${href} sí recibe prefijo`, isPrefixableHref(href))
}
check('/en/contact ya prefijado no recibe otro', !isPrefixableHref('/en/contact'))

check('la lista de traducciones incompletas no está vacía', EN_TRANSLATION_INCOMPLETE.size > 0)
for (const slug of ['estrategia-seo', 'technical-seo-guide', 'react-19', 'recursividad']) {
  const href = `/blog/cat/${slug}`
  check(`${href} (EN noindex) va a la versión ES`, isIncompleteEnPostPath(href) && !isPrefixableHref(href))
  check(`${href}?x=1#h tambien`, !isPrefixableHref(`${href}?x=1#h`))
}
check('un slug incompleto como categoría no cuenta', isPrefixableHref('/blog/react-19'))

console.log(failed === 0 ? 'PASS 57-link-targets' : `${failed} FAIL`)
process.exit(failed === 0 ? 0 : 1)
