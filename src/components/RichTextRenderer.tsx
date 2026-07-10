import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'

import { RichText, defaultJSXConverters } from '@payloadcms/richtext-lexical/react'

import { Prose } from '@/components/Prose'

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
 */
export function RichTextRenderer({ data, className }: RichTextRendererProps) {
  if (!data) return null

  return (
    <Prose className={className}>
      <RichText data={data} converters={defaultJSXConverters} />
    </Prose>
  )
}
