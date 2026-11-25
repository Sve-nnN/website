/**
 * Landings de Lima y Madrid y cifra de asistentes (decisiones de Juan, 2026-11-25).
 *
 * 1. "Elimino los PLACEHOLDER": en Madrid se borra el bloque localProofSection, que era relleno
 *    entero (la vista no pintaba nada), y se vacia la estadistica del hero, otro marcador.
 *    En Lima el bloque conserva una tarjeta visible (18 asistentes), y el esquema exige tres
 *    estadisticas y un testimonio completo, asi que no se puede vaciar campo a campo. Solo se
 *    borra con --drop-lima-block, que requiere la confirmacion de Juan.
 * 2. "Son 'mas de 18'": estadisticas y texto de Lima y descripcion del taller en speaking-events.
 *
 * Uso: ver data/51-content-lib.ts. Dry-run por defecto.
 */
import { fail, runPlans, type Doc, type DocPlan } from './data/51-content-lib'

const BLOCK = 'localProofSection'

const dropLocalProof = {
  label: `se borra el bloque ${BLOCK}`,
  apply: (doc: Doc): Doc => ({
    ...doc,
    content: { ...doc.content, layout: (doc.content.layout as Doc[]).filter((b) => b.blockType !== BLOCK) },
  }),
}

// Parrafo de la landing de Lima que cuenta el taller.
const PROSE = 'content.layout.2.columns.0.richText.root.children.2.children.0.text'
const PROSE_ES =
  'En 2025 co-dicté un taller de 4 horas de "SEO + IA" en Lima junto con Arianna Lupi (consultora SEO, instructora SEO y fundadora), organizado con Lm Marketing (agencia SEO), con 18 asistentes entre profesionales, marketers y emprendedores. No es una credencial de LinkedIn sin sustento: es trabajo real hecho aquí, con gente real de la comunidad SEO local.'
const PROSE_EN =
  "In 2025 I co-taught a 4-hour \"SEO + AI\" workshop in Lima together with Arianna Lupi (SEO consultant, SEO instructor, and founder), organized with Lm Marketing (SEO agency), with 18 attendees including professionals, marketers, and entrepreneurs. This isn't an unsupported LinkedIn credential: it's real work done here, with real people from the local SEO community."
const prose = (old: string, from: string, to: string) => ({ path: PROSE, old, new: old.replace(from, to) })

const STAT = 'content.layout.1.stats.0.value'

const lima: DocPlan = {
  key: 'pages-seo-tecnico-lima',
  collection: 'pages',
  id: 11,
  slug: 'seo-tecnico-lima',
  ops: {
    es: [
      {
        path: 'content.layout.0.inlineStat',
        old: '+18 asistentes en el taller SEO + IA 2025 (con Arianna Lupi)',
        new: 'Más de 18 asistentes en el taller SEO + IA 2025 (con Arianna Lupi)',
      },
      prose(PROSE_ES, 'con 18 asistentes', 'con más de 18 asistentes'),
      { path: STAT, old: '18', new: 'Más de 18' },
    ],
    en: [
      {
        path: 'content.layout.0.inlineStat',
        old: '+18 attendees at the 2025 SEO + AI workshop (with Arianna Lupi)',
        new: 'More than 18 attendees at the 2025 SEO + AI workshop (with Arianna Lupi)',
      },
      prose(PROSE_EN, 'with 18 attendees', 'with more than 18 attendees'),
      { path: STAT, old: '18', new: '18+' },
    ],
  },
  shared: process.argv.includes('--drop-lima-block') ? dropLocalProof : undefined,
}

const MADRID_STAT = 'content.layout.0.inlineStat'

const madrid: DocPlan = {
  key: 'pages-seo-tecnico-madrid',
  collection: 'pages',
  id: 12,
  slug: 'seo-tecnico-madrid',
  ops: {
    es: [{ path: MADRID_STAT, old: '[PLACEHOLDER] Estadistica real pendiente — reemplazar antes de publicar', new: null }],
    en: [{ path: MADRID_STAT, old: '[PLACEHOLDER] Real stat pending — replace before publishing', new: null }],
  },
  shared: dropLocalProof,
}

const talk: DocPlan = {
  key: 'speaking-events-taller-lima',
  collection: 'speaking-events',
  id: 2,
  ops: {
    es: [
      {
        path: 'description',
        old: 'Taller de 4 horas co-dictado con Arianna Lupi (Consultora SEO / Instructora SEO / Fundadora), con 18 asistentes entre profesionales, marketers, emprendedores y SEOs. Se enseñó keyword research con IA, creación de outlines y briefs con IA, y auditorías SEO con IA, usando DinoRANK (suite oficial de aprendoclub). Organizado en Lima, Perú, junto con Lm Marketing (Agencia SEO).',
        new: 'Taller de 4 horas co-dictado con Arianna Lupi (Consultora SEO / Instructora SEO / Fundadora), con más de 18 asistentes entre profesionales, marketers, emprendedores y SEOs. Se enseñó keyword research con IA, creación de outlines y briefs con IA, y auditorías SEO con IA, usando DinoRANK (suite oficial de aprendoclub). Organizado en Lima, Perú, junto con Lm Marketing (Agencia SEO).',
      },
    ],
    en: [
      {
        path: 'description',
        old: 'A 4-hour workshop co-taught with Arianna Lupi (SEO Consultant / SEO Instructor / Founder), with 18 attendees including professionals, marketers, entrepreneurs, and SEOs. Covered AI-assisted keyword research, AI-assisted outlines and briefs, and AI-assisted SEO audits, using DinoRANK (aprendoclub’s official suite). Organized in Lima, Peru, together with Lm Marketing (SEO Agency).',
        new: 'A 4-hour workshop co-taught with Arianna Lupi (SEO Consultant / SEO Instructor / Founder), with more than 18 attendees including professionals, marketers, entrepreneurs, and SEOs. Covered AI-assisted keyword research, AI-assisted outlines and briefs, and AI-assisted SEO audits, using DinoRANK (aprendoclub’s official suite). Organized in Lima, Peru, together with Lm Marketing (SEO Agency).',
      },
    ],
  },
}

runPlans('placeholders de las landings y cifra de asistentes', [lima, madrid, talk]).catch(fail)
