import type { Block } from 'payload'

export const TestimonialsCarousel: Block = {
  slug: 'testimonialsCarousel',
  interfaceName: 'TestimonialsCarouselBlock',
  labels: {
    singular: 'Carrusel de Testimonios',
    plural: 'Carruseles de Testimonios',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: false,
      defaultValue: 'Testimonios',
    },
    {
      name: 'showRating',
      type: 'checkbox',
      label: 'Mostrar calificación',
      defaultValue: true,
    },
    {
      name: 'limit',
      type: 'number',
      label: 'Cantidad máxima de testimonios',
      defaultValue: 8,
      min: 1,
      max: 20,
    },
  ],
}

export default TestimonialsCarousel
