import type { Page } from '@/payload-types'

import { blockComponents } from '@/blocks/blockRegistry'

type LayoutBlocks = Page['content']['layout']
type LayoutBlock = LayoutBlocks[number]

interface RenderBlocksProps {
  blocks: LayoutBlocks | undefined | null
  // Merged into every block's props — used to forward page-level request
  // context (e.g. blog listing's ?category= searchParam, or a post detail
  // page's current post id/categories for RelatedPosts) without forcing
  // RenderBlocks itself to know about any single block's needs. Prefer
  // `blockProps` (below) for props that only make sense for one specific
  // block type — sharedProps reaches every block on the page.
  sharedProps?: Record<string, unknown>
  // Merged only into the props of the matching `blockType`'s renderer (e.g.
  // `{ contactFormBlock: { onSubmit, contactEmail, locale } }`), so props
  // that only one block type consumes (like the contact form's server
  // action) don't get spread onto unrelated blocks (RenderBlocks WR-03).
  blockProps?: Partial<Record<string, Record<string, unknown>>>
}

export function RenderBlocks({ blocks, sharedProps, blockProps }: RenderBlocksProps) {
  if (!blocks || blocks.length === 0) return null

  return (
    <>
      {blocks.map((block: LayoutBlock, i: number) => {
        const Comp = blockComponents[block.blockType]

        if (!Comp) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(`RenderBlocks: no renderer registered for blockType "${block.blockType}"`)
          }
          return null
        }

        return (
          <Comp
            key={block.id ?? i}
            {...(block as unknown as Record<string, unknown>)}
            {...sharedProps}
            {...blockProps?.[block.blockType]}
          />
        )
      })}
    </>
  )
}
