import type { Block } from 'payload'

export const FAQ: Block = {
  slug: 'faq',
  interfaceName: 'FAQBlock',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'FAQ Section Title',
      localized: true,
    },
    {
      name: 'faqs',
      type: 'array',
      label: 'Questions & Answers',
      minRows: 1,
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
          localized: true,
        },
        {
          name: 'answer',
          type: 'richText',
          required: true,
          localized: true,
        },
      ],
    },
  ],
}
