import type { Block } from 'payload'

// Bloque de contacto simple, con campos hardcodeados (sin dependencia del plugin
// genérico de formularios de Payload). El envío real se resuelve en Fase 5 vía Resend.
export const ContactFormBlock: Block = {
  slug: 'contactFormBlock',
  interfaceName: 'ContactFormBlock',
  fields: [
    {
      name: 'eyebrow',
      type: 'text',
      localized: true,
      admin: {
        description: 'Texto pequeño sobre el título',
      },
    },
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      admin: {
        description: 'Título del formulario',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Descripción del formulario',
      },
    },
    {
      name: 'submitLabel',
      type: 'text',
      localized: true,
      defaultValue: 'Enviar mensaje',
      admin: {
        description: 'Texto del botón de enviar',
      },
    },
    {
      name: 'sidebarTitle',
      type: 'text',
      localized: true,
      admin: {
        description: 'Título del panel lateral derecho (ej: "Charlemos sobre tu próximo proyecto")',
      },
    },
    {
      name: 'sidebarDescription',
      type: 'textarea',
      localized: true,
      admin: {
        description: 'Descripción del panel lateral (ej: disponibilidad, tipo de proyectos)',
      },
    },
    {
      name: 'socialProofText',
      type: 'text',
      localized: true,
      admin: {
        description: 'Texto de prueba social en la parte inferior del panel (ej: "Más de 50 proyectos completados")',
      },
    },
    {
      name: 'contactInfo',
      type: 'array',
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          options: [
            { label: 'Email (Mail)', value: 'mail' },
            { label: 'Teléfono (Phone)', value: 'phone' },
            { label: 'Ubicación (MapPin)', value: 'map-pin' },
            { label: 'LinkedIn', value: 'linkedin' },
            { label: 'GitHub', value: 'github' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'value',
          type: 'text',
          localized: true,
          required: true,
        },
        {
          name: 'href',
          type: 'text',
          admin: {
            description: 'URL o enlace (ej: mailto:, tel:, https://)',
          },
        },
      ],
      admin: {
        description: 'Información de contacto mostrada al lado del formulario',
      },
    },
  ],
  labels: {
    singular: {
      en: 'Contact Form',
      es: 'Formulario de Contacto',
    },
    plural: {
      en: 'Contact Forms',
      es: 'Formularios de Contacto',
    },
  },
}

export default ContactFormBlock
