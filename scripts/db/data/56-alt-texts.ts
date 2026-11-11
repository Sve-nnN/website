/**
 * Textos alternativos de fotos y capturas (plan 56-07, D-18).
 *
 * Cada alt se redacto DESPUES de abrir la imagen real (RESEARCH 9, T-56-22): se bajo
 * a un directorio temporal fuera del repo y se miro. No se describe nada que no se vea.
 *
 * Reglas de redaccion (las comprueba scripts/verify/56-alts-selftest.ts):
 *   - describe contenido y funcion, no empieza por "imagen de", "foto de" ni "captura de";
 *   - ES y EN dicen lo mismo; el EN no puede ser el ES;
 *   - sin rayas largas ni medias, sin marcadores de ranura, sin "portfolio";
 *   - unos 125 caracteres; el tope duro es ALT_HARD_MAX.
 *
 * Nada de este archivo escribe en la base (D-01). Los alt de las 4 fotos ya viven en docs
 * de Media propios de la fase 54 que `master` no lee. Los de las 6 capturas viven en docs
 * de Media que `master` TAMBIEN lee: se cargan en el corte (plan 56-14), con respaldo
 * impreso del valor actual en ES y EN (D-02, T-56-24). Por eso cada fila guarda `actualEs`
 * y `actualEn`, el valor que sirve hoy.
 *
 * Sin imports de Payload ni de red.
 */
import type { Decision, DecisionStatus } from './56-content-decisions'

export type AltKind = 'foto' | 'captura'

export type AltRow = {
  /** Clave estable. El id de la decision es ALT-<key>. */
  key: string
  kind: AltKind
  /** Nombre del archivo en Cloudinary bajo media/ (sin extension). */
  mediaSlug: string
  /** Texto propuesto en espanol. */
  es: string
  /** Texto propuesto en ingles. Siempre `propuesto`: nadie lo ha aprobado. */
  en: string
  /** Alt que sirve hoy en espanol (respaldo para el corte). */
  actualEs: string
  /** Alt que sirve hoy en ingles (respaldo para el corte). */
  actualEn: string
  status: DecisionStatus
  /** false: el texto NO debe cargarse todavia (la imagen necesita reemplazo). */
  loadable: boolean
  /** Que se vio en la imagen y por que se redacto asi. */
  nota: string
  /** Donde vive el doc de Media y quien mas lo lee. */
  source: string
}

/** Tope duro de longitud. Lo habitual es unos 125; mas de 180 ya no es un alt. */
export const ALT_SOFT_MAX = 125
export const ALT_HARD_MAX = 180

/** Raya larga armada por codigo: la guardia de datos rechaza el caracter literal. */
const EM = String.fromCharCode(0x2014)

/** Alt vigente de una captura: "<Nombre> <raya> captura de pantalla completa" en ES y en EN. */
export const currentCaptureAlt = (name: string): string => `${name} ${EM} captura de pantalla completa`

const PHOTO_SOURCE =
  'doc de Media propio de la fase 54 (scripts/db/data/54-media-manifest.ts); master no lo lee, ya sirve su alt desde dev'
const CAPTURE_SOURCE =
  'doc de Media media/<slug>-screenshot que master TAMBIEN lee (Websites); se carga en el corte (56-14) con respaldo'

export const PHOTO_ALTS: AltRow[] = [
  {
    key: 'about-hero',
    kind: 'foto',
    mediaSlug: 'p54-about-hero',
    es: 'Juan Carlos Angulo sonriendo, con gafas y chaqueta negra sobre una camisa clara, frente a una pared gris con una lámpara cálida y una planta trepadora a un lado',
    en: 'Juan Carlos Angulo smiling, wearing glasses and a black jacket over a light shirt, in front of a gray wall with a warm lamp and a climbing plant to one side',
    actualEs:
      'Juan Carlos Angulo sonriendo, con gafas y chaqueta negra sobre una camisa clara, frente a una pared gris con una lámpara cálida y una planta trepadora a un lado',
    actualEn:
      'Juan Carlos Angulo sonriendo, con gafas y chaqueta negra sobre una camisa clara, frente a una pared gris con una lámpara cálida y una planta trepadora a un lado',
    status: 'propuesto',
    loadable: true,
    nota: 'Visto: retrato sonriente con gafas, chaqueta negra con cierre sobre camisa clara, pared gris, lámpara cálida y planta trepadora a la izquierda. El ES vigente coincide con lo que se ve. Era BORRADOR de A11Y-DECISIONS.md: Juan lo confirma. Es más largo que el tope blando de 125 caracteres, pero cada detalle se ve en la foto.',
    source: PHOTO_SOURCE,
  },
]

export const CAPTURE_ALTS: AltRow[] = [
  {
    key: 'apturio',
    kind: 'captura',
    mediaSlug: 'apturio-com-screenshot',
    es: 'Inicio de Apturio en tema oscuro: titular Your AI-Powered Sales Machine, testimonios de clientes, planes de precios y preguntas frecuentes',
    en: 'Apturio home page in dark theme: headline Your AI-Powered Sales Machine, customer testimonials, pricing plans and a FAQ',
    actualEs: currentCaptureAlt('Apturio'),
    actualEn: currentCaptureAlt('Apturio'),
    status: 'propuesto',
    loadable: true,
    nota: 'Visto: página larga en tema oscuro, sitio en inglés. Hero con titular "Your AI-Powered Sales Machine, Expertly Built and Ready to Run" y botones Get Started y Free Strategy Call. Más abajo: seis problemas, beneficios, testimonios con estrellas, tres planes de precios (199, 299 y 699 al mes), preguntas frecuentes y pie.',
    source: CAPTURE_SOURCE,
  },
]

export const ALL_ALTS: AltRow[] = [...PHOTO_ALTS, ...CAPTURE_ALTS]

/** Una decision por fila, ids ALT-<key>. El corte exige estado aprobado (cambia produccion). */
export const DECISIONS: Decision[] = ALL_ALTS.map((row) => ({
  id: `ALT-${row.key}`,
  label: `Alt de ${row.kind === 'foto' ? 'la foto' : 'la captura'} ${row.key}`,
  status: row.status,
  gate: 'aprobado',
  chosen: row.loadable ? 'propuesto' : 'actual',
  recommended: row.loadable ? 'propuesto' : 'actual',
  options: {
    actual: { es: row.actualEs, en: row.actualEn, note: 'Lo que sirve hoy; respaldo para el corte' },
    propuesto: { es: row.es, en: row.en, note: row.nota },
  },
  source: row.source,
}))
