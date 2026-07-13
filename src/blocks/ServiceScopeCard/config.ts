import type { Block } from 'payload'

/**
 * "Spec sheet" for a service landing: scope/outcome/timeline, deliberately
 * NEVER a price field (hard project rule, D-01 in ROADMAP — see 25-UI-SPEC.md
 * "New Block 1: Scope Card"). One instance per service landing, service-
 * specific copy (not a generic template repeated across all 4).
 */
export const ServiceScopeCard: Block = {
  slug: 'serviceScopeCard',
  interfaceName: 'ServiceScopeCardBlock',
  labels: { singular: 'Service Scope Card', plural: 'Service Scope Cards' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Optional card heading — defaults to "Alcance de este servicio"/"Service scope" in the component if empty.',
      },
    },
    {
      name: 'scope',
      type: 'textarea',
      localized: true,
      required: true,
      admin: { description: '"Qué incluye" / "What\'s included"' },
    },
    {
      name: 'outcome',
      type: 'textarea',
      localized: true,
      required: true,
      admin: { description: '"Qué vas a lograr" / "What you\'ll get"' },
    },
    {
      name: 'timeline',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description:
          'Short freeform phrase (e.g. "2-3 semanas") — NOT a number field, timelines vary in phrasing per service.',
      },
    },
  ],
}
