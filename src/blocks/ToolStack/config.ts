import type { Block } from 'payload'

/**
 * Phase 48 (STACK-01..06): el bloque `ToolStack` sostiene TODA la página
 * `/stack` — grupos de herramientas por categoría, la sección "Gear"
 * (hardware personal comprado en Amazon), y los dos callouts obligatorios
 * ("qué elegiría hoy" y la recomendación sin comisión).
 *
 * CONSTRAINT (UI-SPEC "no roundup / no ranking"): el orden dentro de
 * `categoryGroups[].tools[]` es el orden editorial del array en Payload
 * (drag-and-drop en admin) — el componente de render NUNCA reordena por
 * `affiliateLink != null` ni por comisión. Ver los `admin.description` de
 * `categoryGroups`/`tools` abajo, que declaran esto explícitamente para
 * cualquier editor futuro.
 */
export const ToolStack: Block = {
  slug: 'toolStack',
  interfaceName: 'ToolStackBlock',
  labels: { singular: 'Tool Stack', plural: 'Tool Stack Blocks' },
  fields: [
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Lede corta debajo del <h1>, antes del disclosure de afiliados.',
      },
    },
    {
      name: 'categoryGroups',
      type: 'array',
      // dbName corto (Rule 1 - bug): el nombre completo generado por Payload
      // concatena slug de bloque + nombres de arrays/grupos anidados; con
      // "categoryGroups" el identificador del enum de `referenceLink.type`
      // (más abajo) excedía el límite de 63 caracteres de Postgres
      // ("enum_pages_blocks_tool_stack_category_groups_tools_reference_link_type",
      // 70 chars) — `payload migrate:create` fallaba con
      // "Exceeded max identifier length" antes de tocar la DB.
      dbName: 'groups',
      admin: {
        initCollapsed: true,
        description:
          'El ORDEN de este array es el único orden de render — nunca se reordena en el componente por affiliateLink != null ni por comisión.',
      },
      fields: [
        { name: 'heading', type: 'text', localized: true, required: true },
        {
          name: 'tools',
          type: 'array',
          admin: {
            initCollapsed: true,
            description:
              'El ORDEN de este array es el único orden de render — nunca se reordena en el componente por affiliateLink != null ni por comisión.',
          },
          fields: [
            {
              name: 'name',
              type: 'text',
              required: true,
              admin: { description: 'Nombre propio de la herramienta — no localizado.' },
            }, // NO localizado — nombre propio
            {
              name: 'affiliateLink',
              type: 'relationship',
              relationTo: 'affiliate-links',
              // NOT required: null es la señal de "sin afiliado todavía"
              // (DigitalOcean/Kinsta) — driva el chip "Sin programa de
              // afiliados todavía" en vez de un botón de CTA.
              admin: {
                description:
                  'Vacío = "sin afiliado todavía" (chip neutral, sin CTA). Nunca fabricar un doc de afiliate-links solo para llenar este campo.',
              },
            },
            {
              name: 'narrative',
              type: 'textarea',
              localized: true,
              required: true,
              admin: {
                description:
                  '>=100 palabras por locale, experiencia propia real — sin copy de fabricante ni specs (STACK-02).',
              },
            },
            { name: 'pro', type: 'text', localized: true, required: true },
            {
              name: 'con',
              type: 'text',
              localized: true,
              required: false,
              admin: {
                description:
                  'Vacío es válido — nunca se fabrica un contra que Juan no reportó. El componente muestra una copy honesta-vacía en su lugar.',
              },
            },
            {
              name: 'referenceLink',
              type: 'group',
              fields: [
                {
                  name: 'type',
                  type: 'radio',
                  defaultValue: 'caseStudy',
                  options: [
                    { label: 'Case study', value: 'caseStudy' },
                    { label: 'Custom URL', value: 'custom' },
                  ],
                },
                {
                  name: 'caseStudy',
                  type: 'relationship',
                  relationTo: 'case-studies',
                  admin: { condition: (_, siblingData) => siblingData?.type === 'caseStudy' },
                },
                {
                  name: 'url',
                  type: 'text',
                  admin: {
                    condition: (_, siblingData) => siblingData?.type === 'custom',
                    description:
                      'Ruta bare, sin prefijo de locale — mismo idioma que Footer.legalLinks.href. Ej: /servicios/fullstack-development o /case-studies.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'gearIntro',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Un solo párrafo compartido para toda la sección Gear (menciona Amazon Prime en prosa — Prime NO es un gearItem con link propio).',
      },
    },
    {
      name: 'gearItems',
      type: 'array',
      fields: [
        { name: 'name', type: 'text', required: true }, // NO localizado — nombre de producto
        {
          name: 'href',
          type: 'text',
          required: true,
          admin: {
            description:
              'URL completa de producto Amazon con tag=juantech02-20 visible. PROHIBIDO cualquier valor amzn.to (shortlink) — Amazon prohíbe Redirecting Links.',
          },
        }, // NO localizado
      ],
    },
    {
      name: 'elegiriaHoy',
      type: 'textarea',
      localized: true,
      required: true,
      admin: {
        description: 'Feed de StackHighlightCallout instancia 1 ("Qué elegiría hoy...").',
      },
    },
    {
      name: 'noCommissionPick',
      type: 'relationship',
      relationTo: 'affiliate-links',
      required: false,
      admin: {
        description: 'Se espera que resuelva al doc de Google Search Console (program: "google-search-console").',
      },
    },
    {
      name: 'auditorHighlight',
      type: 'group',
      // Sin dbName: es un group escalar (no array), no una tabla nueva —
      // sin riesgo del límite de 63 caracteres que forzó dbName: 'groups'
      // en categoryGroups (comentario arriba).
      fields: [
        {
          name: 'narrative',
          type: 'textarea',
          localized: true,
          required: true,
          admin: {
            description:
              "Feed de la 3ra instancia de StackHighlightCallout ('El auditor que construí'). Debe mencionar los 4 datos verificables (29 checks, 5 categorías, 500 URLs, CWV) y el límite del plan gratuito.",
          },
        },
      ],
    },
  ],
}
