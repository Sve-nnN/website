/**
 * Arnes SSR de autores (fase 55, plan 55-12): indice y, luego, perfil.
 *
 * Renderiza las vistas con fixtures INVENTADOS por 54-ssr-harness y comprueba
 * estructura. No toca base ni red. Ningun texto sale del sandbox (D-02).
 *
 *   node_modules/.bin/tsx scripts/verify/55-authors-ssr.ts
 *
 * Imprime PASS o FAIL motivo por caso y sale con 1 ante cualquier FAIL.
 * Sin JSX a proposito (jsx: preserve): todo con createElement.
 */
import * as React from 'react'
import { createElement } from 'react'

import { AuthorProfileView } from '../../src/components/pages/authors/AuthorProfileView'
import { AuthorsIndexView } from '../../src/components/pages/authors/AuthorsIndexView'
import {
  buildAuthorPersonJsonLd,
  buildOtherAuthorPersonJsonLd,
  pickAuthorCases,
  safeExternalUrl,
  toAuthorProfileProps,
  toAuthorsIndexProps,
  type AuthorCaseDocLike,
  type AuthorEventDocLike,
  type AuthorIndexDocLike,
  type AuthorIndexItem,
  type AuthorProfileDocLike,
  type AuthorProfileProps,
} from '../../src/lib/authors-data'
import { PERSON_ID, personRef, SITE_PERSON_SLUG } from '../../src/lib/person'
import { countOf, headingLevels, renderToHtml, textOf } from './54-ssr-harness'

// tsx usa el runtime clasico con jsx: preserve; los componentes .tsx necesitan React global.
;(globalThis as { React?: typeof React }).React = React

let failures = 0
function check(ok: boolean, name: string, reason: string): void {
  if (ok) {
    console.log(`PASS ${name}`)
  } else {
    failures += 1
    console.log(`FAIL ${name}: ${reason}`)
  }
}

const CRUMBS = [
  { label: 'Inicio', href: '/' },
  { label: 'Autores', href: '/authors' },
]

// ---------------------------------------------------------------------------
// Indice
// ---------------------------------------------------------------------------

const INDEX_DOCS: AuthorIndexDocLike[] = [
  {
    id: 1,
    slug: 'ana-de-prueba',
    name: 'Ana de Prueba',
    jobTitle: 'Ingeniera de datos',
    bio: 'Primer parrafo de la bio de Ana.\n\nSegundo parrafo que no va en el extracto.',
    avatar: { url: 'https://res.example.test/ana.jpg', alt: 'Retrato de Ana de Prueba', width: 640, height: 640 },
    yearsExperience: 7,
  },
  {
    id: 2,
    slug: 'beto-sin-foto',
    name: 'Beto Sin Foto',
    jobTitle: null,
    bio: null,
    avatar: null,
    yearsExperience: null,
  },
  // Sin alt en Media: el alt cae al nombre del autor.
  {
    id: 3,
    slug: 'carla-de-ejemplo',
    name: 'Carla de Ejemplo',
    jobTitle: 'Editora',
    bio: 'Bio de Carla.',
    avatar: { url: 'https://res.example.test/carla.jpg', alt: null, width: null, height: null },
  },
]

