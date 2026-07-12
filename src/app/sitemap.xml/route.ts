import { getSitemapEntries } from '@/lib/sitemap-data'

export const dynamic = 'force-dynamic'

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const entries = await getSitemapEntries()

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
