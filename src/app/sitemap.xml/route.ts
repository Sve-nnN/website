import { escapeMarkupText, getSitemapEntries } from '@/lib/sitemap-data'

export const dynamic = 'force-dynamic'

const escapeXml = escapeMarkupText

export async function GET() {
  let entries

  try {
    entries = await getSitemapEntries()
  } catch (error) {
    console.error('[sitemap.xml] Failed to load sitemap entries:', error)

    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
</urlset>`

    return new Response(emptyXml, {
      status: 500,
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  }

  const urls = entries
    .map((entry) => {
      const loc = escapeXml(entry.url)
      const lastmod = escapeXml(new Date(entry.lastModified).toISOString())
      const esAlt = escapeXml(entry.alternates.es)
      const enAlt = escapeXml(entry.alternates.en)

      return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <xhtml:link rel="alternate" hreflang="es" href="${esAlt}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${enAlt}"/>
  </url>`
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`

  return new Response(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
