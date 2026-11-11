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
    status: 'aprobado',
    loadable: true,
    nota: 'Visto: retrato sonriente con gafas, chaqueta negra con cierre sobre camisa clara, pared gris, lámpara cálida y planta trepadora a la izquierda. El ES vigente coincide con lo que se ve. Era BORRADOR de A11Y-DECISIONS.md: Juan lo confirma. Es más largo que el tope blando de 125 caracteres, pero cada detalle se ve en la foto.',
    source: PHOTO_SOURCE,
  },
  {
    key: 'home-about-taller',
    kind: 'foto',
    mediaSlug: 'p54-home-about-taller',
    es: 'Juan Carlos Angulo dando el taller de SEO técnico, de pie con un micrófono junto a una pantalla con la diapositiva Introducción al SEO técnico',
    en: 'Juan Carlos Angulo giving the technical SEO workshop, standing with a microphone next to a screen showing the slide Introduction to Technical SEO',
    actualEs: 'Juan Carlos Angulo dando el taller de SEO técnico, con la diapositiva de introducción al SEO técnico detrás',
    actualEn: 'Juan Carlos Angulo dando el taller de SEO técnico, con la diapositiva de introducción al SEO técnico detrás',
    status: 'aprobado',
    loadable: true,
    nota: 'Visto: él de pie a la derecha, con micrófono en la mano y camisa clara, sobre césped artificial. A la izquierda un televisor con la diapositiva INTRODUCCIÓN AL SEO TÉCNICO (logos de Venezuela SEO Fest, aprendoseo y DinoRANK) y detrás de él una pantalla de proyección. Se cambia el ES vigente: la diapositiva está a su izquierda y no detrás de él. Esta es la foto del taller (Venezuela SEO Fest 2024); vive en la home y no en /sobre-mi.',
    source: PHOTO_SOURCE,
  },
  {
    key: 'home-about-escritorio',
    kind: 'foto',
    mediaSlug: 'p54-home-about-escritorio',
    es: 'Juan Carlos Angulo trabajando frente a una laptop, con luz cálida de ventana',
    en: 'Juan Carlos Angulo working at a laptop, with warm window light',
    actualEs: 'Juan Carlos Angulo trabajando frente a una laptop, con luz cálida de ventana',
    actualEn: 'Juan Carlos Angulo trabajando frente a una laptop, con luz cálida de ventana',
    status: 'aprobado',
    loadable: true,
    nota: 'Visto: perfil de él con gafas y chaqueta negra mirando la pantalla de una laptop, manos en el teclado; a la izquierda una ventana con luz cálida y una planta; en primer plano una taza negra y un cuaderno. El ES vigente es correcto y se conserva. Solo se agrega el EN que falta.',
    source: PHOTO_SOURCE,
  },
  {
    key: 'home-about-retrato',
    kind: 'foto',
    mediaSlug: 'p54-home-about-retrato',
    es: 'Juan Carlos Angulo con gafas y chaqueta oscura, sonriendo, frente a ramas con musgo y luces cálidas',
    en: 'Juan Carlos Angulo smiling in glasses and a dark jacket, in front of branches with moss and warm string lights',
    actualEs: 'Juan Carlos Angulo con chaqueta oscura, sonriendo, con luces cálidas detrás',
    actualEn: 'Juan Carlos Angulo con chaqueta oscura, sonriendo, con luces cálidas detrás',
    status: 'aprobado',
    loadable: true,
    nota: 'Visto: retrato de medio cuerpo, sonriendo, con gafas y chaqueta oscura con cierre sobre camisa clara, delante de ramas con musgo colgante y una tira de luces cálidas. Se agregan las gafas y las ramas para que el alt describa lo que realmente se ve.',
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
    status: 'aprobado',
    loadable: true,
    nota: 'Visto: página larga en tema oscuro, sitio en inglés. Hero con titular "Your AI-Powered Sales Machine, Expertly Built and Ready to Run" y botones Get Started y Free Strategy Call. Más abajo: seis problemas, beneficios, testimonios con estrellas, tres planes de precios (199, 299 y 699 al mes), preguntas frecuentes y pie.',
    source: CAPTURE_SOURCE,
  },
  {
    key: 'aprendoclub',
    kind: 'captura',
    mediaSlug: 'aprendoclub-com-screenshot',
    es: 'Inicio de aprendoclub en tema oscuro: titular sobre una academia de marketing e IA que ayuda a encontrar trabajo y botón Únete ahora',
    en: 'aprendoclub home page in dark theme: headline about a marketing and AI academy that helps students find work, and a Join now button',
    actualEs: currentCaptureAlt('Aprendoclub'),
    actualEn: currentCaptureAlt('Aprendoclub'),
    status: 'aprobado',
    loadable: true,
    nota: 'Visto: página en español en tema oscuro. Hero con "La única academia de marketing e IA que te ayuda a encontrar trabajo", botones Únete a aprendoclub y Agenda una llamada, insignia de más de 10.000 estudiantes y calificación 4,9. Más abajo: el problema, programas, testimonios de estudiantes y una asesoría gratuita.',
    source: CAPTURE_SOURCE,
  },
  {
    key: 'ariannalupi',
    kind: 'captura',
    mediaSlug: 'ariannalupi-com-screenshot',
    es: 'Inicio de Arianna Lupi: saludo Hola, soy Arianna Lupi, su retrato sonriendo frente a una laptop y secciones de marcas y charlas',
    en: 'Arianna Lupi home page: greeting Hola, soy Arianna Lupi, her portrait smiling in front of a laptop and sections on brands and talks',
    actualEs: currentCaptureAlt('Arianna Lupi'),
    actualEn: currentCaptureAlt('Arianna Lupi'),
    status: 'aprobado',
    loadable: true,
    nota: 'Visto: sitio en español de fondo crema con acentos terracota. Hero con "Hola, soy Arianna Lupi", retrato en arco de ella sonriendo con blazer negro frente a una laptop y la insignia 8+ años de experiencia; cinta de sectores, logos de menciones, "Marcas que han confiado en mi trabajo" y "Donde he compartido" sobre fondo oscuro. Aviso de calidad: hay franjas crema vacías entre secciones, probablemente contenido que no alcanzó a cargar al capturar. El alt solo menciona lo que se ve.',
    source: CAPTURE_SOURCE,
  },
  {
    key: 'drmanuelvargashidalgo',
    kind: 'captura',
    mediaSlug: 'drmanuelvargashidalgo-com-screenshot',
    es: 'Inicio del sitio del urólogo Manuel A. Vargas H.: portada con él en bata blanca, ubicación, horarios, servicios y últimas publicaciones',
    en: 'Home page of urologist Manuel A. Vargas H.: cover with him in a white coat, location, hours, services and latest posts',
    actualEs: currentCaptureAlt('Dr. Manuel A. Vargas Hidalgo'),
    actualEn: currentCaptureAlt('Dr. Manuel A. Vargas Hidalgo'),
    status: 'aprobado',
    loadable: true,
    nota: 'Visto: sitio en español, encabezado con ícono de riñones, franja verde con ubicación en Santiago (República Dominicana), WhatsApp y horarios; portada con el doctor en bata blanca; secciones Sobre mí, seguros, servicios (cuatro columnas), publicaciones, un feed de Instagram con casillas grises vacías y pie sobre una foto quirúrgica. Aviso de calidad: las casillas del feed y la zona de seguros salen vacías en la captura.',
    source: CAPTURE_SOURCE,
  },
  {
    key: 'estylopia',
    kind: 'captura',
    mediaSlug: 'estylopia-com-screenshot',
    es: 'Inicio de Estylopia, asesoría de estilo: mujer sentada con blazer blanco bajo el saludo Bienvenidos a Estylopia, servicios y entradas del blog',
    en: 'Estylopia home page, a style advisory: a seated woman in a white blazer under the greeting Bienvenidos a Estylopia, services and blog posts',
    actualEs: currentCaptureAlt('Estylopia'),
    actualEn: currentCaptureAlt('Estylopia'),
    status: 'aprobado',
    loadable: true,
    nota: 'Visto: sitio en español sobre fondo blanco. Hero a ancho completo con una mujer sentada con blazer blanco y jeans y el texto "Bienvenidos a Estylopia"; después propuesta de valor, tres servicios (Look de Impacto, Clóset Cápsula con Estilo y Experiencia Style & Fun), recomendados, boletín y tarjetas del blog cuyas imágenes salen como degradados grises. Aviso de calidad: esas imágenes del blog no cargaron al capturar.',
    source: CAPTURE_SOURCE,
  },
  {
    key: 'juan-tech',
    kind: 'captura',
    mediaSlug: 'juan-tech-com-screenshot',
    es: 'Página en blanco con el aviso en inglés This deployment is temporarily paused',
    en: 'Blank page with the notice This deployment is temporarily paused',
    actualEs: currentCaptureAlt('Juan Tech'),
    actualEn: currentCaptureAlt('Juan Tech'),
    status: 'pendiente',
    loadable: false,
    nota: 'DEFECTO DEL ARCHIVO, NO DEL TEXTO. La captura que sirve dev (1000 por 563 px, 5 KB) no muestra el sitio de Juan: es la página de Vercel "This deployment is temporarily paused" sobre fondo blanco, con un identificador gru1 al pie. El texto de arriba describe honestamente ese archivo y NO debe cargarse. Hay que recapturar juan-tech.com y recién entonces redactar el alt de lo que se vea (no se redacta uno de memoria: el sandbox muestra otro titular, Construyo software rápido, que ya no es el aprobado).',
    source: CAPTURE_SOURCE,
  },
]

