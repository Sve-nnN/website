import type { Block } from 'payload'

// Gap-fill block (10.7, UI-21): distinct from `testimonialsCarousel` (which
// queries N docs from the `testimonials` collection for a horizontal
// carousel). This block holds a single, hand-picked quote authored directly
// on the block itself, meant to be embedded inline within a longer-form flow
// (e.g. a CaseStudies document, between "Solución" and "Resultados") rather
// than pulled from the shared Testimonials collection.
export const TestimonialSection: Block = {
  slug: 'testimonialSection',
  interfaceName: 'TestimonialSectionBlock',
  labels: {
    singular: 'Testimonio',
    plural: 'Testimonios',
  },
  fields: [
    {
      name: 'quote',
      type: 'textarea',
      label: 'Cita',
      required: true,
      localized: true,
    },
    {
      name: 'authorName',
      type: 'text',
      label: 'Nombre del autor',
      required: true,
    },
    {
      name: 'authorRole',
      type: 'text',
      label: 'Rol / cargo del autor',
      required: true,
      localized: true,
    },
  ],
}

export default TestimonialSection
