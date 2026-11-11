/**
 * Texto legal de Privacidad y Terminos en espanol (fase 56, plan 56-05, CONT-03).
 *
 * Base: plantillas CC0 de General-Legal/legal-templates (privacy-policy-gdpr como
 * esqueleto, con apoyo de terms-of-use y cookie-notice; el aviso de leyes de estados de
 * EE. UU. se omite porque no aplica a una persona natural en Peru). No se pega la
 * plantilla: se reescribe en primera persona de Juan, corto y sin tono corporativo.
 *
 * Juan opera como persona natural (Juan Carlos Angulo, Peru) y el contacto es
 * hello@juan-tech.com (D-06). Este texto no es asesoria legal: la revision profesional
 * es opcional y va en el handoff, no en el sitio (D-10).
 *
 * D-09: este archivo NO contiene la fecha efectiva. LEGAL_EFFECTIVE_DATE queda vacia y
 * la fija el plan 56-14 el dia del corte; el sitio la muestra desde el global legal-pages.
 *
 * EVIDENCIA (T-56-15): cada parrafo y cada elemento de lista lleva el campo `evidence`
 * con la ruta del codigo o la verificacion que respalda la afirmacion (tabla 4.2 de
 * 56-RESEARCH.md). La autoprueba rechaza un bloque sin evidencia y los nombres del
 * hosting y de la analitica anteriores.
 *
 * HECHOS POR CONFIRMAR: viven en LEGAL_FACTS, uno por constante con status, valor y
 * evidencia. Cambiar un valor o un status es cambiar una linea y el texto se reconstruye
 * (buildPrivacyEs y buildTermsEs reciben los hechos). Juan los resuelve en el checkpoint
 * del plan 56-11. Todos tienen gate aprobado: el corte no pasa hasta que Juan los apruebe.
 *
 * Este archivo no escribe en ninguna base. Sin imports de Payload ni de red.
 */
import type { Decision, DecisionStatus } from './56-content-decisions'
import type { InlineContent, LegalBlock, LegalSection } from './56-legal-lexical'

/** D-09: vacia hasta el dia del corte. La fija 56-14, nunca este plan. */
export const LEGAL_EFFECTIVE_DATE = ''

export type LegalFact = {
  label: string
  status: DecisionStatus
  /** Valor que entra al texto. Una cadena vacia significa "sin dato": el texto usa una formula general. */
  value: string
  /** Datos secundarios del mismo hecho (region, plazo de los registros, ley de datos). */
  details?: Record<string, string>
  /** De donde sale el hecho o por que se propone este valor. */
  evidence: string
}

export type LegalFacts = {
  HOSTING: LegalFact
  MAILBOX_PROVIDER: LegalFact
  RETENTION_CONTACT_EMAIL: LegalFact
  RETENTION_SUBSCRIBERS: LegalFact
  COOKIE_BANNER: LegalFact
  GOVERNING_LAW: LegalFact
}

