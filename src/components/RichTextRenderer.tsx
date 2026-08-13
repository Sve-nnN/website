import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { RichText } from '@payloadcms/richtext-lexical/react'

import { Prose } from '@/components/Prose'
import { richTextConverters } from '@/components/richTextBlockConverters'

interface RichTextRendererProps {
  data: SerializedEditorState | null | undefined
  className?: string
}

/**
 * Shared Lexical → JSX serializer for every block's richText field. Wraps
 * Payload's own `RichText` converter (default converters cover paragraphs,
 * headings, lists, links, tables) with the `Prose` typographic frame from
 * 05-01. Never invents copy — purely renders whatever richText JSON is
 * passed in.
 *
 * Uses `richTextConverters` rather than `defaultJSXConverters` directly so the
 * `code-block`/`faq` block nodes embedded in migrated post bodies actually
 * render instead of being dropped silently.
 */
export function RichTextRenderer({ data, className }: RichTextRendererProps) {
  if (!data) return null

  return (
    <Prose className={className}>
      <RichText data={data} converters={richTextConverters} />
    </Prose>
  )
}
