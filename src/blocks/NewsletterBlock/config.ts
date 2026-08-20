import type { Block } from 'payload'

/**
 * Captura de email del blog: la salida blanda para el lector que no está listo
 * para contratar una auditoría.
 *
 * OJO: el alta todavía no está cableada (ver src/app/actions/subscribe.ts). El
 * bloque está registrado y se puede previsualizar, pero NO debe agregarse al
 * layout de una página publicada hasta que la fase de GSD conecte el alta real,
 * el doble opt-in y el texto de consentimiento.
 */
export const NewsletterBlock: Block = {
  slug: 'newsletterBlock',
  interfaceName: 'NewsletterBlockType',
  labels: { singular: 'Blog — captura de email', plural: 'Blog — captura de email' },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    { name: 'description', type: 'textarea', localized: true },
    {
      name: 'emailLabel',
      type: 'text',
      localized: true,
      defaultValue: 'Tu correo',
      admin: { description: 'Label visible del campo. No es un placeholder.' },
    },
    { name: 'submitLabel', type: 'text', localized: true, defaultValue: 'Suscribirme' },
    {
      name: 'consentText',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Qué se hace con el correo y cómo se da de baja. Se muestra debajo del formulario, antes de enviar, no después.',
      },
    },
  ],
}
