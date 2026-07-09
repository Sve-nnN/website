import type { Block } from 'payload'

// Bloque de código con selección de lenguaje para syntax highlighting.
// CONFIRMADO por Juan — usado en posts técnicos (ver 01-CONTEXT.md).
export const Code: Block = {
  slug: 'code',
  interfaceName: 'CodeBlockProps',
  fields: [
    {
      name: 'language',
      type: 'select',
      defaultValue: 'typescript',
      options: [
        {
          label: 'Typescript',
          value: 'typescript',
        },
        {
          label: 'Javascript',
          value: 'javascript',
        },
        {
          label: 'CSS',
          value: 'css',
        },
      ],
    },
    {
      name: 'code',
      type: 'code',
      label: false,
      required: true,
    },
  ],
}

export default Code
