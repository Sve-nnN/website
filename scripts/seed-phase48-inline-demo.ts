/**
 * Phase 48 Plan 03, Task 2 (INL-01/INL-02) — demo real de punta a punta.
 *
 * Busca un post real, publicado, cuyo título/excerpt mencione genuinamente
 * investigación de palabras clave, herramientas SEO, o auditoría de
 * contenido, e inserta un nodo de bloque `affiliate-inline` (DinoRANK, ya
 * sembrado por scripts/seed-phase48-tracer.ts en Plan 48-01) como hijo
 * directo de `content.root.children`, en AMBOS locales del mismo post,
 * reusando el mismo `id` de bloque en ambos writes.
 *
 * Si NINGÚN post real menciona genuinamente estos temas, elige el post más
 * cercano temáticamente que exista y lo documenta como una elección de
 * conveniencia — nunca fuerza el bloque en un post no relacionado, y nunca
 * crea una página descartable solo para la verificación.
 *
 * Imprime `slug=<slug-del-post>` en stdout para que
 * scripts/verify-affiliate-inline-block.ts lo recoja.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase48-inline-demo.ts
 */
import { randomUUID } from 'node:crypto'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

// Términos que indican que el post genuinamente habla de investigación de
// keywords, herramientas SEO, o auditoría de contenido — el mismo tipo de
// contenido donde mencionar DinoRANK es honesto, no forzado.
const CANDIDATE_TERMS = [
  'keyword',
  'palabras clave',
  'herramientas seo',
  'herramienta seo',
  'investigación de palabras',
  'investigacion de palabras',
  'auditoría de contenido',
  'auditoria de contenido',
  'auditoría seo',
  'auditoria seo',
  'seo tools',
  'keyword research',
  'content audit',
]

type PostDoc = {
  id: number | string
  slug?: string | null
  title?: string | null
  excerpt?: string | null
}

function matchesCandidateTerms(doc: PostDoc): boolean {
  const haystack = `${doc.title ?? ''} ${doc.excerpt ?? ''}`.toLowerCase()
  return CANDIDATE_TERMS.some((term) => haystack.includes(term))
}

async function findDinorankId(payload: Awaited<ReturnType<typeof getPayload>>): Promise<number> {
  const { docs } = await payload.find({
    collection: 'affiliate-links',
    where: { slug: { equals: 'dinorank' } },
    limit: 1,
  })

  if (docs.length === 0) {
    throw new Error(
      'No existe affiliate-links doc slug=dinorank — correr primero scripts/seed-phase48-tracer.ts (Plan 48-01).',
    )
  }

  return docs[0].id as number
}

async function findCandidatePost(
  payload: Awaited<ReturnType<typeof getPayload>>,
): Promise<{ doc: PostDoc; genuine: boolean }> {
  const { docs } = await payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    locale: 'es',
    limit: 0,
    pagination: false,
    depth: 0,
    overrideAccess: false,
    select: { title: true, excerpt: true, slug: true },
  })

  const genuine = (docs as PostDoc[]).filter(matchesCandidateTerms)

  if (genuine.length > 0) {
    return { doc: genuine[0], genuine: true }
  }

  // Sin match genuino: elegir el post más cercano temáticamente disponible
  // (cualquier mención de "seo") en vez de forzarlo en contenido no
  // relacionado — documentado explícitamente en el SUMMARY como elección de
  // conveniencia, no ideal.
  const fallback = (docs as PostDoc[]).find((doc) =>
    `${doc.title ?? ''} ${doc.excerpt ?? ''}`.toLowerCase().includes('seo'),
  )

  if (!fallback) {
    throw new Error(
      'No se encontró ningún post publicado, ni siquiera con mención genérica de "seo" — no hay candidato razonable para la demo.',
    )
  }

  return { doc: fallback, genuine: false }
}

/**
 * Inserta el nodo de bloque después del primer párrafo encontrado (nunca en
 * el índice 0). Si no hay ningún párrafo, inserta en el índice 2 (o al
 * final, si el documento es más corto).
 */
function insertAffiliateInlineNode(
  children: Record<string, unknown>[],
  blockId: string,
  affiliateLinkId: number,
): Record<string, unknown>[] {
  const firstParagraphIndex = children.findIndex((n) => n?.type === 'paragraph')
  const insertAt =
    firstParagraphIndex >= 0
      ? Math.min(firstParagraphIndex + 1, children.length)
      : Math.min(2, children.length)
  const safeInsertAt = insertAt <= 0 ? Math.min(1, children.length) : insertAt

  const node = {
    type: 'block',
    version: 2,
    format: '',
    fields: {
      id: blockId,
      blockName: '',
      blockType: 'affiliate-inline',
      affiliateLink: affiliateLinkId,
    },
  }

  const next = [...children]
  next.splice(safeInsertAt, 0, node)
  return next
}

async function alreadyHasInlineBlock(children: unknown): Promise<boolean> {
  if (!Array.isArray(children)) return false
  return children.some(
    (n) =>
      typeof n === 'object' &&
      n !== null &&
      (n as Record<string, unknown>).type === 'block' &&
      ((n as Record<string, unknown>).fields as Record<string, unknown> | undefined)
        ?.blockType === 'affiliate-inline',
  )
}

async function main() {
  const payload = await getPayload({ config })

  const dinorankId = await findDinorankId(payload)
  const { doc: candidate, genuine } = await findCandidatePost(payload)

  if (!candidate.slug) {
    throw new Error(`El post candidato (id=${candidate.id}) no tiene slug.`)
  }

  console.log(
    `Candidato ${genuine ? 'genuino' : 'de conveniencia (fallback, ver nota en SUMMARY)'}: slug=${candidate.slug} title="${candidate.title}"`,
  )

  const blockId = randomUUID()

  for (const locale of LOCALES) {
    const full = await payload.findByID({
      collection: 'posts',
      id: candidate.id,
      locale,
      depth: 0,
    })

    const children = full.content?.root?.children as Record<string, unknown>[] | undefined

    if (!Array.isArray(children)) {
      throw new Error(`[${locale}] content.root.children no es un array en slug=${candidate.slug}`)
    }

    if (await alreadyHasInlineBlock(children)) {
      console.log(`[${locale}] ya tiene un bloque affiliate-inline — no se duplica.`)
      continue
    }

    const nextChildren = insertAffiliateInlineNode(children, blockId, dinorankId)

    await payload.update({
      collection: 'posts',
      id: candidate.id,
      locale,
      data: {
        content: {
          ...full.content,
          root: { ...full.content.root, children: nextChildren },
        } as never,
      },
    })

    console.log(`[${locale}] bloque affiliate-inline insertado (blockId=${blockId}).`)
  }

  console.log(`slug=${candidate.slug}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