/** Contrato estructural que el indice debe cumplir. Devuelve los motivos de fallo. */
function indexFailures(rawHtml: string, items: AuthorIndexItem[]): string[] {
  const reasons: string[] = []
  // Las reglas de Emotion (`<style>`) traen llaves y urls: no son marcado visible.
  const html = rawHtml.replace(/<style[\s\S]*?<\/style>/g, '')
  const h1 = headingLevels(html).filter((l) => l === 1).length
  if (h1 !== 1) reasons.push(`se esperaba un h1 y hay ${h1}`)
  for (const item of items) {
    const re = new RegExp(`href="(?:/en)?/authors/${item.slug}"`, 'g')
    if (countOf(html, re) !== 1) reasons.push(`se esperaba un enlace a /authors/${item.slug} y hay ${countOf(html, re)}`)
    if (item.avatar) {
      const img = new RegExp(`<img[^>]*src="${item.avatar.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`).exec(html)?.[0] ?? ''
      if (img === '') reasons.push(`falta la imagen de ${item.slug}`)
      else if (!/\salt="[^"]+"/.test(img)) reasons.push(`la imagen de ${item.slug} no tiene alt`)
    }
  }
  const withAvatar = items.filter((i) => i.avatar).length
  if (countOf(html, /<img\s/g) !== withAvatar) reasons.push(`se esperaban ${withAvatar} imagenes y hay ${countOf(html, /<img\s/g)}`)
  // Cada autor es un h2 (el h1 es el de la pagina).
  const h2 = headingLevels(html).filter((l) => l === 2).length
  if (items.length > 0 && h2 !== items.length) reasons.push(`se esperaban ${items.length} h2 de autor y hay ${h2}`)
  if (/designs\//.test(html)) reasons.push('el HTML nombra una ruta de designs/')
  if (countOf(html, /<main[\s>]/) !== 0) reasons.push('la vista declara un main (lo pone el layout)')
  const text = textOf(html)
  if (/\bnull\b|\bundefined\b/.test(text)) reasons.push('aparece null o undefined en el texto')
  if (/{{|}}/.test(html)) reasons.push('quedan llaves dobles sin renderizar')
  return reasons
}

function renderIndex(items: AuthorIndexItem[], locale: 'es' | 'en'): string {
  return renderToHtml(createElement(AuthorsIndexView, { crumbs: CRUMBS, title: 'Autores', items }), locale)
}

function mainIndex(): void {
  const items = toAuthorsIndexProps(INDEX_DOCS, 'es')
  check(items.length === 3, 'indice props: tres autores con slug y nombre', `${items.length}`)
  check(items[0]?.excerpt === 'Primer parrafo de la bio de Ana.', 'indice props: el extracto es el primer parrafo', `${items[0]?.excerpt}`)
  check(items[1]?.avatar === null && items[1]?.excerpt === null, 'indice props: sin avatar ni bio queda null', JSON.stringify(items[1]))
  check(items[2]?.avatar?.alt === 'Carla de Ejemplo', 'indice props: sin alt en Media, el alt es el nombre', `${items[2]?.avatar?.alt}`)
  check(
    toAuthorsIndexProps([{ slug: '', name: 'Sin slug' }, { slug: 'sin-nombre', name: '  ' }], 'es').length === 0,
    'indice props: sin slug o sin nombre no hay tarjeta',
    'produjo una tarjeta',
  )

  for (const locale of ['es', 'en'] as const) {
    const html = renderIndex(items, locale)
    const reasons = indexFailures(html, items)
    check(reasons.length === 0, `indice ${locale}: contrato completo`, reasons.join('; '))
    check(/alt="Retrato de Ana de Prueba"/.test(html), `indice ${locale}: la imagen usa el alt de Media`, 'falta el alt de Media')
    check(/width="640"[^>]*height="640"|height="640"[^>]*width="640"/.test(html), `indice ${locale}: la imagen lleva ancho y alto de Media`, 'faltan las medidas')
  }

  // Lista vacia: estado vacio y un h1, sin lista.
  const emptyHtml = renderIndex([], 'es')
  check(
    /Próximamente/.test(textOf(emptyHtml)) && headingLevels(emptyHtml).filter((l) => l === 1).length === 1 && countOf(emptyHtml, /<ul[\s>]/) === 0,
    'indice vacio: estado vacio, un h1 y ninguna tarjeta',
    'falta el estado vacio o el h1',
  )

  // Fixtures defectuosos: deben fallar.
  const good = renderIndex(items, 'es')
  const twoH1 = good.replace('</section>', '<h1>otro</h1></section>')
  check(indexFailures(twoH1, items).some((r) => r.includes('h1')), 'defectuoso: dos h1 se detecta', 'el contrato no detecto dos h1')
  const missing = good.replace(/href="\/authors\/ana-de-prueba"/g, 'href="#"')
  check(indexFailures(missing, items).some((r) => r.includes('ana-de-prueba')), 'defectuoso: autor sin enlace se detecta', 'el contrato no detecto el enlace faltante')
  const noAlt = good.replace(/alt="Retrato de Ana de Prueba"/, 'alt=""')
  check(indexFailures(noAlt, items).some((r) => r.includes('alt')), 'defectuoso: imagen sin alt se detecta', 'el contrato no detecto la imagen sin alt')
}

// ---------------------------------------------------------------------------
// Perfil
// ---------------------------------------------------------------------------

const NOW = Date.parse('2026-11-10T00:00:00.000Z')

const PROFILE_DOC: AuthorProfileDocLike = {
  id: 1,
  slug: 'ana-de-prueba',
  name: 'Ana de Prueba',
  jobTitle: 'Ingeniera de datos',
  bio: 'Primer parrafo de la bio de Ana.\n\nSegundo parrafo de la bio.',
  avatar: { url: 'https://res.example.test/ana.jpg', alt: 'Retrato de Ana de Prueba', width: 640, height: 640 },
  yearsExperience: 7,
  credentials: [{ label: 'Credencial inventada uno' }, { label: 'Credencial inventada dos' }],
  expertise: [{ topic: 'Tema inventado A' }, { topic: 'Tema inventado B' }],
  experience: [
    {
      role: 'Cargo actual inventado',
      company: 'Empresa Uno',
      startDate: '2024-01-01T00:00:00.000Z',
      endDate: null,
      description: 'Descripcion del cargo actual.',
    },
    {
      role: 'Cargo anterior inventado',
      company: 'Empresa Dos',
      startDate: '2020-03-01T00:00:00.000Z',
      endDate: '2023-12-01T00:00:00.000Z',
      description: null,
    },
  ],
  education: [
    {
      degree: 'Titulo en curso inventado',
      institution: 'Universidad Uno',
      startDate: '2022-05-01T00:00:00.000Z',
      endDate: '2028-08-01T00:00:00.000Z',
    },
    {
      degree: 'Titulo terminado inventado',
      institution: 'Instituto Dos',
      startDate: '2015-01-01T00:00:00.000Z',
      endDate: '2019-12-01T00:00:00.000Z',
    },
  ],
  socialLinks: [
    { platform: 'linkedin', url: 'https://www.linkedin.example.test/in/ana' },
    { platform: 'github', url: 'javascript:alert(1)' },
    { platform: 'website', url: 'https://ana.example.test/' },
  ],
}

const EVENT_DOCS: AuthorEventDocLike[] = [
  {
    id: 1,
    title: 'Taller inventado (por Organizador Uno)',
    role: 'Ponente',
    description: 'Descripcion del taller.',
    location: 'Ciudad Uno',
    attendeeCount: 40,
    date: '2025-05-12T00:00:00.000Z',
    link: 'https://evento.example.test/taller',
    coSpeakers: [{ name: 'Persona Uno' }, { name: 'Persona Dos' }],
    flyer: null,
  },
  { id: 2, title: 'Charla inventada', role: null, link: 'data:text/html,<script>1</script>', flyer: null },
]

/** Posts inventados con la forma de getCachedAuthorPosts. */
function fakePosts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    slug: `post-inventado-${i + 1}`,
    title: `Post inventado ${i + 1}`,
    excerpt: `Resumen inventado ${i + 1}`,
    publishedAt: '2026-01-15T00:00:00.000Z',
    categories: [{ id: 1, slug: 'tema-uno', title: 'Tema Uno' }],
    heroImage: null,
  }))
}

