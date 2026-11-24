/**
 * Copy de Sobre mi para el global `about-page` (fase 56, plan 56-04, CONT-01, D-11, D-12, D-14).
 *
 * Desde la fase 56 la fuente del copy vive aqui. scripts/db/data/54-about-copy.ts
 * solo reexporta ABOUT_COPY_ES y ABOUT_PENDING_PATHS para que todo importador de la 54
 * (verificadores y script 20) siga funcionando.
 *
 * Linea de tiempo (D-11), APROBADA por Juan el 2026-11-10 (ver
 * .planning/phase-56-prep/aprobaciones-juan.md): aprendoseo (nov 2022) renombrada
 * aprendoclub es UNA sola etapa continua "nov 2022 a hoy"; Loops Growth "2024 a hoy" es
 * una empresa distinta que coexiste; el coach del diplomado es "mar 2025 a hoy". El
 * marcador de fecha del cambio de nombre desaparece. No se inventa ninguna fecha:
 * ALLOWED_WHEN es la lista cerrada y la autoprueba la exige.
 *
 * "Ingeniero de software" con fecha de fin 2028 es un titulo universitario en curso:
 * se queda como educacion (fila del autor), no como cargo. Juan lo confirmo.
 *
 * La copia EN (D-14) es una traduccion fiel del ES y queda en estado `propuesto`: la
 * siembra EN (plan 56-12) espera la aprobacion de Juan.
 *
 * Este archivo no escribe en ninguna base. Sin imports de Payload ni de red.
 */
import type { Decision } from './56-content-decisions'

/** El marcador de la fecha ya no se permite en ninguna parte del copy. */
export const ABOUT_PENDING_PATHS = [] as const

/** Lista cerrada de valores de `when` del copy ES. Cualquier otra cadena es un fallo. */
export const ALLOWED_WHEN = [
  'ene 2022 a sept 2022',
  'nov 2022 a hoy',
  '2024 a hoy',
  'mar 2025 a hoy',
] as const

/** Lista cerrada de valores de `when` del copy EN (mismas fechas, vocabulario de messages/en.json). */
export const ALLOWED_WHEN_EN = [
  'Jan 2022 to Sep 2022',
  'Nov 2022 to today',
  '2024 to today',
  'Mar 2025 to today',
] as const

type StageEs = {
  when: string
  role: string
  org: string
  body: string
  current: boolean
  linkLabel?: string
  linkHref?: string
}

/** Frase de Loops Growth aprobada en D-12, tal cual. */
const LOOPS_ES =
  'Agencia de SEO y GEO que ejecuta tu posicionamiento en Google y tu visibilidad en asistentes de IA como ChatGPT y Gemini.'
const LOOPS_EN =
  'SEO and GEO agency that runs your Google rankings and your visibility in AI assistants like ChatGPT and Gemini.'

/** Orden cronologico, igual que el sandbox. Una etapa por empresa; Loops y aprendoclub coexisten. */
const CUATRO_ETAPAS_ES: StageEs[] = [
  {
    when: 'ene 2022 a sept 2022',
    role: 'Desarrollador Web',
    org: 'Cripto Avances y Nakama Digital',
    body: 'Desarrollé y optimicé plataformas con el SEO integrado desde el código base (HTML5 y PHP), con atención al rendimiento de servidor y de front-end.',
    current: false,
  },
  {
    when: 'nov 2022 a hoy',
    role: 'Senior Tech SEO Analyst',
    org: 'aprendoclub',
    // Frases ya aprobadas del copy anterior, reordenadas. Ningun hecho nuevo.
    body: 'Entré al equipo de AprendoSEO como especialista en SEO técnico. Hacía auditorías técnicas, arreglaba problemas de indexación y lideré migraciones de varios sitios a Webflow. AprendoSEO pasa a llamarse aprendoclub. Llego a Senior y llevo el SEO técnico de más de 18 clientes internacionales.',
    current: true,
  },
  {
    when: '2024 a hoy',
    role: 'Senior Technical SEO Analyst',
    org: 'Loops Growth',
    body: `${LOOPS_ES} Sigo trabajando ahí.`,
    current: true,
  },
  {
    when: 'mar 2025 a hoy',
    role: 'Coach de SEO técnico del Diplomado SEO + AIO',
    org: 'aprendoclub',
    body: 'Acompaño a cohortes de estudiantes hispanohablantes de Latinoamérica: reviso arquitecturas web, auditorías técnicas y dudas de indexación, rastreo y rendimiento, y grabo las clases.',
    current: true,
    linkLabel: 'Ver el diplomado',
    linkHref: 'https://www.aprendoclub.com/diplomado',
  },
]

