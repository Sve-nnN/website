import type { Field } from 'payload'
import { deepMerge } from '../utilities/deepMerge'

type Slug = (fieldToUse?: string, overrides?: Partial<Field>) => Field

export const slugField: Slug = (fieldToUse = 'title', overrides = {}) =>
  deepMerge<Field, Partial<Field>>(
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      index: true,
      unique: true,
      admin: { position: 'sidebar' },
      hooks: {
        beforeValidate: [
          async ({ value, originalDoc, data }) => {
            if (typeof value === 'string') return value.toLowerCase().replace(/ /g, '-')
            const useData = data || originalDoc
            if (useData && typeof useData?.[fieldToUse] === 'string') {
              return useData?.[fieldToUse]?.toLowerCase().replace(/ /g, '-')
            }
            return value
          },
        ],
      },
    },
    overrides,
  )
