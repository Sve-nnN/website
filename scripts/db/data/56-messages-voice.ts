/**
 * Pasada de voz sobre messages/*.json, namespace emailCapture (plan 56-01, D-19, D-04).
 *
 * messages/*.json es codigo de la rama feat/mui-redesign: master tiene sus propios
 * mensajes, asi que estos cambios no tocan produccion ni la base. Por eso el estado es
 * `propuesto` con gate `propuesto`: Juan los aprueba junto con el resto de la pasada de
 * voz en la revision final.
 *
 * Voz de Juan: singular (yo), sin rayas y sin "nosotros".
 *
 * Sin imports de Payload ni de red.
 */
import type { Decision } from './56-content-decisions'

type Row = { key: string; beforeEs?: string; afterEs?: string; beforeEn?: string; afterEn?: string }

/** Antes y despues de cada clave cambiada de emailCapture. Una clave sin cambio en un idioma lo omite. */
export const EMAIL_CAPTURE_CHANGES: Row[] = [
  {
    key: 'description',
    beforeEs: '5 categorías, decenas de checks accionables [raya] el mismo criterio que uso en mis propias auditorías.',
    afterEs: '5 categorías y decenas de checks accionables, el mismo criterio que uso en mis propias auditorías.',
    beforeEn: '5 categories, dozens of actionable checks [raya] the same criteria I use in my own audits.',
    afterEn: '5 categories and dozens of actionable checks, the same criteria I use in my own audits.',
  },
  {
    key: 'alreadyBody',
    beforeEs: 'Revisa tu bandeja [raya] ya deberías tener el checklist.',
    afterEs: 'Revisa tu bandeja. Ya deberías tener el checklist.',
    beforeEn: 'Check your inbox [raya] you should already have the checklist.',
    afterEn: 'Check your inbox. You should already have the checklist.',
  },
  {
    key: 'errorBody',
    beforeEs: 'Algo salió mal. No pudimos registrar tu correo [raya] intenta de nuevo en un momento.',
    afterEs: 'Algo salió mal y no pude registrar tu correo. Intenta de nuevo en un momento.',
    beforeEn: "Something went wrong. We couldn't register your email [raya] please try again in a moment.",
    afterEn: "Something went wrong and I couldn't register your email. Please try again in a moment.",
  },
  {
    key: 'privacyPrefix',
    beforeEs: 'Al suscribirte aceptas nuestra ',
    afterEs: 'Al suscribirte aceptas mi ',
    beforeEn: 'By subscribing you accept our ',
    afterEn: 'By subscribing you accept my ',
  },
  {
    key: 'privacySuffix',
    beforeEs: '. Solo te escribiremos para confirmar la descarga, sin spam.',
    afterEs: '. Solo te escribo para confirmar la descarga, sin spam.',
    beforeEn: ". We'll only email you to confirm your download [raya] no spam.",
    afterEn: ". I'll only email you to confirm your download, no spam.",
  },
  {
    key: 'pendingBody',
    // El texto en español no cambia en este plan. Queda abierto para Juan: sigue en plural ("Te enviamos").
    beforeEn: 'We sent you a link to confirm your subscription and unlock the download.',
    afterEn: 'I sent you a link to confirm your subscription and unlock the download.',
  },
]

const SOURCE = 'messages/es.json y messages/en.json, namespace emailCapture (56-RESEARCH seccion 8)'

export const DECISIONS: Decision[] = EMAIL_CAPTURE_CHANGES.map((row) => ({
  id: `MSG-emailCapture-${row.key}`,
  label: `Mensaje emailCapture.${row.key}`,
  status: 'propuesto',
  gate: 'propuesto',
  source: SOURCE,
  preview: {
    es:
      row.afterEs !== undefined
        ? `Antes: ${row.beforeEs}\nDespués: ${row.afterEs}`
        : 'Sin cambio en español (queda como esta; sigue en plural, Juan decide si pasa a singular).',
    en: `Before: ${row.beforeEn}\nAfter: ${row.afterEn}`,
  },
}))
