import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { CaseStudies } from './collections/CaseStudies'
import { Testimonials } from './collections/Testimonials'
import { Clientes } from './collections/Clientes'
import { Llms } from './globals/Llms'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: { user: Users.slug },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      // Neon UNPOOLED/direct connection string required here — the pooled
      // (-pooler) string breaks payload migrate:create/migrate prepared
      // statements (RESEARCH.md Pitfall 1).
      connectionString: process.env.DATABASE_URI,
    },
    // Producción: las migraciones son la única fuente de cambios de schema.
    // Nunca auto-push en ningún entorno. Correr `payload migrate:create` tras
    // cambios de schema (RESEARCH.md Pitfall 3).
    push: false,
  }),
  email: resendAdapter({
    defaultFromAddress: process.env.RESEND_FROM_EMAIL || 'no-reply@example.com',
    defaultFromName: 'Juan Carlos Angulo',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  // MUST stay in sync with src/i18n/routing.ts's defaultLocale — two independent
  // defaultLocale settings that can silently drift (RESEARCH.md Pitfall 2).
  localization: {
    locales: [
      { code: 'es', label: 'Español' },
      { code: 'en', label: 'English' },
    ],
    defaultLocale: 'es',
    fallback: true,
  },
  collections: [Users, Media, Pages, Posts, Authors, Categories, CaseStudies, Testimonials, Clientes],
  globals: [Llms],
  plugins: [
    seoPlugin({
      collections: ['pages', 'posts', 'case-studies'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({ doc }: { doc: { title?: string } }) =>
        doc?.title ? `${doc.title} | Juan Carlos Angulo` : 'Juan Carlos Angulo',
      generateDescription: ({ doc }: { doc: { heroSubtitle?: string; excerpt?: string } }) =>
        doc?.heroSubtitle ?? doc?.excerpt ?? '',
    }),
    redirectsPlugin({
      collections: ['pages', 'posts', 'case-studies', 'categories', 'authors'],
    }),
  ],
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
