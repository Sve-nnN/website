import type { GlobalConfig } from 'payload'

export const Llms: GlobalConfig = {
  slug: 'llms',
  label: 'llms.txt',
  admin: {
    group: 'Site',
    description: 'Files for AI agents (llms.txt standard). Editable here; published at /llms.txt and /llms-full.txt.',
  },
  fields: [
    {
      name: 'llmsTxt',
      type: 'textarea',
      required: true,
      label: 'llms.txt (concise index)',
      admin: { rows: 22 },
    },
    {
      name: 'llmsFull',
      type: 'textarea',
      required: true,
      label: 'llms-full.txt (full content)',
      admin: { rows: 30 },
    },
  ],
}
