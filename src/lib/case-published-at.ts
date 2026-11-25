// Fecha de publicación de un caso de éxito (auditoría SEO 2026-11).
//
// El JSON-LD necesita `datePublished` y la colección no lo guardaba. La fecha
// sale siempre de un hecho registrado: la primera versión publicada que Payload
// conserva del documento. Solo un caso que se publica por primera vez recibe la
// fecha del momento.
import type { CollectionBeforeChangeHook } from 'payload'

export const setCaseStudyPublishedAt: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (data._status !== 'published') return data
  if (data.publishedAt || originalDoc?.publishedAt) {
    return { ...data, publishedAt: data.publishedAt || originalDoc?.publishedAt }
  }

  let firstPublished: string | undefined
  if (originalDoc?.id) {
    const { docs } = await req.payload.findVersions({
      collection: 'case-studies',
      where: {
        and: [{ parent: { equals: originalDoc.id } }, { 'version._status': { equals: 'published' } }],
      },
      sort: 'createdAt',
      limit: 1,
      depth: 0,
      req,
    })
    firstPublished = docs[0]?.createdAt
  }

  return { ...data, publishedAt: firstPublished ?? new Date().toISOString() }
}
