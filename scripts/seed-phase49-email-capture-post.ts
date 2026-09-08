/**
 * Phase 49 Plan 02, Task 2 (MAIL-01) — hace discoverable en un post real el
 * bloque `email-capture` que Task 1 construyó.
 *
 * Busca un post real, publicado, cuyo título/excerpt hable genuinamente de
 * SEO técnico/auditoría (mismo tipo de tema que el lead magnet — un checklist
 * de auditoría SEO técnica), e inserta un nodo de bloque `email-capture` como
 * hijo directo de `content.root.children`, en AMBOS locales del mismo post,
 * reusando el mismo `id` de bloque en ambos writes (mismo patrón que
 * scripts/seed-phase48-inline-demo.ts, INL-01/INL-02).
 *
 * Si ningún post real menciona genuinamente estos temas, elige el primero que
 * la query de publicados devuelva — el bloque es un CTA genérico ("descarga
 * este checklist"), no depende de que el post hable literalmente de auditoría
 * para que la ubicación sea honesta, a diferencia de affiliate-inline.
 *
 * Imprime `slug=<slug-del-post>` en stdout para que
 * scripts/verify-phase49-email-capture.ts lo recoja.
 *
 * Run: node --env-file=.env node_modules/.bin/tsx scripts/seed-phase49-email-capture-post.ts
 */
import { randomUUID } from 'node:crypto'

import { getPayload } from 'payload'

import config from '../src/payload.config'

const LOCALES = ['es', 'en'] as const
type Locale = (typeof LOCALES)[number]

// Frases compuestas, no palabras sueltas: "auditoría"/"rendimiento" solos
// hacían falso-match en posts de algoritmos/bases de datos que hablan de
// rendimiento de queries, no de SEO — el lead magnet es un checklist de
// auditoría SEO técnica, así que el match tiene que nombrar SEO explícito.
const CANDIDATE_TERMS = [
  'seo técnico',
  'seo tecnico',
  'technical seo',
  'auditoría seo',
  'auditoria seo',
  'seo audit',
  'core web vitals',
  'checklist de seo',
  'checklist seo',
  'seo checklist',
]

type BlockNode = { type?: string; fields?: { blockType?: string } }

type PostDoc = {
  id: number | string
  slug?: string | null
  title?: string | null
  excerpt?: string | null
  content?: { root?: { children?: BlockNode[] } }
}

function matchesCandidateTerms(doc: PostDoc): boolean {
  const haystack = `${doc.title ?? ''} ${doc.excerpt ?? ''}`.toLowerCase()
  return CANDIDATE_TERMS.some((term) => haystack.includes(term))
}

/**
 * Los posts migrados de JuanPortfolio pueden traer nodos de bloque
 * `code-block`/`faq` en su Lexical body — legado sobreviviente de la
 * migración (ver docblock de richTextBlockConverters.tsx). Esos dos NO están
 * registrados en ningún `BlocksFeature`, así que Payload los renderiza igual
 * (converters ad-hoc) pero rechaza CUALQUIER `payload.update` sobre ese
 * richText field con "block node failed to validate: Block <tipo> not
 * found" — la validación de Lexical corre sobre TODO el documento, no solo
 * sobre el nodo nuevo que este script agrega. Elegir un candidato que ya
 * traiga uno de esos dos tipos rompería el write antes de llegar siquiera a
 * insertar `email-capture`, así que se descartan explícitamente acá.
 */
function hasUnregisteredLegacyBlock(doc: PostDoc): boolean {
  return (doc.content?.root?.children ?? []).some(
    (n) => n?.type === 'block' && (n.fields?.blockType === 'code-block' || n.fields?.blockType === 'faq'),
  )
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
  })

  const writable = (docs as PostDoc[]).filter((doc) => !hasUnregisteredLegacyBlock(doc))

  if (writable.length === 0) {
    throw new Error(
      'Todos los posts publicados traen un bloque code-block/faq no registrado — ninguno acepta un update de richText sin romper la validación de Lexical.',
    )
  }

  const genuine = writable.filter(matchesCandidateTerms)

  if (genuine.length > 0) {
    // Entre los matches genuinos, preferir el que literalmente se llama
    // "checklist" — es el fit editorial más honesto para un lead magnet que
    // ES un checklist (p. ej. "Checklist de SEO técnico"), sin descartar los
    // demás matches genuinos si ese no existiera.
    const checklistMatch = genuine.find((doc) =>
      `${doc.title ?? ''} ${doc.excerpt ?? ''}`.toLowerCase().includes('checklist'),
    )
    return { doc: checklistMatch ?? genuine[0], genuine: true }
  }

  return { doc: writable[0], genuine: false }
}

/**
 * Inserta el nodo de bloque después del primer párrafo encontrado (nunca en
 * el índice 0, que suele ser el párrafo de apertura del artículo). Si no hay
 * ningún párrafo, inserta en el índice 2 (o al final, si el documento es más
 * corto) — mismo criterio que seed-phase48-inline-demo.ts.
 */
function insertEmailCaptureNode(
  children: Record<string, unknown>[],
  blockId: string,
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
      blockType: 'email-capture',
    },
  }

  const next = [...children]
  next.splice(safeInsertAt, 0, node)
  return next
}

function alreadyHasEmailCaptureBlock(children: unknown): boolean {
  if (!Array.isArray(children)) return false
  return children.some(
    (n) =>
      typeof n === 'object' &&
      n !== null &&
      (n as Record<string, unknown>).type === 'block' &&
      ((n as Record<string, unknown>).fields as Record<string, unknown> | undefined)?.blockType ===
        'email-capture',
  )
}

async function main() {
  const payload = await getPayload({ config })

  const { doc: candidate, genuine } = await findCandidatePost(payload)

  if (!candidate.slug) {
    throw new Error(`El post candidato (id=${candidate.id}) no tiene slug.`)
  }

  console.log(
    `Candidato ${genuine ? 'genuino (menciona SEO técnico/auditoría)' : 'de conveniencia (primer post publicado, sin match temático)'}: slug=${candidate.slug} title="${candidate.title}"`,
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

    if (alreadyHasEmailCaptureBlock(children)) {
      console.log(`[${locale}] ya tiene un bloque email-capture — no se duplica.`)
      continue
    }

    const nextChildren = insertEmailCaptureNode(children, blockId)

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

    console.log(`[${locale}] bloque email-capture insertado (blockId=${blockId}).`)
  }

  console.log(`slug=${candidate.slug}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
