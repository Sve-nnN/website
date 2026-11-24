'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import Container from '@mui/material/Container'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Mail } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { ContactForm } from '@/components/mui/ContactForm'
import { FaqAccordion } from '@/components/mui/FaqAccordion'
import { IconTile } from '@/components/mui/IconTile'
import { linkFor } from '@/components/mui/links'
import { OL, UL } from '@/components/mui/lists'
import { PageHero } from '@/components/mui/PageHero'
import { Section } from '@/components/mui/Section'
import { TranslationNotice } from '@/components/mui/TranslationNotice'
import type { ContactData } from '@/lib/contact-data'
import { buildServicesIndexHref } from '@/lib/service-slugs'

import { CopyEmailButton } from './contact/CopyEmailButton'

type Props = {
  data: ContactData
  locale: 'es' | 'en'
  /** Estado que la ruta saca de `searchParams.sent`. */
  status: 'success' | 'error' | null
  /** Correo del mensaje de fallo del formulario (contactInfo o, sin el, la variable de entorno). */
  formEmail: string
}

/**
 * Vista de Contacto (PAG-07). Sin landmark main propio: el documento posee el
 * unico. El estado del envio llega por props desde la ruta, que conserva
 * `force-dynamic`, `generateMetadata` y el JSON-LD de ContactPage.
 *
 * Cada seccion sin datos no se dibuja ni deja un encabezado huerfano. En EN,
 * cuando `home-page` no trae el texto traducido (`isFallback`), los textos que
 * salen de ese global van en `lang="es"` y se muestra TranslationNotice. El h1,
 * el lead y el correo salen del doc `contact`, no del global.
 */
export function ContactView({ data, locale, status, formEmail }: Props) {
  const t = useTranslations('contact')
  const tCommon = useTranslations('common')

  const showNotice = locale === 'en' && data.isFallback
  const copyLang = showNotice ? 'es' : undefined
  const { email, steps, infoRows, faq } = data
  const servicesHref = buildServicesIndexHref(locale)

  return (
    <>
      {showNotice && <TranslationNotice esHref="/contact" />}

      <PageHero
        crumbs={[{ label: tCommon('breadcrumbHome'), href: '/' }, { label: data.crumbLabel }]}
        eyebrow={t('eyebrow')}
        title={data.title}
        lead={data.lead ?? undefined}
      />

      <Box component="section" aria-label={t('sectionLabel')} sx={{ pb: { xs: 8, md: 12 } }}>
        <Container
          maxWidth="lg"
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0,1fr)', md: 'minmax(0,0.8fr) minmax(0,1.2fr)' },
            gap: { xs: 5, md: 8 },
            alignItems: 'start',
          }}
        >
          <Box sx={{ order: { xs: 2, md: 1 }, display: 'grid', gap: 3, minWidth: 0 }}>
            {email && (
              <Card sx={{ p: 3, display: 'grid', gap: 1.5, bgcolor: 'raised' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'accentText' }}>
                  <Mail size={20} aria-hidden="true" />
                  <Typography variant="overline">{t('emailLabel')}</Typography>
                </Box>
                <Typography
                  variant="mono"
                  component="p"
                  sx={{ fontSize: '1rem', lineHeight: '1.5rem', userSelect: 'all', overflowWrap: 'anywhere' }}
                >
                  {email}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  <Button href={`mailto:${email}`} variant="contained" size="small">
                    {t('writeEmail')}
                  </Button>
                  <CopyEmailButton email={email} />
                </Box>
              </Card>
            )}

            {infoRows.length > 0 && (
              <UL lang={copyLang} sx={{ display: 'grid', gap: 3 }}>
                {infoRows.map((row) => (
                  <Box
                    key={`${row.title}-${row.text}`}
                    component="li"
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: row.icon ? 'auto minmax(0,1fr)' : 'minmax(0,1fr)',
                      gap: 2,
                      alignItems: 'start',
                    }}
                  >
                    {row.icon && <IconTile name={row.icon} />}
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body1" component="h2" sx={{ fontWeight: 600 }}>
                        {row.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.text}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </UL>
            )}
          </Box>

          <Box sx={{ order: { xs: 1, md: 2 }, minWidth: 0 }}>
            <ContactForm variant="card" status={status} email={formEmail} />
          </Box>
        </Container>
      </Box>

      {steps && (
        <Box lang={copyLang}>
          <Section id="contact-steps" band title={steps.title}>
            <OL
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'minmax(0,1fr)',
                  md: `repeat(${Math.min(steps.items.length, 3)}, minmax(0,1fr))`,
                },
                gap: 2,
              }}
            >
              {steps.items.map((step, i) => (
                <Box
                  key={`${i}-${step.title}`}
                  component="li"
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: 'band.surface',
                    border: 1,
                    borderColor: 'band.border',
                    display: 'grid',
                    gap: 1,
                    alignContent: 'start',
                    minWidth: 0,
                  }}
                >
                  <Typography
                    variant="mono"
                    component="span"
                    aria-hidden="true"
                    sx={{ fontSize: '2.25rem', lineHeight: 1, fontWeight: 600, color: 'primary.main' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </Typography>
                  <Typography variant="h6" component="h3">
                    {step.title}
                  </Typography>
                  {step.body && (
                    <Typography variant="body2" sx={{ color: 'band.muted' }}>
                      {step.body}
                    </Typography>
                  )}
                </Box>
              ))}
            </OL>
          </Section>
        </Box>
      )}

      {faq && (
        <Box lang={copyLang}>
          <Section id="contact-faq" py title={faq.title}>
            <FaqAccordion
              idPrefix="fc"
              items={faq.items.map((item) => ({
                question: item.question,
                answer: (
                  <Typography variant="body1" sx={{ fontSize: '1rem', lineHeight: '1.5rem' }}>
                    {item.answer}
                  </Typography>
                ),
              }))}
            />
            <Typography variant="body2" color="text.secondary" lang={locale} sx={{ mt: 4 }}>
              {t('servicesPrompt')}{' '}
              <Link
                component={linkFor(servicesHref)}
                href={servicesHref}
                underline="always"
                sx={{ fontWeight: 600 }}
              >
                {t('servicesLink')}
              </Link>
            </Typography>
          </Section>
        </Box>
      )}
    </>
  )
}
