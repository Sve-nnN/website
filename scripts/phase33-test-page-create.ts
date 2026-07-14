/**
 * Phase 33 (LOCAL-01/LOCAL-02) — throwaway test page to functionally verify
 * the new Hero `local-landing` variant + `LocalProofSection` block render
 * correctly. Creates ONE page with slug `phase33-local-landing-test`
 * containing two Hero blocks (ring-right/no-flip, and ring-left/flipX) plus
 * a LocalProofSection block. Deleted immediately after verification by
 * scripts/phase33-test-page-cleanup.ts — never left in the DB.
 *
 * Run with: node --env-file=.env node_modules/.bin/tsx scripts/phase33-test-page-create.ts
 */
import { getPayload } from 'payload'

import config from '../src/payload.config'

async function main() {
  const payload = await getPayload({ config })

  const page = await payload.create({
    collection: 'pages',
    locale: 'es',
    data: {
      title: 'Phase 33 Local Landing Test',
      slug: 'phase33-local-landing-test',
      content: {
        layout: [
          {
            blockType: 'hero',
            variant: 'local-landing',
            title: 'SEO Tecnico en Madrid',
            subtitle: 'Auditorias tecnicas para negocios locales.',
            cityName: 'Madrid',
            inlineStat: '+40 proyectos entregados',
            ringSide: 'right',
            ringOpacity: 0.25,
            ringFlipX: false,
            links: [
              {
                link: {
                  type: 'custom',
                  url: '/contacto',
                  label: 'Solicitar auditoria',
                  appearance: 'default',
                },
              },
            ],
          },
          {
            blockType: 'hero',
            variant: 'local-landing',
            title: 'SEO Tecnico en Lima',
            subtitle: 'Resultados medibles para negocios en Lima.',
            cityName: 'Lima',
            inlineStat: '+25 casos de exito en Lima',
            ringSide: 'left',
            ringOpacity: 0.35,
            ringFlipX: true,
            links: [
              {
                link: {
                  type: 'custom',
                  url: '/contacto',
                  label: 'Solicitar auditoria',
                  appearance: 'default',
                },
              },
              {
                link: {
                  type: 'custom',
                  url: '/casos-lima',
                  label: 'Ver casos en Lima',
                  appearance: 'outline',
                },
              },
            ],
          },
          {
            blockType: 'localProofSection',
            stats: [
              { value: '+40', label: 'Proyectos entregados' },
              { value: '98%', label: 'Clientes satisfechos' },
              { value: '5 anos', label: 'De experiencia local' },
            ],
            testimonial: {
              quote: 'Juan transformo nuestro trafico organico en pocos meses.',
              authorName: 'Maria Fernandez',
              authorBusiness: 'Panaderia El Trigal, Madrid',
            },
          },
        ],
      },
      _status: 'published',
    },
  })

  console.log('CREATED page id:', page.id, 'slug:', page.slug)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
