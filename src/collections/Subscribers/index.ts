import type { CollectionConfig } from 'payload'

import { authenticated } from '@/access/authenticated'

/**
 * Altas al correo del blog, con doble opt-in.
 *
 * ACCESO CERRADO A PROPÓSITO: las cuatro operaciones piden usuario autenticado.
 * Es la única colección del sitio que guarda datos personales de terceros, así
 * que una lectura pública acá sería una lista de correos servida por la API.
 * El alta pública NO entra por REST: entra por el server action
 * (src/app/actions/subscribe.ts), que corre con `overrideAccess: true` del lado
 * del servidor y valida antes de escribir.
 *
 * El estado vive en `status`, no en un booleano: `pending` es alguien que dejó
 * el correo pero todavía no confirmó, y ese correo NO se puede usar para nada
 * hasta que confirme. Borrar la fila al darse de baja sería peor que marcarla:
 * sin registro, un alta posterior no sabría que esa persona ya se había ido.
 */
export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'Suscriptor', plural: 'Suscriptores' },
  access: {
    create: authenticated,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  admin: {
    group: 'Site',
    useAsTitle: 'email',
    defaultColumns: ['email', 'status', 'locale', 'createdAt'],
    description:
      'Altas al correo del blog. El alta pública entra por el formulario del sitio, no por acá.',
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pendiente de confirmar', value: 'pending' },
        { label: 'Confirmado', value: 'confirmed' },
        { label: 'Dado de baja', value: 'unsubscribed' },
      ],
      admin: {
        description:
          'Solo `confirmed` recibe correos. `pending` dejó el correo pero no hizo clic en el enlace de confirmación.',
      },
    },
    {
      name: 'locale',
      type: 'select',
      defaultValue: 'es',
      options: [
        { label: 'Español', value: 'es' },
        { label: 'English', value: 'en' },
      ],
      admin: { description: 'Idioma en el que se dio de alta. Define en qué idioma se le escribe.' },
    },
    {
      name: 'source',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Ruta desde donde se suscribió. Sirve para saber qué contenido trae altas.',
      },
    },
    {
      name: 'token',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
        description:
          'Token de confirmación y de baja. Se genera en el alta y no se vuelve a mostrar en ningún correo salvo en sus enlaces.',
      },
    },
    {
      name: 'confirmedAt',
      type: 'date',
      admin: { readOnly: true },
    },
    {
      name: 'unsubscribedAt',
      type: 'date',
      admin: { readOnly: true },
    },
  ],
}
