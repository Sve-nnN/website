import type { CodeBlockProps } from '@/payload-types'

import { Container } from '@/components/Container'

/**
 * Syntax highlighting is out of scope for this plan — plain monospace
 * rendering with the language label is acceptable per 05-04's task spec.
 */
export function CodeComponent(props: CodeBlockProps) {
  const { language, code } = props

  return (
    <Container className="py-6">
      <div className="rounded-md bg-secondary text-secondary-foreground overflow-x-auto">
        <div className="px-4 py-2 text-label border-b border-white/10">{language}</div>
        <pre className="p-4 text-sm">
          <code>{code}</code>
        </pre>
      </div>
    </Container>
  )
}
