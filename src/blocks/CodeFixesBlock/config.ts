import type { Block } from 'payload'

/**
 * "This site is the case study" — the home page's focal block.
 *
 * WHY IT EXISTS — of fifteen competitor home pages analysed across ES and EN
 * (consultores SEO técnicos, freelance and boutique), not one shows a single
 * line of code. Every one of them shows the finished percentage and stays
 * quiet about the cause. The two competitors who genuinely program
 * (ohgm.co.uk, tomanthony.co.uk) solve that by showing no proof at all, and
 * the one with the strongest proof in the category (patrickstox.com) still
 * shows no code. The crossing of hard proof and real code is empty.
 *
 * This block fills it with the only material that is both auditable and
 * ours to publish: the fixes in THIS repository, which is public. Client
 * work supplies the Search Console numbers with the client anonymised; the
 * repo supplies the cause, with a commit link anybody can open.
 *
 * That division is the point and must not blur. Recreating a client's fix
 * from memory to illustrate a real GSC number would be fabricated evidence:
 * the number true, the cause invented, and the whole thing collapsing the
 * first time a technical prospect asks a follow-up question on a call. See
 * PRODUCT.md, "Cero fabricación". Every `code` value in this block has to be
 * the code that is actually in the commit `commitUrl` points at.
 */
export const CodeFixesBlock: Block = {
  slug: 'codeFixesBlock',
  interfaceName: 'CodeFixesBlock',
  labels: { singular: 'Code Fixes', plural: 'Code Fixes Blocks' },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      admin: { description: 'Ej: "Este sitio es el caso de estudio".' },
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      admin: {
        description:
          'Una o dos frases. Por qué se muestran los fixes de este repo y no los de un cliente.',
      },
    },
    {
      name: 'repoUrl',
      type: 'text',
      admin: {
        description:
          'URL del repositorio público. Es lo que vuelve verificable todo el bloque: sin esto, el código es una captura que hay que creer.',
      },
    },
    {
      name: 'repoLabel',
      type: 'text',
      localized: true,
      admin: { description: 'Texto del enlace al repo. Ej: "Ver el repositorio".' },
    },
    {
      name: 'fixes',
      type: 'array',
      minRows: 1,
      maxRows: 4,
      labels: { singular: 'Fix', plural: 'Fixes' },
      admin: {
        initCollapsed: true,
        description:
          'Dos o tres. Cada uno tiene que ser un commit real de este repo — el código pegado acá debe ser el que está en ese commit.',
      },
      fields: [
        {
          name: 'symptom',
          type: 'text',
          localized: true,
          required: true,
          admin: {
            description:
              'Qué estaba roto, en lenguaje de síntoma, no de solución. Ej: "Google recibía dos hreflang que se contradecían".',
          },
        },
        {
          name: 'cause',
          type: 'textarea',
          localized: true,
          admin: {
            description:
              'La causa técnica real, en una o dos frases. Es la parte que ningún competidor cuenta y la razón de ser del bloque.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'filePath',
              type: 'text',
              required: true,
              admin: {
                width: '60%',
                description: 'Ruta del archivo, tal cual está en el repo.',
              },
            },
            {
              name: 'language',
              type: 'select',
              defaultValue: 'ts',
              admin: { width: '40%' },
              options: [
                { label: 'TypeScript', value: 'ts' },
                { label: 'TSX', value: 'tsx' },
                { label: 'JavaScript', value: 'js' },
                { label: 'JSON', value: 'json' },
                { label: 'SQL', value: 'sql' },
                { label: 'HTML', value: 'html' },
                { label: 'Shell', value: 'bash' },
              ],
            },
          ],
        },
        {
          name: 'code',
          type: 'code',
          required: true,
          admin: {
            language: 'typescript',
            description:
              'El fragmento del cambio. Cortá al mínimo legible: entre 5 y 25 líneas. Nadie lee un diff de 200 en una portada.',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'commitUrl',
              type: 'text',
              admin: { width: '70%', description: 'URL del commit en GitHub.' },
            },
            {
              name: 'commitSha',
              type: 'text',
              admin: { width: '30%', description: 'SHA corto, 7 caracteres.' },
            },
          ],
        },
        {
          name: 'outcome',
          type: 'text',
          localized: true,
          admin: {
            description:
              'Qué cambió después, si es medible. Dejalo vacío antes que estimar: un dato que falta se queda faltando.',
          },
        },
      ],
    },
  ],
}