function fakeCases(count: number): AuthorCaseDocLike[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    slug: `caso-inventado-${i + 1}`,
    title: `Caso inventado ${i + 1}`,
    heroMetric: '+120 % clics',
    heroSubtitle: `Subtitulo ${i + 1}`,
    sector: 'Sector inventado',
    author: 1,
  }))
}

const CRUMBS_PROFILE = [
  { label: 'Inicio', href: '/' },
  { label: 'Autores', href: '/authors' },
  { label: 'Ana de Prueba' },
]

function renderProfile(profile: AuthorProfileProps, locale: 'es' | 'en'): string {
  return renderToHtml(createElement(AuthorProfileView, { crumbs: CRUMBS_PROFILE, profile }), locale)
}

const SECTION_TITLES = {
  credentials: /Credenciales|Credentials/,
  expertise: /Áreas de especialización|Areas of expertise/,
  experience: /<h2[^>]*>Experiencia<|<h2[^>]*>Experience</,
  education: /Educación y certificaciones|Education and certifications/,
  events: /Eventos donde he sido ponente|Speaking events/,
  posts: /<h2[^>]*>Artículos<|<h2[^>]*>Posts</,
  cases: /Casos de éxito|Case studies/,
} as const

function profileFailures(rawHtml: string, p: AuthorProfileProps): string[] {
  const reasons: string[] = []
  const html = rawHtml.replace(/<style[\s\S]*?<\/style>/g, '')
  const levels = headingLevels(html)
  const h1 = levels.filter((l) => l === 1).length
  if (h1 !== 1) reasons.push(`se esperaba un h1 y hay ${h1}`)
  for (let i = 1; i < levels.length; i += 1) {
    if (levels[i]! - levels[i - 1]! > 1) reasons.push(`salto de nivel de encabezado h${levels[i - 1]} a h${levels[i]}`)
  }
  if (!html.includes(p.name)) reasons.push('falta el nombre en el h1')
  const text = textOf(html)
  // Cada seccion aparece si y solo si tiene datos (sin encabezado huerfano).
  const expectations: Array<[keyof typeof SECTION_TITLES, number]> = [
    ['credentials', p.credentials.length],
    ['expertise', p.expertise.length],
    ['experience', p.experience.length],
    ['education', p.education.length],
    ['events', p.events.length],
    ['posts', p.posts.length],
    ['cases', p.cases.length],
  ]
  for (const [key, size] of expectations) {
    const present = SECTION_TITLES[key].test(key === 'experience' || key === 'posts' ? html : text)
    if (size > 0 && !present) reasons.push(`falta la seccion ${key}`)
    if (size === 0 && present) reasons.push(`encabezado huerfano de ${key}`)
  }
  // Timeline: ul con role list y un li por etapa, h3 por etapa, fecha dentro del li.
  const timelines = [...html.matchAll(/<ul[^>]*class="[^"]*MuiTimeline-root[^"]*"[^>]*>([\s\S]*?)<\/ul>/g)]
  const expectedTimelines = (p.experience.length > 0 ? 1 : 0) + (p.education.length > 0 ? 1 : 0)
  if (timelines.length !== expectedTimelines) reasons.push(`se esperaban ${expectedTimelines} timelines (ul) y hay ${timelines.length}`)
  for (const m of timelines) {
    if (!/role="list"/.test(m[0].slice(0, m[0].indexOf('>') + 1))) reasons.push('un timeline no declara role="list"')
    const items = [...m[1]!.matchAll(/<li[\s>]/g)].length
    const h3 = [...m[1]!.matchAll(/<h3[\s>]/g)].length
    if (items !== h3) reasons.push(`un timeline tiene ${items} items y ${h3} h3`)
  }
  // Enlaces externos: solo http o https, con target _blank y rel noopener.
  for (const m of html.matchAll(/<a\s[^>]*href="([^"]+)"[^>]*>/g)) {
    const href = m[1]!
    if (/^https?:\/\//.test(href)) {
      if (!/rel="noopener"/.test(m[0])) reasons.push(`enlace externo sin rel="noopener": ${href}`)
      if (!/target="_blank"/.test(m[0])) reasons.push(`enlace externo sin target _blank: ${href}`)
    } else if (/^(javascript|data|vbscript):/i.test(href)) {
      reasons.push(`href con esquema peligroso: ${href}`)
    }
  }
  if (/designs\//.test(html)) reasons.push('el HTML nombra una ruta de designs/')
  if (countOf(html, /<main[\s>]/) !== 0) reasons.push('la vista declara un main (lo pone el layout)')
  if (/\bnull\b|\bundefined\b/.test(text)) reasons.push('aparece null o undefined en el texto')
  if (/{{|}}/.test(html)) reasons.push('quedan llaves dobles sin renderizar')
  return reasons
}

