import {
  escapeMarkupText,
  getSitemapEntries,
  SITEMAP_GROUP_LABELS,
  type SitemapEntry,
} from '@/lib/sitemap-data'

export const dynamic = 'force-dynamic'

const escapeHtml = escapeMarkupText

const OTHER_LOCALE: Record<SitemapEntry['locale'], SitemapEntry['locale']> = {
  es: 'en',
  en: 'es',
}

const LOCALE_LABEL: Record<SitemapEntry['locale'], string> = {
  es: 'ES',
  en: 'EN',
}

function renderItem(entry: SitemapEntry): string {
  const url = escapeHtml(entry.url)
  const otherLocale = OTHER_LOCALE[entry.locale]
  const otherUrl = entry.alternates[otherLocale]

  // getSitemapEntries() always produces distinct es/en alternates for every
  // entry today (there is no locale-neutral entry shape), so the switcher
  // link is always rendered — no dead "no alternates" branch to carry (WR-05).
  const langTag = ` <span class="lang-tag"><a hreflang="${otherLocale}" href="${escapeHtml(otherUrl)}">${LOCALE_LABEL[otherLocale]}</a></span>`

  return `      <li><a hreflang="${entry.locale}" href="${url}">${url}</a>${langTag}</li>`
}

export async function GET() {
  let entries

  try {
    entries = await getSitemapEntries()
  } catch (error) {
    console.error('[sitemap.html] Failed to load sitemap entries:', error)

    return new Response('Sitemap temporarily unavailable. Please try again later.', {
      status: 500,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'cache-control': 'no-store',
      },
    })
  }

  const groups = Object.keys(SITEMAP_GROUP_LABELS) as Array<keyof typeof SITEMAP_GROUP_LABELS>

  const sections = groups
    .map((group) => {
      const groupEntries = entries.filter((entry) => entry.group === group)
      if (groupEntries.length === 0) return null

      const items = groupEntries.map(renderItem).join('\n')

      return `    <section>
      <h2>${escapeHtml(SITEMAP_GROUP_LABELS[group])}</h2>
      <ul>
${items}
      </ul>
    </section>`
    })
    .filter(Boolean)
    .join('\n')

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>
    <title>Sitemap</title>
    <style>
      :root {
        --background: #FAFAF7;
        --foreground: #12141C;
        --primary: #F7581E;
        --border: #E5E5DE;
        --muted-foreground: #71717A;
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --background: #12141C;
          --foreground: #FAFAF7;
          --primary: #FF7A45;
          --border: rgba(250, 250, 247, 0.35);
          --muted-foreground: #A8ACBB;
        }
      }
      * {
        box-sizing: border-box;
      }
      body {
        background: var(--background);
        color: var(--foreground);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        max-width: 720px;
        margin: 48px auto;
        padding: 0 24px;
      }
      h1 {
        font-size: 28px;
        font-weight: 600;
        line-height: 1.2;
        margin: 0 0 32px 0;
      }
      h2 {
        font-size: 20px;
        font-weight: 600;
        line-height: 1.2;
        border-bottom: 1px solid var(--border);
        padding-bottom: 8px;
        margin: 0 0 16px 0;
      }
      section {
        margin-bottom: 32px;
      }
      ul {
        list-style: none;
        margin: 0;
        padding: 0;
      }
      li {
        font-size: 16px;
        font-weight: 400;
        line-height: 1.5;
        margin-bottom: 16px;
      }
      a {
        color: inherit;
        text-decoration: underline;
      }
      a:hover,
      a:focus {
        color: var(--primary);
      }
      .lang-tag {
        font-size: 13px;
        font-weight: 400;
        line-height: 1.4;
        color: var(--muted-foreground);
        margin-left: 8px;
      }
    </style>
  </head>
  <body>
    <h1>Sitemap</h1>
${sections}
  </body>
</html>`

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
