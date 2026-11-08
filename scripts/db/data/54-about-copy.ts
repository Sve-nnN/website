/**
 * Copy ES aprobado del sandbox (designs/design-system-mui) para el global
 * `about-page`. Verbatim de AboutPage.tsx y data/about.ts.
 *
 * Los párrafos de la bio salen de authors.bio, la educación de authors y las
 * ponencias de speaking-events: no se duplican aquí.
 *
 * PENDIENTE a propósito: la fecha de la etapa de aprendoclub conserva su
 * marcador tal cual (CONTEXT, Contenido pendiente). Se renderiza como está en
 * Payload y la fase 56 la cierra. Es el único marcador permitido en este copy.
 */
export const ABOUT_PENDING_PATHS = ['experience.stages[].when'] as const

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
    lead: 'AprendoSEO, aprendoclub y Loops Growth son el mismo equipo con tres nombres. Sigo trabajando ahí.',
    // Orden cronológico, igual que el sandbox.
    stages: [
      {
        when: 'ene 2022 a sept 2022',
        role: 'Desarrollador Web',
        org: 'Cripto Avances y Nakama Digital',
        body: 'Desarrollé y optimicé plataformas con el SEO integrado desde el código base (HTML5 y PHP), con atención al rendimiento de servidor y de front-end.',
        current: false,
      },
      {
        when: 'nov 2022',
        role: 'Especialista en Tech SEO',
        org: 'AprendoSEO',
        body: 'Entré al equipo como especialista en SEO técnico. Hacía auditorías técnicas, arreglaba problemas de indexación y lideré migraciones de varios sitios a Webflow.',
        current: false,
      },
      {
        when: '{{pendiente}} fecha del cambio de nombre',
        role: 'Senior Tech SEO Analyst',
        org: 'aprendoclub',
        body: 'AprendoSEO pasa a llamarse aprendoclub. Llego a Senior y llevo el SEO técnico de más de 18 clientes internacionales.',
        current: false,
      },
      {
        when: '2024 a hoy',
        role: 'Senior Technical SEO Analyst',
        org: 'Loops Growth',
        body: 'El equipo cambia de nombre otra vez y hoy es Loops Growth. Sigo trabajando ahí.',
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
    ],
  },
  education: {
    title: 'Educación y certificaciones',
  },
  talks: {
    title: 'Eventos donde he sido ponente',
  },
}