export const LEGAL_FACTS: LegalFacts = {
  // Hetzner y Dokploy salen de D-08 (Juan). El A record 116.203.79.125 de juan-tech.com
  // apunta al VPS (dig 2026-11-10), pero el nombre del proveedor y la region no se pueden
  // verificar desde el repo. region vacia: el texto no nombra pais hasta que Juan lo diga.
  // El tiempo de los registros de acceso no esta verificado en el VPS: 30 dias es una
  // recomendacion, no un hecho medido.
  HOSTING: {
    label: 'Servidor: proveedor, region y registros de acceso',
    status: 'propuesto',
    value: 'Hetzner',
    details: { region: '', logRetention: '30 días' },
    evidence:
      'D-08 (Hetzner con Dokploy, dicho por Juan). dig juan-tech.com: A 116.203.79.125, NS de Cloudflare. Region y plazo de los registros de acceso: sin verificar en el VPS.',
  },
  // El buzon hello@juan-tech.com recibe y envia (D-06) pero no se sabe quien lo aloja.
  // Valor vacio: el texto dice "un proveedor de correo" sin nombrarlo.
  MAILBOX_PROVIDER: {
    label: 'Proveedor del buzón hello@juan-tech.com',
    status: 'propuesto',
    value: '',
    evidence:
      'No se puede verificar desde el repo. CONTACT_TO_EMAIL=hello@juan-tech.com (D-06). Valor vacio: el texto usa la formula general.',
  },
  // El texto vivo decia "hasta 12 meses" para los envios del formulario (56-RESEARCH 4.1).
  RETENTION_CONTACT_EMAIL: {
    label: 'Plazo para conservar los correos del formulario de contacto',
    status: 'propuesto',
    value: '12 meses',
    evidence:
      'El texto vivo de /privacy decia hasta 12 meses (curl 2026-11-10). El plazo real lo decide Juan: no hay tarea automatica de borrado en el codigo, el buzon es manual.',
  },
  // El texto vivo decia "dentro de los mismos 12 meses". Aqui se usa como plazo despues de la baja.
  RETENTION_SUBSCRIBERS: {
    label: 'Plazo para conservar el correo de quien se da de baja',
    status: 'propuesto',
    value: '12 meses',
    evidence:
      'El texto vivo de /privacy decia 12 meses (seccion 8). src/app/api/newsletter/unsubscribe/route.ts marca unsubscribedAt y conserva la fila: no existe borrado automatico, el plazo se cumple a mano.',
  },
  // NEXT_LOCALE es la unica cookie del visitante y es funcional (preferencia de idioma).
  // La conclusion "no hace falta banner" es de Claude, no de un abogado.
  COOKIE_BANNER: {
    label: 'Conclusión: no hace falta banner de cookies',
    status: 'propuesto',
    value: 'no hace falta',
    evidence:
      'curl -I a / y /en en prod y dev: set-cookie NEXT_LOCALE=es; Path=/; SameSite=lax, sin Max-Age. Sin analitica ni pixeles (grep en src, package.json y next.config). Conclusion legal sin validar por un abogado.',
  },
  // Ley aplicable Peru (propuesta). La mencion de la ley peruana de datos personales es un supuesto por validar.
  GOVERNING_LAW: {
    label: 'Ley aplicable y mención de la ley de datos personales',
    status: 'propuesto',
    value: 'Perú',
    details: { dataProtectionLaw: 'Ley 29733 de Protección de Datos Personales', mentionDataLaw: 'si' },
    evidence:
      'D-06 (persona natural en Peru). La referencia a la Ley 29733 es un supuesto por validar (56-RESEARCH 4.3, ASSUMED): la plantilla CC0 no la cubre.',
  },
}

// ---------------------------------------------------------------------------
// Utilidades de texto
// ---------------------------------------------------------------------------

const MAIL = 'hello@juan-tech.com'
const MAILTO = `mailto:${MAIL}`
export const PRIVACY_URL_ES = 'https://juan-tech.com/privacy'

function details(fact: LegalFact, key: string): string {
  return (fact.details?.[key] ?? '').trim()
}

function p(content: InlineContent, evidence: string): LegalBlock {
  return { type: 'p', content, evidence }
}

// ---------------------------------------------------------------------------
// Politica de privacidad
// ---------------------------------------------------------------------------

