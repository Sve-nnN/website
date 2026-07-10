/**
 * Rewrites Media references embedded inside a Lexical richText tree (inline
 * `upload` nodes, and `mediaBlock`/`banner` block nodes) from old Mongo
 * ObjectIds to new Postgres IDs, using the media remap table.
 *
 * Never mutates the input — returns a deep-cloned, rewritten tree.
 */
function resolveMediaId(
  oldId: unknown,
  mediaRemap: Record<string, string | number>,
): string | number | undefined {
  if (oldId === null || oldId === undefined) return undefined
  const key =
    typeof oldId === 'object' && oldId !== null && 'id' in (oldId as Record<string, unknown>)
      ? String((oldId as Record<string, unknown>).id)
      : String(oldId)
  return mediaRemap[key]
}

function walk(node: unknown, mediaRemap: Record<string, string | number>): void {
  if (!node || typeof node !== 'object') return
  const n = node as Record<string, unknown>

  if (n.type === 'upload') {
    const resolved = resolveMediaId(n.value, mediaRemap)
    if (resolved !== undefined) {
      n.value = resolved
    }
  }

  if (n.type === 'block') {
    const fields = n.fields as Record<string, unknown> | undefined
    const blockType = fields?.blockType
    if ((blockType === 'mediaBlock' || blockType === 'banner') && fields) {
      const resolved = resolveMediaId(fields.media, mediaRemap)
      if (resolved !== undefined) {
        fields.media = resolved
      }
    }
  }

  if (Array.isArray(n.children)) {
    for (const child of n.children as unknown[]) {
      walk(child, mediaRemap)
    }
  }
}

export function remapRichTextMediaRefs(
  richText: unknown,
  mediaRemap: Record<string, string | number>,
): unknown {
  if (!richText) return richText
  const cloned = JSON.parse(JSON.stringify(richText))
  const root = (cloned as Record<string, unknown>)?.root
  if (root) {
    walk(root, mediaRemap)
  }
  return cloned
}
