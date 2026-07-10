export type SourceCollectionKey =
  | 'media'
  | 'authors'
  | 'categories'
  | 'posts'
  | 'case-studies'
  | 'testimonials'
  | 'clientes'
  | 'works'

export interface RemapTable {
  [collection: string]: { [oldMongoId: string]: string | number }
}

export interface UrlInventoryEntry {
  path: string // e.g. "/blog/mi-post" or "/en/blog/mi-post"
  locale: 'es' | 'en'
  source: 'sitemap' | 'direct-query'
  collection?: SourceCollectionKey
  slug?: string
}