export function buildPrivacyEs(F: LegalFacts): LegalSection[] {
  const region = details(F.HOSTING, 'region')
  const logRetention = details(F.HOSTING, 'logRetention') || 'un tiempo limitado'
  const country = F.GOVERNING_LAW.value.trim() || 'Perú'
  const dataLaw = details(F.GOVERNING_LAW, 'dataProtectionLaw')
  const mentionDataLaw = details(F.GOVERNING_LAW, 'mentionDataLaw') !== 'no' && dataLaw !== ''
  const mailbox = F.MAILBOX_PROVIDER.value.trim()

  const rightsBlocks: LegalBlock[] = [
    p('Tus datos son tuyos. En cualquier momento puedes pedirme una de estas cosas.', 'D-06 y plantilla CC0 privacy-policy-gdpr (Your rights): derechos de acceso, correccion, supresion, portabilidad, limitacion, oposicion y retiro del consentimiento.'),
    {
      type: 'ul',
      items: [
        { content: 'Acceso: que te diga qué datos tuyos tengo y te dé una copia.', evidence: 'Plantilla CC0 privacy-policy-gdpr, Your rights.' },
        { content: 'Rectificación: que corrija un dato que está mal.', evidence: 'Plantilla CC0 privacy-policy-gdpr, Your rights.' },
        { content: 'Supresión: que borre tus datos.', evidence: 'Plantilla CC0 privacy-policy-gdpr, Your rights.' },
        { content: 'Portabilidad: que te entregue tus datos en un formato que un programa pueda leer.', evidence: 'Plantilla CC0 privacy-policy-gdpr, Your rights.' },
        { content: 'Limitación: que deje de usar tus datos mientras resolvemos una duda.', evidence: 'Plantilla CC0 privacy-policy-gdpr, Your rights.' },
        { content: 'Oposición: que no use tus datos para un fin concreto.', evidence: 'Plantilla CC0 privacy-policy-gdpr, Your rights.' },
        {
          content: 'Retirar tu consentimiento: que deje de escribirte. Con el enlace de baja que trae cada correo lo haces tú solo, sin escribirme.',
          evidence: 'src/app/api/newsletter/unsubscribe/route.ts existe y el texto vivo de /privacy seccion 8 ya promete el enlace de baja en cada correo.',
        },
      ],
    },
    p(
      ['Para ejercer cualquiera de estos derechos escríbeme a ', { text: MAIL, href: MAILTO }, '. Si hace falta, te pido confirmar que eres quien dices ser antes de entregarte o borrar nada.'],
      'D-06: contacto legal hello@juan-tech.com.',
    ),
    p(
      mentionDataLaw
        ? `Trato tus datos de acuerdo con la ley peruana de protección de datos personales (${dataLaw}) y uso como referencia el reglamento europeo de protección de datos, el RGPD. Si crees que no traté bien tus datos, puedes reclamar ante la autoridad de protección de datos de ${country} o, si vives en Europa, ante la de tu país.`
        : `Si crees que no traté bien tus datos, puedes reclamar ante la autoridad de protección de datos de ${country} o, si vives en Europa, ante la de tu país.`,
      'LEGAL_FACTS.GOVERNING_LAW (supuesto por validar, D-10: Juan no es abogado). Estructura del aviso para usuarios europeos de la plantilla CC0 privacy-policy-gdpr.',
    ),
  ]

  return [
    {
      title: 'Quién soy y cómo contactarme',
      blocks: [
        p(
          'Soy Juan Carlos Angulo, una persona natural que vive en Perú. Este sitio es mío, y yo decido qué datos recoge y para qué los uso.',
          'D-06: persona natural, Juan Carlos Angulo, Peru. El pie del sitio dice Ingeniero de software y consultor SEO tecnico, Lima, Peru (curl /privacy 2026-11-10).',
        ),
        p(
          ['Si tienes una duda sobre tus datos, escríbeme a ', { text: MAIL, href: MAILTO }, '.'],
          'D-06: contacto legal y del formulario hello@juan-tech.com. CONTACT_TO_EMAIL=hello@juan-tech.com en produccion.',
        ),
      ],
    },
    {
      title: 'Qué datos recojo',
      blocks: [
        p('Recojo lo mínimo. Te cuento cada caso.', 'Resumen de los hechos verificados de la tabla 4.2 de 56-RESEARCH.md.'),
        {
          type: 'ul',
          items: [
            {
              content:
                'Formulario de contacto. Me llegan tu nombre, tu correo y tu mensaje como un correo normal a mi buzón. El sitio no los guarda en ninguna base de datos. Los uso solo para responderte.',
              evidence:
                'src/app/actions/contact.ts lineas 106 a 113: solo payload.sendEmail con replyTo, sin payload.create. Corrige D-08, que decia que el formulario guarda los datos.',
            },
            {
              content:
                'Suscripción al boletín o a una descarga gratuita. Guardo tu correo, el idioma en que te suscribiste, la página desde la que lo hiciste y, si fue por una descarga, cuál pediste. También guardo si confirmaste. La confirmación tiene dos pasos: te escribo un correo y quedas suscrito solo cuando pulsas el enlace. Si pides el checklist, solo te escribo para confirmar y entregar la descarga. Si te suscribes al blog, te aviso cuando publico un artículo nuevo.',
              evidence:
                'src/collections/Subscribers/index.ts: email, status, locale, source, token, confirmedAt, unsubscribedAt, optInReason, leadMagnet. messages/es.json emailCapture.privacySuffix: solo te escribo para confirmar la descarga. Texto vivo de /privacy seccion 7: aviso de contenido nuevo.',
            },
            {
              content:
                'Clics en enlaces de afiliado. Guardo el identificador del enlace y el user agent de tu navegador, que es el texto que dice qué navegador y qué sistema usas. No guardo tu dirección IP.',
              evidence:
                'src/collections/AffiliateClicks/index.ts: solo slug y userAgent, sin IP (comentario LEG-04). src/app/go/[slug]/route.ts: payload.create con slug y userAgent.',
            },
            {
              content:
                'Tu dirección IP. El sitio la lee para frenar abusos: cuenta cuántas veces envías un formulario, te suscribes o pulsas un enlace de afiliado en 10 minutos. Esa cuenta vive solo en la memoria del servidor y se pierde cuando el servidor se reinicia. No la escribo en la base de datos.',
              evidence:
                'src/lib/ip-throttle.ts (Map en memoria), ventana de 10 minutos en src/app/actions/contact.ts, subscribe.tsx, subscribe-lead-magnet.tsx y src/app/go/[slug]/route.ts. AffiliateClicks no tiene campo de IP.',
            },
            {
              content:
                'Registros técnicos del servidor. Como cualquier servidor web, el mío puede anotar la dirección IP, la fecha y la página que se pidió en cada visita. Los uso solo para detectar errores y ataques.',
              evidence:
                'Practica estandar del servidor y del proxy de Dokploy. No verificada en el VPS: se declara por prudencia y Juan confirma (LEGAL_FACTS.HOSTING).',
            },
          ],
        },
      ],
    },
    {
      title: 'Qué no uso',
      blocks: [
        p(
          'No uso herramientas de analítica, ni píxeles de seguimiento, ni publicidad de terceros, ni nada que arme un perfil de lo que haces en el sitio. No vendo tus datos.',
          'grep sin resultados fuera de comentarios de gtag, googletagmanager, analytics, cloudflareinsights, plausible, clarity, hotjar, posthog, umami y @vercel/analytics en src, package.json y next.config. src/components/AffiliateDisclosure.tsx: cero tracking, sin GA4, sin pixeles. El HTML de prod y dev no carga ningun script externo (curl 2026-11-10).',
        ),
      ],
    },
    {
      title: 'Cookies',
      blocks: [
        p(
          'El sitio usa una sola cookie y es funcional. Se llama NEXT_LOCALE y recuerda el idioma en que lees la página. Es una cookie de sesión: caduca cuando cierras el navegador. No sirve para seguirte ni para medir nada.',
          'curl -I a / y /en en prod y dev: set-cookie NEXT_LOCALE=es; Path=/; SameSite=lax, sin HttpOnly y sin Max-Age (cookie de sesion).',
        ),
        p(
          'Como solo uso esa cookie funcional, el sitio no muestra un aviso de cookies. Si algún día agrego una cookie que no sea necesaria para que la página funcione, te pido permiso antes.',
          'LEGAL_FACTS.COOKIE_BANNER: conclusion propuesta que Juan confirma (D-08).',
        ),
        p(
          'El panel de administración, que solo uso yo, guarda su propia cookie de sesión cuando inicio sesión. No afecta a quien visita el sitio.',
          'Payload guarda la cookie de autenticacion solo al iniciar sesion en /admin. Los visitantes no tienen cuenta.',
        ),
      ],
    },
    {
      title: 'Proveedores que tratan datos',
      blocks: [
        p('Para que el sitio funcione dependo de estos proveedores. Cada uno hace una tarea concreta.', 'D-08 y tabla 4.2 de 56-RESEARCH.md: subprocesadores reales.'),
        {
          type: 'ul',
          items: [
            {
              content: [
                'Resend envía los correos del sitio: el del formulario de contacto, que llega a mi buzón, y los de confirmación de suscripción. Por Resend pasan tu nombre, tu correo y tu mensaje. Su ',
                { text: 'política de privacidad', href: 'https://resend.com/legal/privacy-policy' },
                '.',
              ],
              evidence: 'src/payload.config.ts lineas 87 a 91 (resendAdapter con RESEND_API_KEY) y payload.sendEmail en src/app/actions/contact.ts. URL de la politica verificada con HTTP 200 el 2026-11-10.',
            },
            {
              content: [
                'Cloudinary guarda y sirve las imágenes del sitio. Tu navegador las pide directo a Cloudinary, así que tu dirección IP y tu user agent llegan a su servidor cuando cargas una página con imágenes. Su ',
                { text: 'política de privacidad', href: 'https://cloudinary.com/privacy' },
                '.',
              ],
              evidence: 'next.config.mjs remotePatterns res.cloudinary.com. El HTML de prod y dev pide imagenes a res.cloudinary.com (curl 2026-11-10). URL de la politica verificada con HTTP 200.',
            },
            {
              content: [
                region === ''
                  ? 'Hetzner es el proveedor del servidor donde corre el sitio y donde vive su base de datos. Es un servidor virtual que administro yo con Dokploy, el programa con el que publico el sitio. Su '
                  : `${F.HOSTING.value} es el proveedor del servidor donde corre el sitio y donde vive su base de datos. El servidor está en ${region}. Es un servidor virtual que administro yo con Dokploy, el programa con el que publico el sitio. Su `,
                { text: 'política de privacidad', href: 'https://www.hetzner.com/legal/privacy-policy' },
                '.',
              ],
              evidence: 'LEGAL_FACTS.HOSTING (D-08). dig juan-tech.com: A 116.203.79.125. URL de la politica verificada con HTTP 200.',
            },
            {
              content: [
                'Cloudflare solo hace de DNS: traduce el nombre juan-tech.com a la dirección del servidor. La página y tus datos no pasan por Cloudflare. Su ',
                { text: 'política de privacidad', href: 'https://www.cloudflare.com/privacypolicy/' },
                '.',
              ],
              evidence: 'dig: NS cruz.ns.cloudflare.com y vasilii.ns.cloudflare.com. Las respuestas de juan-tech.com no traen server: cloudflare ni cf-ray (curl -I 2026-11-10). Sin Cloudflare Insights. URL de la politica verificada con HTTP 200.',
            },
            {
              content:
                mailbox === ''
                  ? `Mi buzón ${MAIL} lo aloja un proveedor de correo, que por eso también ve los mensajes que me escribes.`
                  : `${mailbox} aloja mi buzón ${MAIL}, así que también ve los mensajes que me escribes.`,
              evidence: 'LEGAL_FACTS.MAILBOX_PROVIDER: no se puede verificar desde el repo. D-06: el buzon recibe y envia.',
            },
          ],
        },
      ],
    },
    {
      title: 'Enlaces de afiliado',
      blocks: [
        p(
          'Algunos enlaces del sitio son de afiliado. Si compras a través de alguno, puedo ganar una comisión pequeña sin costo adicional para ti. Solo recomiendo herramientas que uso de verdad. Como afiliado de Amazon, obtengo ingresos por las compras que califican.',
          'messages/es.json affiliateDisclosure.generalDisclosure y amazonDisclosure (texto ya servido por AffiliateDisclosure.tsx). D-08: hay enlaces de afiliado con divulgacion.',
        ),
        p(
          'Esos enlaces pasan primero por una dirección de este sitio, que anota el clic como te expliqué arriba y te manda a la tienda. La tienda tiene su propia política de privacidad y sus propias cookies, que yo no controlo.',
          'src/app/go/[slug]/route.ts: redirect 302 con Cache-Control no-store y registro de slug y userAgent, sin IP ni identificador por usuario.',
        ),
      ],
    },
    {
      title: 'Cuánto tiempo guardo tus datos',
      blocks: [
        {
          type: 'ul',
          items: [
            {
              content: `Correos del formulario de contacto: hasta ${F.RETENTION_CONTACT_EMAIL.value} desde la última vez que hablamos. Los guardo para poder retomar la conversación si hace falta.`,
              evidence: 'LEGAL_FACTS.RETENTION_CONTACT_EMAIL. Los correos viven en el buzon, no en la base (contact.ts).',
            },
            {
              content: `Suscriptores: mientras sigas suscrito. Si te das de baja, dejo tu correo marcado como dado de baja para no volver a escribirte y lo borro a más tardar a los ${F.RETENTION_SUBSCRIBERS.value}.`,
              evidence: 'LEGAL_FACTS.RETENTION_SUBSCRIBERS. Subscribers guarda status y unsubscribedAt; el borrado es manual.',
            },
            {
              content:
                'Clics de afiliado: como no llevan tu IP ni tu correo, los conservo mientras me sirvan para saber qué enlaces se usan.',
              evidence: 'src/collections/AffiliateClicks/index.ts: solo slug y userAgent, log append-only.',
            },
            {
              content: `Registros técnicos del servidor: ${logRetention}.`,
              evidence: 'LEGAL_FACTS.HOSTING details.logRetention: recomendacion, no verificada en el VPS.',
            },
            {
              content: 'Dirección IP en memoria: hasta que el servidor se reinicia.',
              evidence: 'src/lib/ip-throttle.ts: Map a nivel de modulo, vive en la memoria del proceso Node.',
            },
          ],
        },
        p('Si prefieres que borre algo antes, me lo pides y lo borro.', 'Derecho de supresion de la plantilla CC0 privacy-policy-gdpr y texto vivo de /privacy seccion 4.'),
      ],
    },
    { title: 'Tus derechos y cómo ejercerlos', blocks: rightsBlocks },
    {
      title: 'Transferencias internacionales',
      blocks: [
        p(
          'Vivo en Perú y mis proveedores operan en otros países. Por eso tus datos pueden viajar fuera de tu país y fuera del mío cuando usas el formulario, te suscribes o cargas las imágenes del sitio. Cada proveedor aplica las leyes de su país y publica su propia política de privacidad, que enlazo arriba.',
          'Plantilla CC0 privacy-policy-gdpr, International data transfer, adaptada a una persona natural en Peru. Proveedores en la tabla 4.2 de 56-RESEARCH.md.',
        ),
      ],
    },
    {
      title: 'Menores de edad',
      blocks: [
        p(
          'Este sitio no está pensado para menores de 18 años y no recojo sus datos a propósito. Si crees que un menor me dejó los suyos, escríbeme y los borro.',
          'Plantilla CC0 privacy-policy-gdpr, Children (menores de 18).',
        ),
      ],
    },
    {
      title: 'Cambios en esta política',
      blocks: [
        p(
          'Si cambio algo, actualizo este texto y la fecha que aparece al inicio de la página. Cada cambio vale desde esa fecha.',
          'D-09: la fecha efectiva la muestra el global legal-pages (campo effectiveDate), no este texto.',
        ),
      ],
    },
  ]
}