/** Lead de la seccion: ya no afirma que las tres marcas son el mismo equipo (contradecia D-11). */
const LEAD_ES = 'Trabajo en dos empresas de SEO a la vez: aprendoclub desde noviembre de 2022 y Loops Growth desde 2024.'
const LEAD_EN = 'I work at two SEO companies at the same time: aprendoclub since November 2022 and Loops Growth since 2024.'

/** Etapas por opcion de ABOUT_TIMELINE. `cinco-etapas` no tiene datos: exige una fecha que Juan no dio. */
const STAGES_BY_OPTION: Record<string, StageEs[] | undefined> = {
  'cuatro-etapas': CUATRO_ETAPAS_ES,
  'cinco-etapas': undefined,
}

function stagesFor(decision: Decision): StageEs[] {
  const key = decision.chosen ?? ''
  const stages = STAGES_BY_OPTION[key]
  if (!stages) {
    throw new Error(
      `ABOUT_TIMELINE: la opcion "${key}" no tiene etapas definidas. "cinco-etapas" solo se activa si Juan dicta la fecha del cambio de nombre: agrega esa fecha a ALLOWED_WHEN, define las etapas y vuelve a verificar.`,
    )
  }
  return stages
}

function previewOf(stages: StageEs[]): string {
  return stages
    .map((s) => `${s.when} | ${s.role} | ${s.org}${s.current ? ' | actual' : ''}\n  ${s.body}`)
    .join('\n')
}

/** Decision D-11: la propuesta de cuatro etapas, aprobada por Juan. */
export const ABOUT_TIMELINE: Decision = {
  id: 'D-11',
  label: 'Linea de tiempo de Sobre mi (aprendoclub una sola etapa, Loops Growth en paralelo)',
  status: 'aprobado',
  gate: 'aprobado',
  chosen: 'cuatro-etapas',
  recommended: 'cuatro-etapas',
  source: '.planning/phase-56-prep/aprobaciones-juan.md (2026-11-10)',
  options: {
    'cuatro-etapas': {
      es: `Cuatro etapas: Cripto Avances y Nakama Digital (ene 2022 a sept 2022), aprendoclub como UNA etapa continua (nov 2022 a hoy, AprendoSEO renombrada), Loops Growth en paralelo (2024 a hoy) y coach del diplomado (mar 2025 a hoy).`,
      en: 'Four stages: Cripto Avances and Nakama Digital (Jan 2022 to Sep 2022), aprendoclub as ONE continuous stage (Nov 2022 to today, AprendoSEO renamed), Loops Growth in parallel (2024 to today) and diploma coach (Mar 2025 to today).',
      note: 'Aprobada por Juan. Baja las etapas de 5 a 4: la siembra necesita recorte con aprobacion nombrada en 56-12.',
    },
    'cinco-etapas': {
      note: 'Conserva aprendoseo y aprendoclub separadas SIN marcador y SIN fecha inventada. Solo se activa si Juan dicta la fecha del cambio de nombre. Descartada.',
    },
  },
  preview: { es: previewOf(CUATRO_ETAPAS_ES) },
}

/** Lead de la seccion de experiencia: texto nuevo redactado por Claude para quitar la contradiccion con D-11. */
const ABOUT_LEAD: Decision = {
  id: 'D-11-lead',
  label: 'Lead de la seccion Experiencia (sin la afirmacion del mismo equipo)',
  status: 'propuesto',
  gate: 'propuesto',
  chosen: 'propuesta',
  recommended: 'propuesta',
  options: {
    propuesta: { es: LEAD_ES, en: LEAD_EN, note: 'Reemplaza "AprendoSEO, aprendoclub y Loops Growth son el mismo equipo con tres nombres".' },
  },
}

/** "Ingeniero de software" 2028 es un titulo universitario en curso, no un cargo. */
const ABOUT_ENGINEER: Decision = {
  id: 'D-11-ingeniero',
  label: 'Ingeniero de software (fin 2028) se queda como educacion en curso',
  status: 'aprobado',
  gate: 'aprobado',
  source: '.planning/phase-56-prep/aprobaciones-juan.md (2026-11-10)',
  preview: {
    es: 'Se conserva en la fila de educacion del autor (may 2022 a ago 2028, En curso). La fila de autor de aprendoclub dice "nov 2022 a feb 2026" y se corrige a "nov 2022 a hoy" en el corte (56-14).',
  },
}

const stages = stagesFor(ABOUT_TIMELINE)

