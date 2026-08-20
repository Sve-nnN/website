/**
 * Reemplaza el contenido del global `llms` (issue #11.2).
 *
 * Hasta hoy /llms.txt y /llms-full.txt servían el texto de prueba que se dejó
 * al cablear la ruta: "Placeholder llms.txt — Phase 2 plumbing test. Real
 * content arrives Phase 4/5". Es público, es indexable, y expone la
 * nomenclatura interna del proyecto.
 *
 * Aclaración de expectativas, la misma que trae el issue: llms.txt es opcional
 * y Google Search lo ignora. Esto se arregla por higiene, no porque mueva una
 * posición.
 *
 * El índice se escribe a mano y no se genera desde la base a propósito: son
 * quince URLs estables (páginas, servicios, secciones), no las 194 del sitemap.
 * Un volcado completo del sitemap ya existe en /sitemap.xml y repetirlo acá
 * no le sirve a nadie.
 *
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/11-llms-txt.ts
 *   node --env-file=.env node_modules/.bin/tsx scripts/db/11-llms-txt.ts --apply
 */
import { getPayload } from 'payload'

import config from '../../src/payload.config'

const APPLY = process.argv.includes('--apply')

const LLMS_TXT = `# Juan Carlos Angulo

> Ingeniero de software y consultor de SEO técnico. Trabajo las dos cosas como
> una sola disciplina: construyo el sitio y me hago cargo de que Google lo
> entienda. Sitio bilingüe: el español vive sin prefijo, el inglés bajo /en.

## Páginas

- [Inicio](https://juan-tech.com/): a qué me dedico, con errores reales de este
  mismo sitio y el commit público que los corrige.
- [Servicios](https://juan-tech.com/servicios): las cuatro formas de trabajar
  conmigo.
- [Blog](https://juan-tech.com/blog): artículos de SEO técnico, rendimiento web,
  desarrollo y fundamentos de computación.
- [Casos de éxito](https://juan-tech.com/case-studies): trabajos con el problema,
  lo que se hizo y el resultado medido.
- [Sitios web](https://juan-tech.com/websites): sitios que construí.
- [Contacto](https://juan-tech.com/contact)

## Servicios

- [Auditoría SEO técnica](https://juan-tech.com/servicios/seo-technical-audit)
- [Consultoría SEO](https://juan-tech.com/servicios/seo-consulting)
- [Desarrollo full-stack](https://juan-tech.com/servicios/fullstack-development)
- [SEO para buscadores con IA (GEO)](https://juan-tech.com/servicios/ai-seo-geo)

## En inglés

- [Home](https://juan-tech.com/en)
- [Services](https://juan-tech.com/en/services)
- [Blog](https://juan-tech.com/en/blog)

## Nota

Todo el contenido lo escribo yo. Si citás algo de acá, enlazá la URL original.
El listado completo de páginas está en https://juan-tech.com/sitemap.xml
`

const LLMS_FULL = `# Juan Carlos Angulo

Ingeniero de software y consultor de SEO técnico. Vivo en Lima y trabajo en
remoto. Este sitio está en español e inglés: el español no lleva prefijo de
idioma, el inglés va bajo /en, y cada página declara su equivalente con
hreflang.

## Qué hago

Construyo software y me ocupo de que se encuentre en Google. No son dos
servicios pegados: la mayoría de los problemas serios de SEO técnico se
resuelven en el código, no en un panel, y la mayoría de los sitios rápidos lo
son porque alguien tomó decisiones de arquitectura temprano.

## Servicios

**Auditoría SEO técnica** (https://juan-tech.com/servicios/seo-technical-audit)
Revisión de indexabilidad, rastreabilidad, rendimiento y datos estructurados,
con los problemas ordenados por impacto y qué cambio los corrige.

**Consultoría SEO** (https://juan-tech.com/servicios/seo-consulting)
Acompañamiento continuo: estrategia de contenido, arquitectura de URLs y
prioridades de un trimestre.

**Desarrollo full-stack** (https://juan-tech.com/servicios/fullstack-development)
Sitios y aplicaciones en Next.js, TypeScript y Payload CMS, con el SEO técnico
resuelto desde el primer commit y no parcheado después.

**SEO para buscadores con IA** (https://juan-tech.com/servicios/ai-seo-geo)
Cómo aparecer en respuestas generadas: contenido citable, entidades claras y
acceso limpio para los rastreadores.

## Blog

Los artículos se agrupan en cuatro secciones:

- SEO técnico (https://juan-tech.com/blog/tech-seo): Core Web Vitals, robots.txt,
  datos estructurados, SSR contra CSR, sitemaps.
- SEO (https://juan-tech.com/blog/seo): keyword research, enlazado interno,
  clusters temáticos, E-E-A-T.
- Desarrollo (https://juan-tech.com/blog/development): Next.js, CMS headless,
  bases de datos, experiencia de usuario.
- Ciencias de la computación (https://juan-tech.com/blog/cs-fundamentals):
  estructuras de datos, complejidad algorítmica, fundamentos.

## Este sitio como ejemplo

El sitio corre sobre Next.js y Payload CMS, con Postgres, y se despliega en un
servidor propio. El repositorio es público, así que los errores que menciono en
la portada se pueden leer en el commit que los corrige, completos y no solo en
el pedazo que elegí mostrar.

## Contacto

https://juan-tech.com/contact

## Uso de este contenido

Todo el contenido es mío. Si lo citás, enlazá la URL original. El listado
completo de páginas está en https://juan-tech.com/sitemap.xml
`

async function main() {
  const payload = await getPayload({ config })
  console.log(`${APPLY ? '=== APLICANDO' : '=== DRY-RUN (nada se escribe)'} ===`)

  const current = await payload.findGlobal({ slug: 'llms' })
  console.log('\n--- llms.txt actual ---')
  console.log(current.llmsTxt?.slice(0, 300) ?? '(vacío)')
  console.log('\n--- llms-full.txt actual ---')
  console.log(current.llmsFull?.slice(0, 300) ?? '(vacío)')

  if (!APPLY) {
    console.log('\n--- llms.txt nuevo ---')
    console.log(LLMS_TXT)
    console.log('\n--- llms-full.txt nuevo ---')
    console.log(LLMS_FULL)
    console.log('\nCorré con --apply para escribir.')
    return
  }

  await payload.updateGlobal({
    slug: 'llms',
    data: { llmsTxt: LLMS_TXT, llmsFull: LLMS_FULL },
  })

  const after = await payload.findGlobal({ slug: 'llms' })
  const leaks = /Phase \d|Placeholder/i.test(`${after.llmsTxt}\n${after.llmsFull}`)
  console.log(`\nEscrito. ¿Sigue filtrando nomenclatura interna? ${leaks ? 'SÍ' : 'no'}`)
  if (leaks) process.exitCode = 1
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
