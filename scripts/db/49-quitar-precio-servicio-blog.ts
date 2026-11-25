/**
 * Quita el precio de la auditoria de la pagina del servicio (ES y EN) y del global blog-promo
 * (decision de Juan, 2026-11-25: "Quitarlo de todas"). La home ya salio con el script 38.
 *
 * Alcance: pages/seo-technical-audit (parrafo de coste, primer punto de la garantia y la
 * respuesta de la pregunta frecuente) y blog-promo (puntos de las bandas de cierre). Solo
 * cambian textos: no se borra ninguna fila ni bloque y el esquema no se toca.
 *
 * Uso: ver scripts/db/data/51-content-lib.ts. Dry-run por defecto.
 */
import { fail, runPlans, type DocPlan, type Op } from './data/51-content-lib'

const P = 'content.layout.5.columns.0.richText.root.children'
const FAQ = 'content.layout.11.faqs.4.answer.root.children.0.children.0.text'

const page: DocPlan = {
  key: 'pages-seo-technical-audit',
  collection: 'pages',
  id: 7,
  slug: 'seo-technical-audit',
  ops: {
    es: [
      { path: `${P}.1.children.0.text`, old: 'Desde 600 USD', new: 'Monto confirmado por escrito' },
      {
        path: `${P}.1.children.1.text`,
        old: ', acreditables al 100% si después contratas la implementación. El monto final depende del tamaño del sitio y se confirma por escrito después de una llamada sin costo.',
        new: '. Depende del tamaño del sitio y te lo confirmo después de una llamada sin costo. Si más adelante contratas la implementación, acredito el 100% de lo que pagaste por la auditoría.',
      },
      {
        path: `${P}.2.children.0.children.0.text`,
        old: 'Si la auditoría no encuentra al menos 3 hallazgos críticos que se puedan implementar, te devuelvo los 600 USD.',
        new: 'Si la auditoría no encuentra al menos 3 hallazgos críticos que se puedan implementar, te devuelvo lo que pagaste.',
      },
      {
        path: FAQ,
        old: 'Desde 600 USD, acreditables al 100% si después contratas la implementación. Te confirmo el monto final por escrito después de una llamada sin costo. Incluye una garantía: si no encuentro al menos 3 hallazgos críticos que se puedan implementar, te devuelvo el dinero.',
        new: 'Depende del tamaño del sitio. Te confirmo el monto por escrito después de una llamada sin costo y, si más adelante contratas la implementación, acredito el 100%. Incluye una garantía: si no encuentro al menos 3 hallazgos críticos que se puedan implementar, te devuelvo el dinero.',
      },
    ],
    en: [
      { path: `${P}.1.children.0.text`, old: 'From 600 USD', new: 'Fee confirmed in writing' },
      {
        path: `${P}.1.children.1.text`,
        old: ', credited 100% if you later hire the implementation. The final amount depends on the size of the site and is confirmed in writing after a free call.',
        new: '. It depends on the size of the site, and I confirm it after a free call. If you later hire me for the implementation, I credit 100% of what you paid for the audit.',
      },
      {
        path: `${P}.2.children.0.children.0.text`,
        old: 'If the audit does not find at least 3 critical, implementable findings, I refund the 600 USD.',
        new: 'If the audit does not find at least 3 critical, implementable findings, I refund what you paid.',
      },
      {
        path: FAQ,
        old: 'From 600 USD, credited 100% if you later hire the implementation. I confirm the final amount in writing after a free call. It includes a guarantee: if I do not find at least 3 critical, implementable findings, I refund the money.',
        new: 'It depends on the size of the site. I confirm the fee in writing after a free call, and I credit 100% of it if you later hire me for the implementation. It includes a guarantee: if I do not find at least 3 critical, implementable findings, I refund the money.',
      },
    ],
  },
}

const ROW_ES = {
  old: 'Auditoría completa por 600 USD, acreditables si seguimos con la implementación',
  new: 'Auditoría completa, y descuento lo que pagaste si seguimos con la implementación',
}
const ROW_EN = {
  old: 'Full audit for 600 USD, credited back if we go ahead with the implementation',
  new: 'Full audit, with the fee credited back if we go ahead with the implementation',
}
const point = (path: string, t: { old: string; new: string }): Op => ({ path: `${path}.item`, ...t })

const promo: DocPlan = {
  key: 'global-blog-promo',
  global: 'blog-promo',
  ops: {
    es: [
      point('closing.points.0', {
        old: 'Auditoría SEO técnica completa por 600 USD',
        new: 'Auditoría SEO técnica completa con el monto confirmado por escrito',
      }),
      point('closing.points.1', {
        old: 'Si después me contratas la implementación, esos 600 se descuentan',
        new: 'Si después me contratas la implementación, descuento lo que pagaste por la auditoría',
      }),
      point('byCategory.1.closing.points.1', ROW_ES),
      point('byCategory.2.closing.points.2', ROW_ES),
    ],
    en: [
      point('closing.points.0', {
        old: 'Full technical SEO audit for 600 USD',
        new: 'Full technical SEO audit with the fee confirmed in writing',
      }),
      point('closing.points.1', {
        old: 'If you hire me for the implementation, that 600 comes off the work',
        new: 'If you hire me for the implementation, I deduct the audit fee from that work',
      }),
      point('byCategory.0.closing.points.1', ROW_EN),
      point('byCategory.1.closing.points.2', ROW_EN),
    ],
  },
}

runPlans('precio de la auditoria en el servicio y el blog', [page, promo]).catch(fail)