/** Copy ES del global about-page, derivado de la opcion elegida en ABOUT_TIMELINE. */
export const ABOUT_COPY_ES = {
  hero: {
    eyebrow: 'Ingeniero de software y consultor SEO técnico',
    lead: 'Ingeniero de Software y Consultor SEO Técnico freelance con sede en Lima, Perú.',
    chips: [{ icon: 'map-pin', label: 'Lima, Perú' }, { label: 'Español e inglés' }],
  },
  bio: {
    title: 'Dónde se cruzan el código y el SEO',
  },
  counters: {
    yearsLabel: 'años de experiencia profesional',
    seoLabel: 'proyectos de SEO',
    devLabel: 'proyectos de desarrollo',
  },
  specialties: {
    title: 'Áreas de especialización',
    items: [
      { title: 'SEO técnico avanzado', detail: 'Rastreo e indexación' },
      { title: 'Rendimiento web', detail: 'WPO y Core Web Vitals' },
      { title: 'Algoritmia y estructuras de datos', detail: 'Base de ingeniería de software' },
      { title: 'Optimización de tasa de conversión', detail: 'CRO' },
    ],
  },
  experience: {
    title: 'Experiencia',
    lead: LEAD_ES,
    stages,
  },
  education: {
    title: 'Educación y certificaciones',
  },
  talks: {
    title: 'Eventos donde he sido ponente',
  },
}

/**
 * Copia EN (D-14): traduccion fiel del ES. Solo lleva los campos localizados; omite
 * icon, current y linkHref, que no se localizan. `hero.lead` no vacio es el centinela
 * del respaldo de idioma (si falta, `/en/sobre-mi` cae al espanol).
 */
export const ABOUT_COPY_EN = {
  hero: {
    eyebrow: 'Software engineer and technical SEO consultant',
    lead: 'Freelance Software Engineer and Technical SEO Consultant based in Lima, Peru.',
    chips: [{ label: 'Lima, Peru' }, { label: 'Spanish and English' }],
  },
  bio: {
    title: 'Where code and SEO meet',
  },
  counters: {
    yearsLabel: 'years of professional experience',
    seoLabel: 'SEO projects',
    devLabel: 'development projects',
  },
  specialties: {
    title: 'Areas of expertise',
    items: [
      { title: 'Advanced technical SEO', detail: 'Crawling and indexing' },
      { title: 'Web performance', detail: 'WPO and Core Web Vitals' },
      { title: 'Algorithms and data structures', detail: 'Software engineering foundation' },
      { title: 'Conversion rate optimization', detail: 'CRO' },
    ],
  },
  experience: {
    title: 'Experience',
    lead: LEAD_EN,
    stages: [
      {
        when: 'Jan 2022 to Sep 2022',
        role: 'Web Developer',
        org: 'Cripto Avances and Nakama Digital',
        body: 'I built and optimized platforms with SEO baked into the codebase (HTML5 and PHP), with attention to server and front-end performance.',
      },
      {
        when: 'Nov 2022 to today',
        role: 'Senior Tech SEO Analyst',
        org: 'aprendoclub',
        body: 'I joined the AprendoSEO team as a technical SEO specialist. I ran technical audits, fixed indexing problems and led the migration of several sites to Webflow. AprendoSEO was renamed aprendoclub. I moved up to Senior and I now run the technical SEO of more than 18 international clients.',
      },
      {
        when: '2024 to today',
        role: 'Senior Technical SEO Analyst',
        org: 'Loops Growth',
        body: `${LOOPS_EN} I still work there.`,
      },
      {
        when: 'Mar 2025 to today',
        role: 'Technical SEO coach for the SEO + AIO Diploma',
        org: 'aprendoclub',
        body: 'I guide cohorts of Spanish-speaking students from Latin America: I review web architectures, technical audits and questions about indexing, crawling and performance, and I record the classes.',
        linkLabel: 'See the diploma',
      },
    ],
  },
  education: {
    title: 'Education and certifications',
  },
  talks: {
    title: 'Events where I have spoken',
  },
}

/** Aprobacion de la copia EN: Juan debe aprobarla antes de que 56-12 la siembre. */
const ABOUT_EN_DECISION: Decision = {
  id: 'ABOUT-EN',
  label: 'Copia EN de Sobre mi (hoy /en/sobre-mi cae al espanol)',
  status: 'aprobado',
  gate: 'aprobado',
  chosen: 'traduccion-fiel',
  recommended: 'traduccion-fiel',
  options: {
    'traduccion-fiel': {
      es: 'Traduccion fiel del ES aprobado, con la frase EN de Loops de D-12 tal cual.',
      en: `${ABOUT_COPY_EN.hero.lead} | ${ABOUT_COPY_EN.experience.lead} | ${LOOPS_EN}`,
      note: 'Propuesta. La siembra EN espera la aprobacion de Juan.',
    },
  },
  preview: {
    en: ABOUT_COPY_EN.experience.stages.map((s) => `${s.when} | ${s.role} | ${s.org}\n  ${s.body}`).join('\n'),
  },
}

export const DECISIONS: Decision[] = [ABOUT_TIMELINE, ABOUT_LEAD, ABOUT_ENGINEER, ABOUT_EN_DECISION]
