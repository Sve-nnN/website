import path from 'path'
import { fileURLToPath } from 'url'

import { postgresAdapter } from '@payloadcms/db-postgres'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { cloudStoragePlugin } from '@payloadcms/plugin-cloud-storage'
import { mcpPlugin } from '@payloadcms/plugin-mcp'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { cloudinaryAdapter } from './lib/cloudinary-adapter'
import { revalidateRedirectsCache, revalidateRedirectsCacheOnDelete } from './lib/cache-tags'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { CaseStudies } from './collections/CaseStudies'
import { Testimonials } from './collections/Testimonials'
import { Clientes } from './collections/Clientes'
import { SpeakingEvents } from './collections/SpeakingEvents'
import { Websites } from './collections/Websites'
import { Llms } from './globals/Llms'
import { Header } from './globals/Header'
import { Footer } from './globals/Footer'
import { FeaturedContent } from './globals/FeaturedContent'
import { beforeSyncWithSearch } from './search/beforeSync'
import { searchFields } from './search/fieldOverrides'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// MUST stay identical to the hasCloudinaryCreds boolean in
// src/collections/Media/index.ts — both independently compute this from the
// same three env vars (RESEARCH.md Pitfall 2 / key_links).
const hasCloudinaryCreds = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
)

export default buildConfig({
  admin: { user: Users.slug },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  db: postgresAdapter({
    pool: {
      // Direct (unpooled) connection string required here — the pooled
      // variant breaks payload migrate:create/migrate prepared statements
      // (RESEARCH.md Pitfall 1). Production points this at the `juantech` DB
      // on the shared-postgres container the VPS runs for every tenant app
      // (see infra/db/ in the hosting repo), not at a dedicated instance —
      // being a conservative neighbour on `max` matters here, not just for
      // this app's own sake.
      connectionString: process.env.DATABASE_URI,
      // node-postgres defaults to max:10 with no connectionTimeoutMillis, so
      // a starved pool hangs a request rather than failing it fast. Set
      // explicitly rather than trusting the default: `getSitemapEntries`
      // alone used to open up to 6 connections at once (5 collection queries
      // in a `Promise.all` plus one more for categories — now serialized, see
      // src/lib/sitemap-data.ts), and that was enough on its own to starve
      // this pool while it fanned out. `/sitemap.xml` and `/sitemap.html`
      // both served a 500 with an empty urlset on 2026-08-15 — the route's
      // own fallback for exactly this failure, working as designed, just
      // triggered by a self-inflicted cause.
      max: 5,
      connectionTimeoutMillis: 5000,
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
  collections: [
    Users,
    Media,
    Pages,
    Posts,
    Authors,
    Categories,
    CaseStudies,
    Testimonials,
    Clientes,
    SpeakingEvents,
    Websites,
  ],
  globals: [Llms, Header, Footer, FeaturedContent],
  plugins: [
    seoPlugin({
      collections: ['pages', 'posts', 'case-studies', 'authors', 'websites'],
      uploadsCollection: 'media',
      tabbedUI: true,
      generateTitle: ({
        doc,
      }: {
        doc: { title?: string; name?: string; heroSubtitle?: string; excerpt?: string; jobTitle?: string }
      }) =>
        doc?.name
          ? `${doc.name} | Juan Carlos Angulo`
          : doc?.title
            ? `${doc.title} | Juan Carlos Angulo`
            : 'Juan Carlos Angulo',
      generateDescription: ({
        doc,
      }: {
        doc: { title?: string; name?: string; heroSubtitle?: string; excerpt?: string; jobTitle?: string }
      }) => (doc?.name ? (doc?.jobTitle ?? '') : (doc?.heroSubtitle ?? doc?.excerpt ?? '')),
    }),
    redirectsPlugin({
      collections: ['pages', 'posts', 'case-studies', 'categories', 'authors'],
      // Phase 43 (43-01 Task 2): invalidates the `redirects` unstable_cache
      // tag (src/lib/cache.ts getCachedRedirectTarget) on every admin
      // create/update/delete of a redirect doc.
      overrides: {
        hooks: {
          afterChange: [revalidateRedirectsCache],
          afterDelete: [revalidateRedirectsCacheOnDelete],
        },
      },
    }),
    searchPlugin({
      collections: ['posts', 'case-studies', 'authors'],
      beforeSync: beforeSyncWithSearch,
      searchOverrides: {
        fields: ({ defaultFields }) => [...defaultFields, ...searchFields],
      },
    }),
    ...(hasCloudinaryCreds
      ? [
          cloudStoragePlugin({
            collections: {
              media: {
                adapter: cloudinaryAdapter,
                disableLocalStorage: true,
                generateFileURL: ({ filename }: { filename: string }) =>
                  cloudinaryAdapter().generateFileURL({ filename }),
              },
            },
          }),
        ]
      : []),
    // Conservative ceiling: delete is disabled everywhere (schema/data-loss
    // risk sits with `payload migrate`, not this plugin, but a wrong bulk
    // delete via MCP is unrecoverable the same way). Users/Media are
    // find-only — auth and file uploads aren't a fit for MCP write access.
    // Individual API keys (admin-managed) can further restrict below this
    // ceiling but never exceed it.
    mcpPlugin({
      collections: {
        pages: { enabled: { find: true, create: true, update: true, delete: false } },
        posts: { enabled: { find: true, create: true, update: true, delete: false } },
        'case-studies': { enabled: { find: true, create: true, update: true, delete: false } },
        authors: { enabled: { find: true, create: true, update: true, delete: false } },
        testimonials: { enabled: { find: true, create: true, update: true, delete: false } },
        clientes: { enabled: { find: true, create: true, update: true, delete: false } },
        'speaking-events': { enabled: { find: true, create: true, update: true, delete: false } },
        categories: { enabled: { find: true, create: true, update: true, delete: false } },
        users: { enabled: { find: true } },
        media: { enabled: { find: true } },
      },
      globals: {
        llms: { enabled: { find: true, update: true } },
        header: { enabled: { find: true, update: true } },
        footer: { enabled: { find: true, update: true } },
        'featured-content': { enabled: { find: true, update: true } },
      },
    }),
  ],
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
