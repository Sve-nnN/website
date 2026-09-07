import type { Block } from 'payload'

/**
 * Bloque de un solo uso (mismo patron que `RelatedCaseStudyBlock`), pensado
 * exclusivamente para la landing "Auditoría SEO Técnica" — deliberadamente
 * NO un campo agregado a `ServiceScopeCard`, que es compartido por las otras
 * 3 landings de servicio y no debe llevar un campo irrelevante para ellas.
 * Envuelve el `StackHighlightCallout` generalizado (ver 48.5-UI-SPEC.md
 * "Service Landing Block: AuditorCallout").
 */
export const AuditorCallout: Block = {
  slug: 'auditorCallout',
  interfaceName: 'AuditorCalloutBlock',
  labels: { singular: 'Auditor Callout', plural: 'Auditor Callout Blocks' },
  fields: [
    {
      name: 'heading',
      type: 'text',
      localized: true,
      admin: {
        description: 'Vacio -> fallback i18n auditorCallout.heading',
      },
    },
    {
      name: 'narrative',
      type: 'textarea',
      localized: true,
      required: true,
      admin: {
        description:
          'El pitch completo. Este bloque no tiene fila de stats separada, los 4 datos van tejidos en la oracion',
      },
    },
  ],
}
