import { getPayload } from 'payload'
import config from '../src/payload.config'

const payload = await getPayload({ config })

const META: Record<string, { es: string; en: string }> = {
  blog: {
    es: 'Artículos técnicos sobre SEO, rendimiento web y desarrollo full-stack, escritos desde la práctica diaria de auditorías y correcciones de código real.',
    en: 'Technical articles on SEO, web performance, and full-stack development, written from daily hands-on audits and real code fixes.',
  },
  contact: {
    es: 'Contame sobre tu proyecto y te respondo en menos de 48 horas. Auditorías técnicas, desarrollo web y consultoría SEO, sin intermediarios.',
    en: "Tell me about your project and I'll reply within 48 hours. Technical audits, web development, and SEO consulting, no middlemen.",
  },
  terms: {
    es: 'Términos de servicio de Juan Carlos Angulo: alcance del trabajo, condiciones de pago y responsabilidades para auditorías, desarrollo y consultoría.',
    en: "Terms of service for Juan Carlos Angulo's work: scope, payment conditions, and responsibilities for audits, development, and consulting.",
  },
  privacy: {
    es: 'Cómo manejo los datos que me compartís por el formulario de contacto o durante un proyecto: qué recolecto, para qué y por cuánto tiempo.',
    en: 'How I handle the data you share through the contact form or during a project: what I collect, why, and for how long.',
  },
  services: {
    es: 'Auditorías técnicas SEO, desarrollo full-stack con Next.js y Payload, y consultoría de posicionamiento orgánico. Trabajo directo sobre el código.',
    en: 'Technical SEO audits, full-stack development with Next.js and Payload, and organic ranking consulting. I work directly on the code.',
  },
  'seo-technical-audit': {
    es: 'Auditoría técnica SEO completa: rastreo, indexación, Core Web Vitals y datos estructurados, con un plan de corrección priorizado por impacto real.',
    en: 'Full technical SEO audit: crawling, indexation, Core Web Vitals, and structured data, with a fix plan prioritized by real impact.',
  },
  'seo-consulting': {
    es: 'Consultoría SEO continua para equipos que necesitan alguien que entienda tanto el código como el posicionamiento, sin traducir entre agencia y desarrollo.',
    en: 'Ongoing SEO consulting for teams that need someone who understands both the code and the rankings, no translation layer between agency and dev.',
  },
  'fullstack-development': {
    es: 'Desarrollo full-stack con Next.js y Payload CMS, pensado desde el primer commit para que el sitio rinda bien y sea indexable sin parches después.',
    en: 'Full-stack development with Next.js and Payload CMS, built from the first commit to perform well and stay indexable without patches later.',
  },
  'ai-seo-geo': {
    es: 'Optimización para que tu contenido sea citado por ChatGPT, Perplexity y las respuestas de IA de Google, además del ranking tradicional en buscadores.',
    en: 'Optimization so your content gets cited by ChatGPT, Perplexity, and Google AI answers, on top of traditional search rankings.',
  },
  'seo-tecnico-lima': {
    es: 'SEO técnico para negocios en Lima: auditorías, SEO local y contenido que compite de verdad contra la competencia real de la ciudad.',
    en: 'Technical SEO for businesses in Lima: audits, local SEO, and content that actually competes against the city’s real competition.',
  },
  'seo-tecnico-madrid': {
    es: 'SEO técnico para negocios en Madrid: auditorías, SEO local y contenido que compite de verdad contra la competencia real de la ciudad.',
    en: 'Technical SEO for businesses in Madrid: audits, local SEO, and content that actually competes against the city’s real competition.',
  },
}

let updated = 0
for (const slug of Object.keys(META)) {
  const found = await payload.find({ collection: 'pages', where: { slug: { equals: slug } }, limit: 1, locale: 'es', depth: 0 })
  const doc = found.docs[0]
  if (!doc) {
    console.log('SKIP (not found):', slug)
    continue
  }
  await payload.update({
    collection: 'pages',
    id: doc.id,
    locale: 'es',
    data: { meta: { description: META[slug].es } },
  })
  await payload.update({
    collection: 'pages',
    id: doc.id,
    locale: 'en',
    data: { meta: { description: META[slug].en } },
  })
  console.log('Updated:', slug)
  updated++
}

console.log(`Done. ${updated}/${Object.keys(META).length} pages updated.`)
process.exit(0)
