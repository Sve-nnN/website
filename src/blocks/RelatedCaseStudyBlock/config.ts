import type { Block } from 'payload'

/**
 * Deliberately generic "related case study" summary card, per CONTEXT.md:
 * today there is only 1 real, published case study, shown honestly-framed
 * on all 4 service landings — this schema must not hardcode a 1:1
 * service<->case-study assumption, so future case studies can be filtered
 * by `services[]` without a schema change (see 25-UI-SPEC.md "New Block 2").
 */
export const RelatedCaseStudyBlock: Block = {
  slug: 'relatedCaseStudyBlock',
  interfaceName: 'RelatedCaseStudyBlockBlock',
  labels: { singular: 'Related Case Study', plural: 'Related Case Study Blocks' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      admin: {
        description:
          'Optional heading — defaults to "Un caso real de cómo trabajo"/"A real example of how I work" in the component if empty.',
      },
    },
    {
      name: 'framingText',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Honest-framing sentence written per landing (not a single hardcoded string) — must not imply the case study is specific to this exact service.',
      },
    },
    {
      name: 'caseStudy',
      type: 'relationship',
      relationTo: 'case-studies',
      hasMany: false,
      required: false,
      admin: {
        description:
          'If empty, the component falls back to the most recently created case study.',
      },
    },
  ],
}
