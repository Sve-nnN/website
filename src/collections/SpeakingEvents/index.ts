import type { CollectionConfig } from 'payload'

/**
 * Standalone collection for speaking engagements (conferences, workshops,
 * talks) Juan has participated in — the 4th E-E-A-T section on the author
 * page ("Eventos donde he sido ponente" / "Speaking Events"), added mid-Phase
 * 12 per Juan's direct request.
 *
 * Deliberately standalone, not related to Authors: the site has a single
 * real Author, so the author page simply lists every SpeakingEvents doc
 * ordered by date (most recent first), rather than modeling a relationship.
 * This also lets Juan keep adding events later without touching Authors.
 *
 * Public read access is intentional: this collection holds no auth data,
 * same rationale as Authors/Clientes/Testimonials.
 */
export const SpeakingEvents: CollectionConfig = {
  slug: 'speaking-events',
  access: {
    read: () => true,
  },
  defaultSort: '-date',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'role', 'date', 'location'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'role',
      type: 'text',
      localized: true,
      label: { en: 'Role', es: 'Rol' },
      admin: {
        description: 'Qué hizo Juan en el evento, p.ej. "Ponente", "Co-instructor"',
      },
    },
    {
      name: 'coSpeakers',
      type: 'array',
      label: { en: 'Co-speakers', es: 'Co-ponentes' },
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'date',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayOnly',
        },
        description: 'Opcional — dejar vacío si no hay fecha exacta confirmada, no inventar',
      },
    },
    {
      name: 'location',
      type: 'text',
    },
    {
      name: 'attendeeCount',
      type: 'number',
      label: { en: 'Attendee count', es: 'Número de asistentes' },
    },
    {
      name: 'link',
      type: 'text',
      label: { en: 'Link', es: 'Enlace' },
    },
    {
      name: 'flyer',
      type: 'upload',
      relationTo: 'media',
    },
  ],
}