function mainProfile(): void {
  const profile = toAuthorProfileProps(PROFILE_DOC, EVENT_DOCS, 'es', {}, NOW)
  check(profile !== null, 'perfil props: el documento produce props', 'devolvio null')
  if (!profile) return

  check(profile.paragraphs.length === 2, 'perfil props: la bio se parte en parrafos', `${profile.paragraphs.length}`)
  check(profile.credentials.length === 2 && profile.expertise.length === 2, 'perfil props: credenciales y expertise', JSON.stringify([profile.credentials, profile.expertise]))
  check(profile.experience[0]?.current === true && profile.experience[1]?.current === false, 'perfil props: la experiencia sin fecha de fin esta en curso', JSON.stringify(profile.experience.map((e) => e.current)))
  check(profile.education[0]?.current === true && profile.education[1]?.current === false, 'perfil props: la educacion con fin futuro esta en curso', JSON.stringify(profile.education.map((e) => e.current)))
  check(profile.experience[0]?.dates?.to === null && profile.experience[1]?.dates?.to !== null, 'perfil props: fechas con partes (etapa abierta sin fin)', JSON.stringify(profile.experience.map((e) => e.dates)))
  check(profile.events[0]?.by === 'Organizador Uno' && profile.events[0]?.title === 'Taller inventado', 'perfil props: el organizador se separa del titulo', JSON.stringify(profile.events[0]))
  check(profile.events[0]?.coSpeakers.join('|') === 'Persona Uno|Persona Dos', 'perfil props: co-ponentes', JSON.stringify(profile.events[0]?.coSpeakers))
  check(profile.events[1]?.link === null, 'perfil props: un enlace de evento que no es http o https se descarta', `${profile.events[1]?.link}`)
  check(
    profile.social.length === 3 && profile.social[1]?.href === null && profile.social[0]?.href !== null,
    'perfil props: javascript: no llega como href (queda texto)',
    JSON.stringify(profile.social),
  )
  check(safeExternalUrl('mailto:a@b.test', 'es') === null && safeExternalUrl('/ruta', 'es') === null && safeExternalUrl('https://a.example.test', 'es') !== null, 'safeExternalUrl: solo http o https', 'acepto otro esquema')

  for (const locale of ['es', 'en'] as const) {
    const html = renderProfile(profile, locale)
    const reasons = profileFailures(html, profile)
    check(reasons.length === 0, `perfil ${locale}: contrato completo`, reasons.join('; '))
    check(countOf(html, /rel="noopener"/g) === 3, `perfil ${locale}: tres enlaces externos con rel noopener (dos sociales y un evento)`, `hay ${countOf(html, /rel="noopener"/g)}`)
    check(/href="(?:\/en)?\/stack"/.test(html), `perfil ${locale}: conserva el enlace al stack`, 'falta el enlace a /stack')
    check(!/href="(?:\/en)?\/sobre-mi"/.test(html), `perfil ${locale}: sin enlace a Sobre mi para otro autor`, 'aparece el enlace a Sobre mi')
    check(countOf(html, /data-current="true"/g) === 2, `perfil ${locale}: dos etapas en curso con data-current`, `hay ${countOf(html, /data-current="true"/g)}`)
    check(countOf(html.replace(/<!-- -->/g, ''), /\((?:En curso|Ongoing)\)/g) === 2, `perfil ${locale}: la etapa en curso lleva texto ademas de color`, 'falta el texto')
  }
  // El autor del sitio si enlaza a Sobre mi: es la pagina de conversion de Juan, no se unifica.
  const siteProfile = toAuthorProfileProps({ ...PROFILE_DOC, slug: SITE_PERSON_SLUG }, [], 'es', {}, NOW)!
  check(siteProfile.isSitePerson === true && /href="\/sobre-mi"/.test(renderProfile(siteProfile, 'es')), 'perfil del sitio: enlaza a Sobre mi', 'falta el enlace')

  // Todas las secciones vacias: ninguna lista ni encabezado, solo hero.
  const bare = toAuthorProfileProps({ id: 9, slug: 'solo-nombre', name: 'Solo Nombre' }, [], 'es', {}, NOW)!
  const bareHtml = renderProfile(bare, 'es')
  const bareReasons = profileFailures(bareHtml, bare)
  check(bareReasons.length === 0 && headingLevels(bareHtml).join(',') === '1', 'perfil vacio: solo el h1, sin encabezados huerfanos', bareReasons.join('; ') || headingLevels(bareHtml).join(','))
  check(toAuthorProfileProps({ slug: 'x', name: '' }, [], 'es') === null, 'perfil props: sin nombre no hay perfil', 'produjo props')

  // Fixtures defectuosos: deben fallar.
  const good = renderProfile(profile, 'es')
  check(profileFailures(good.replace('</section>', '<h1>otro</h1></section>'), profile).some((r) => r.includes('h1')), 'defectuoso: dos h1 se detecta', 'no detecto dos h1')
  check(
    profileFailures(good.replace(/(<a\s[^>]*href="https:\/\/ana\.example\.test\/"[^>]*?) rel="noopener"/, '$1'), profile).some((r) => r.includes('rel="noopener"')),
    'defectuoso: enlace social sin rel noopener se detecta',
    'no detecto el rel faltante',
  )
  check(
    profileFailures(good.replace('</section>', '<h2>Experiencia</h2></section>'), { ...profile, experience: [] }).some((r) => r.includes('huerfano')),
    'defectuoso: seccion vacia con encabezado se detecta',
    'no detecto el encabezado huerfano',
  )
  check(
    profileFailures(good.replace(/<ul([^>]*MuiTimeline-root[^>]*?) role="list"/, '<ul$1'), profile).some((r) => r.includes('role')),
    'defectuoso: timeline sin role list se detecta',
    'no detecto el timeline sin role',
  )
  check(
    profileFailures(good.replace('</section>', '<a href="javascript:alert(1)">x</a></section>'), profile).some((r) => r.includes('peligroso')),
    'defectuoso: href javascript: se detecta',
    'no detecto el href peligroso',
  )

  // SEO-03: TODOS los posts y casos del autor llegan al HTML del servidor, sin tope de 50.
  const postLinkCount = (html: string): number => countOf(html, /href="(?:\/en)?\/blog\/tema-uno\/post-inventado-\d+"/g)
  const caseLinkCount = (html: string): number => countOf(html, /href="(?:\/en)?\/case-studies\/caso-inventado-\d+"/g)
  const full = toAuthorProfileProps(PROFILE_DOC, EVENT_DOCS, 'es', { posts: fakePosts(58), cases: fakeCases(7) }, NOW)!
  check(full.posts.length === 58 && full.cases.length === 7, 'perfil props: 58 posts y 7 casos sin recorte', `${full.posts.length} y ${full.cases.length}`)
  for (const locale of ['es', 'en'] as const) {
    const html = renderProfile(full, locale)
    check(postLinkCount(html) === 58, `perfil ${locale}: 58 posts producen 58 enlaces a posts en el HTML`, `hay ${postLinkCount(html)}`)
    check(caseLinkCount(html) === 7, `perfil ${locale}: los 7 casos estan enlazados`, `hay ${caseLinkCount(html)}`)
    const reasons = profileFailures(html, full)
    check(reasons.length === 0, `perfil ${locale}: contrato completo con posts y casos`, reasons.join('; '))
    check(!/Ver m[aá]s art[ií]culos|Show more|Load more/i.test(textOf(html)), `perfil ${locale}: sin boton de ver mas ni revelado en el cliente`, 'hay un boton de revelado')
    check(countOf(html, /<button[\s>]/g) === 0, `perfil ${locale}: ningun boton en el perfil`, `hay ${countOf(html, /<button[\s>]/g)}`)
  }
  // Un fixture defectuoso con 50 posts (el tope viejo) debe fallar.
  const capped = toAuthorProfileProps(PROFILE_DOC, EVENT_DOCS, 'es', { posts: fakePosts(50), cases: fakeCases(7) }, NOW)!
  check(postLinkCount(renderProfile(capped, 'es')) !== 58, 'defectuoso: 50 posts no cumplen los 58 enlaces', 'el recuento no distingue 50 de 58')
  // Sin posts ni casos: ni encabezados ni listas de esas secciones.
  const noRelated = toAuthorProfileProps(PROFILE_DOC, EVENT_DOCS, 'es', { posts: [], cases: [] }, NOW)!
  const noRelatedHtml = renderProfile(noRelated, 'es')
  check(!SECTION_TITLES.posts.test(noRelatedHtml) && !SECTION_TITLES.cases.test(textOf(noRelatedHtml)), 'sin posts ni casos: no quedan sus encabezados', 'queda un encabezado huerfano')

  // Una URL pegada en la descripcion (medido en vivo) no debe ensanchar la pagina: la linea tiene que poder partirse.
  const urlDoc = toAuthorProfileProps(
    {
      ...PROFILE_DOC,
      experience: [{ role: 'Cargo', company: 'Empresa', startDate: '2024-01-01T00:00:00.000Z', description: 'Mas info: https://www.ejemplo.example.test/una/ruta/larga/sin/espacios' }],
    },
    [],
    'es',
    {},
    NOW,
  )!
  const urlHtml = renderProfile(urlDoc, 'es')
  check(/overflow-wrap:anywhere/.test(urlHtml) && urlHtml.includes('https://www.ejemplo.example.test/una/ruta/larga/sin/espacios'), 'perfil: el contenido de la etapa puede partir una URL larga (overflow-wrap anywhere)', 'falta overflow-wrap:anywhere en el estilo')
  const noWrap = urlHtml.replace(/overflow-wrap:anywhere/g, 'overflow-wrap:normal')
  check(!/overflow-wrap:anywhere/.test(noWrap), 'defectuoso: sin overflow-wrap anywhere no se cumple la prueba de URL larga', 'el reemplazo no cambia el estilo')

  // Casos del autor: el filtro por autor no pierde ninguno.
  const mixed: AuthorCaseDocLike[] = [...fakeCases(3), { slug: 'ajeno', title: 'Ajeno', author: 2 }, { slug: 'poblado', title: 'Poblado', author: { id: 1 } }, { slug: 'sin-autor', title: 'Sin autor', author: null }]
  check(pickAuthorCases(mixed, 1).length === 4, 'casos del autor: id numerico y autor poblado, sin los ajenos ni los sin autor', `${pickAuthorCases(mixed, 1).length}`)
}