export const PRIVACY_ES: LegalSection[] = buildPrivacyEs(LEGAL_FACTS)

// ---------------------------------------------------------------------------
// Decisiones: una por hecho por confirmar (el plan 56-11 agrega las de cada documento)
// ---------------------------------------------------------------------------

const FACT_NOTES: Record<keyof LegalFacts, string[]> = {
  HOSTING: ['', 'Alemania', 'Finlandia', 'Estados Unidos'],
  MAILBOX_PROVIDER: [''],
  RETENTION_CONTACT_EMAIL: ['6 meses', '12 meses', '24 meses'],
  RETENTION_SUBSCRIBERS: ['6 meses', '12 meses', '24 meses'],
  COOKIE_BANNER: ['no hace falta'],
  GOVERNING_LAW: ['Perú'],
}

/** Una decision por hecho. status y valor salen de LEGAL_FACTS: se cambian ahi. Gate aprobado. */
export const DECISIONS: Decision[] = (Object.keys(LEGAL_FACTS) as (keyof LegalFacts)[]).map((key) => {
  const fact = LEGAL_FACTS[key]
  const extras = details(fact, 'region') !== '' ? `, región ${details(fact, 'region')}` : ''
  const current = `${fact.value || '(sin dato: el texto usa una fórmula general)'}${extras}`
  return {
    id: `LEGAL-FACT-${key.replace(/_/g, '-')}`,
    label: fact.label,
    status: fact.status,
    gate: 'aprobado',
    chosen: 'propuesto',
    recommended: 'propuesto',
    options: {
      propuesto: { es: current, note: fact.evidence },
      ...Object.fromEntries(
        FACT_NOTES[key]
          .filter((v) => v !== fact.value)
          .map((v, i) => [`alt${i + 1}`, { es: v === '' ? '(sin dato)' : v }]),
      ),
    },
    source: 'scripts/db/data/56-legal-copy.ts LEGAL_FACTS',
  }
})
