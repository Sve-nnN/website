#!/usr/bin/env node
/**
 * Genera el PDF del lead magnet (checklist de auditoría SEO técnica) para un
 * locale, a partir de `src/lib/lead-magnet-content.ts`.
 *
 * Corrido en build/seed time, NUNCA en runtime de request (49-CONTEXT.md) —
 * usa `page.pdf()` de Playwright, ya devDependency del repo (RESEARCH.md
 * "Standard Stack": cero dependencia nueva).
 *
 * Fuente sans del SISTEMA, deliberadamente NO Khand/Array (49-UI-SPEC.md "PDF
 * Layout": las webfonts del sitio no aplican acá — un PDF generado en
 * build/seed time no puede garantizar que el `@font-face` cargue en el
 * proceso headless, y el brief de diseño pide "simple, honesto, sin diseño
 * elaborado").
 *
 * Usage:
 *   node --env-file=.env node_modules/.bin/tsx scripts/generate-lead-magnet-pdf.ts es
 *   node --env-file=.env node_modules/.bin/tsx scripts/generate-lead-magnet-pdf.ts en
 *
 * Escribe a `os.tmpdir()/lead-magnet-seo-audit-checklist-<locale>.pdf` — el
 * mismo path fijo que `scripts/upload-lead-magnet.ts` recalcula de forma
 * independiente, para no tener que pasar el path entre dos procesos sueltos.
 */
import { chromium } from 'playwright'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { LEAD_MAGNET_CONTENT } from '../src/lib/lead-magnet-content'

export function leadMagnetPdfPath(locale: 'es' | 'en'): string {
  return path.join(tmpdir(), `lead-magnet-seo-audit-checklist-${locale}.pdf`)
}

const ACCENT = '#F7581E'
const GRAY_RULE = '#CBD5E1'
const MUTED_GRAY = '#6F6F6F'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildHtml(locale: 'es' | 'en'): string {
  const content = LEAD_MAGNET_CONTENT[locale]

  const categoriesHtml = content.categories
    .map(
      (category) => `
        <section class="category">
          <h2>${escapeHtml(category.title)}</h2>
          <ul>
            ${category.items
              .map(
                (item) =>
                  `<li><span class="glyph">&#9744;</span> <span class="check">${escapeHtml(item.check)}</span> <span class="why">${escapeHtml(item.why)}</span></li>`,
              )
              .join('\n')}
          </ul>
        </section>`,
    )
    .join('\n')

  return `<!DOCTYPE html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<style>
  @page { margin: 2.5cm; }
  * { box-sizing: border-box; }
  body {
    font-family: Helvetica, Arial, sans-serif;
    color: #000;
    font-size: 11pt;
    line-height: 1.5;
    margin: 0;
  }
  header.doc-header {
    margin-bottom: 20pt;
  }
  header.doc-header h1 {
    font-size: 23pt;
    font-weight: 700;
    margin: 0 0 6pt;
  }
  header.doc-header .byline {
    font-size: 11pt;
    color: ${MUTED_GRAY};
    margin: 0 0 12pt;
  }
  header.doc-header .accent-rule {
    border: none;
    border-top: 2pt solid ${ACCENT};
    margin: 0;
  }
  section.category {
    margin-bottom: 16pt;
    break-inside: avoid;
  }
  section.category h2 {
    font-size: 15pt;
    font-weight: 700;
    color: #000;
    margin: 0 0 8pt;
  }
  section.category ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  section.category li {
    margin: 0 0 8pt;
  }
  .glyph {
    font-size: 12pt;
  }
  .check {
    font-weight: 600;
  }
  .why {
    color: #000;
  }
  footer.doc-footer {
    margin-top: 24pt;
  }
  footer.doc-footer .gray-rule {
    border: none;
    border-top: 1pt solid ${GRAY_RULE};
    margin: 0 0 8pt;
  }
  footer.doc-footer p {
    font-size: 9pt;
    color: ${MUTED_GRAY};
    margin: 0;
  }
</style>
</head>
<body>
  <header class="doc-header">
    <h1>${escapeHtml(content.title)}</h1>
    <p class="byline">${escapeHtml(content.byline)}</p>
    <hr class="accent-rule" />
  </header>

  ${categoriesHtml}

  <footer class="doc-footer">
    <hr class="gray-rule" />
    <p>${escapeHtml(content.footer)}</p>
  </footer>
</body>
</html>`
}

async function main() {
  const locale = process.argv[2]

  if (locale !== 'es' && locale !== 'en') {
    console.error('Uso: tsx scripts/generate-lead-magnet-pdf.ts <es|en>')
    process.exit(1)
  }

  const html = buildHtml(locale)
  const outPath = leadMagnetPdfPath(locale)

  const browser = await chromium.launch()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })
    await page.pdf({
      path: outPath,
      format: 'Letter',
      printBackground: false,
      preferCSSPageSize: true,
    })
  } finally {
    await browser.close()
  }

  console.log(`PDF generado (${locale}): ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