// ---------------------------------------------------------------------------
// JSON-LD Person
// ---------------------------------------------------------------------------

async function mainJsonLd(): Promise<void> {
  check(PERSON_ID.endsWith('/#person') && personRef['@id'] === PERSON_ID, 'JSON-LD: el @id canonico del sitio es estable', `${PERSON_ID}`)

  // El autor del sitio sale de buildSitePerson sin tocar un campo.
  const sentinel = { '@context': 'https://schema.org', '@type': 'Person', '@id': PERSON_ID, name: 'Persona del sitio' }
  const site = await buildAuthorPersonJsonLd({ slug: SITE_PERSON_SLUG, name: 'Otro nombre' }, 'es', async () => sentinel)
  check(site === sentinel && site['@id'] === PERSON_ID, 'JSON-LD: el autor del sitio conserva el nodo con @id de buildSitePerson', JSON.stringify(site))

  // Cualquier otro autor arma su nodo sin @id de sitio, campo por campo como la ruta.
  const other = await buildAuthorPersonJsonLd(
    {
      slug: 'ana-de-prueba',
      name: 'Ana de Prueba',
      jobTitle: 'Ingeniera de datos',
      socialLinks: [{ url: 'https://a.example.test' }],
      expertise: [{ topic: 'Tema A' }],
      education: [
        { degree: 'Terminado', institution: 'Instituto', endDate: '2019-12-01T00:00:00.000Z' },
        { degree: 'En curso', institution: 'Universidad', endDate: '2999-01-01T00:00:00.000Z' },
      ],
    },
    'es',
    async () => sentinel,
  )
  check(!('@id' in other) && other['@type'] === 'Person' && other.url === 'https://juan-tech.com/authors/ana-de-prueba', 'JSON-LD: otro autor sin @id y con su url', JSON.stringify(other))
  const credentials = other.hasCredential as Array<{ name: string }> | undefined
  check(credentials?.length === 1 && credentials[0]?.name === 'Terminado', 'JSON-LD: solo la educacion terminada es hasCredential', JSON.stringify(credentials))
  check(
    JSON.stringify(Object.keys(buildOtherAuthorPersonJsonLd({ slug: 's', name: 'N' }, 'https://x.test'))) === JSON.stringify(['@context', '@type', 'name', 'jobTitle', 'url']),
    'JSON-LD: sin redes, expertise ni educacion el nodo no trae claves vacias',
    'trae claves de mas',
  )
}

mainIndex()
mainProfile()

mainJsonLd().then(() => {
  if (failures > 0) {
    console.log(`FAIL 55-authors-ssr (${failures})`)
    process.exit(1)
  }
  console.log('PASS 55-authors-ssr')
})
