import { getPayload } from 'payload'

import config from '../src/payload.config'

async function run() {
  const payload = await getPayload({ config })

  const navItemsEs = [
    { link: { type: 'custom' as const, url: '/blog', label: 'Blog', newTab: false } },
    { link: { type: 'custom' as const, url: '/case-studies', label: 'Casos de éxito', newTab: false } },
    { link: { type: 'custom' as const, url: '/authors', label: 'Autores', newTab: false } },
    { link: { type: 'custom' as const, url: '/contact', label: 'Contacto', newTab: false } },
  ]
  const navItemsEn = [
    { link: { type: 'custom' as const, url: '/blog', label: 'Blog', newTab: false } },
    { link: { type: 'custom' as const, url: '/case-studies', label: 'Case Studies', newTab: false } },
    { link: { type: 'custom' as const, url: '/authors', label: 'Authors', newTab: false } },
    { link: { type: 'custom' as const, url: '/contact', label: 'Contact', newTab: false } },
  ]

  await payload.updateGlobal({
    slug: 'header',
    locale: 'es',
    data: { navItems: navItemsEs },
  })
  await payload.updateGlobal({
    slug: 'header',
    locale: 'en',
    data: { navItems: navItemsEn },
  })
  console.log('Header nav items seeded (es + en)')

  const footerColumnsEs = [
    {
      title: 'Sitio',
      links: [
        { link: { type: 'custom' as const, url: '/blog', label: 'Blog', newTab: false } },
        { link: { type: 'custom' as const, url: '/case-studies', label: 'Casos de éxito', newTab: false } },
        { link: { type: 'custom' as const, url: '/authors', label: 'Autores', newTab: false } },
      ],
    },
    {
      title: 'Contacto',
      links: [
        { link: { type: 'custom' as const, url: '/contact', label: 'Contáctame', newTab: false } },
        { link: { type: 'custom' as const, url: '/search', label: 'Buscar', newTab: false } },
      ],
    },
  ]
  const footerColumnsEn = [
    {
      title: 'Site',
      links: [
        { link: { type: 'custom' as const, url: '/blog', label: 'Blog', newTab: false } },
        { link: { type: 'custom' as const, url: '/case-studies', label: 'Case Studies', newTab: false } },
        { link: { type: 'custom' as const, url: '/authors', label: 'Authors', newTab: false } },
      ],
    },
    {
      title: 'Contact',
      links: [
        { link: { type: 'custom' as const, url: '/contact', label: 'Contact me', newTab: false } },
        { link: { type: 'custom' as const, url: '/search', label: 'Search', newTab: false } },
      ],
    },
  ]

  const dynamicColumnsEs = [
    { title: 'Últimos artículos', source: 'latestPosts' as const, limit: 5 },
    { title: 'Últimos casos de éxito', source: 'latestCaseStudies' as const, limit: 5 },
  ]
  const dynamicColumnsEn = [
    { title: 'Latest posts', source: 'latestPosts' as const, limit: 5 },
    { title: 'Latest case studies', source: 'latestCaseStudies' as const, limit: 5 },
  ]

  const legalLinksEs = [
    { label: 'Privacidad', href: '/privacy' },
    { label: 'Términos', href: '/terms' },
  ]
  const legalLinksEn = [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ]

  await payload.updateGlobal({
    slug: 'footer',
    locale: 'es',
    data: {
      columns: footerColumnsEs,
      dynamicColumns: dynamicColumnsEs,
      socialLinks: [{ platform: 'linkedin' as const, url: 'https://linkedin.com/in/juancarlosangulo' }],
      legalLinks: legalLinksEs,
      copyrightText: `© ${new Date().getFullYear()} Juan Carlos Angulo. Todos los derechos reservados.`,
    },
  })
  await payload.updateGlobal({
    slug: 'footer',
    locale: 'en',
    data: {
      columns: footerColumnsEn,
      dynamicColumns: dynamicColumnsEn,
      socialLinks: [{ platform: 'linkedin' as const, url: 'https://linkedin.com/in/juancarlosangulo' }],
      legalLinks: legalLinksEn,
      copyrightText: `© ${new Date().getFullYear()} Juan Carlos Angulo. All rights reserved.`,
    },
  })
  console.log('Footer columns, dynamicColumns, socialLinks, legalLinks, copyright seeded (es + en)')

  process.exit(0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