export const ALL_ALTS: AltRow[] = [...PHOTO_ALTS, ...CAPTURE_ALTS]

/**
 * Imagenes que se dejan SIN alt a proposito (alt vacio). No cuentan como filas de alt:
 * la autoprueba exige texto en todas las filas de ALL_ALTS.
 *
 * El avatar de Juan junto al cierre de /websites y /sobre-mi sale con alt="" y es correcto:
 * es decorativo porque el nombre "Juan Carlos Angulo" esta escrito justo al lado, y un alt
 * lo repetiria al lector de pantalla (A11Y.md, imagenes decorativas). Lo que RESEARCH 9
 * llamaba "foto del taller de Sobre mi con alt vacio" es este avatar: no existe una segunda
 * foto de Sobre mi. La foto del taller es la de la home, que ya tiene alt.
 */
export const DECORATIVE_IMAGES: { key: string; mediaSlug: string; why: string }[] = [
  {
    key: 'cta-avatar',
    mediaSlug: 'juan-carlos-angulo-avatar-v3',
    why: 'Avatar de 32 px junto al nombre escrito en el cierre de la home, /sobre-mi y /websites: decorativo, alt vacio correcto',
  },
]

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
  source: row.loadable ? `${row.source}; aprobado por Juan 2026-11-10 (aprobaciones-juan.md)` : row.source,
}))
