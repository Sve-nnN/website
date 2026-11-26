// Vista del footer (D-11). Recibe solo datos ya resueltos y saneados por el
// server component `SiteFooter`. Cada bloque se dibuja solo si tiene datos
// (empty, zero-one-many); la marca, el tagline y la barra inferior siempre estan.
//
// Fase 60: Server Component sin componentes de MUI. Esta en todas las paginas y
// no tiene nada interactivo, asi que no se hidrata. Estilos en
// `src/theme/static.css`.
import Image from 'next/image'
import { useTranslations } from 'next-intl'

import { SocialIcon, socialLabels } from '@/components/SocialIcon'
import { AppLink } from '@/components/static/AppLink'

export type FooterViewItem = { id: string; label: string; href: string }
export type FooterViewColumn = { id: string; title: string | null; items: FooterViewItem[] }
export type FooterViewSocial = { id: string; platform: string; url: string }
export type FooterViewLegal = { id: string; label: string; href: string }
export type FooterViewLogo = { url: string; alt: string | null } | null

type Props = {
  columns: FooterViewColumn[]
  socialLinks: FooterViewSocial[]
  legalLinks: FooterViewLegal[]
  copyrightText: string
  logo: FooterViewLogo
}

const EXTERNAL = /^https?:\/\//i

/** Los absolutos http abren en otra pestana con `rel` seguro (T-53-32). */
function linkAttrs(href: string) {
  const external = EXTERNAL.test(href)
  return {
    external,
    extra: external ? ({ target: '_blank', rel: 'noopener noreferrer' } as const) : {},
  }
}

export function FooterView({ columns, socialLinks, legalLinks, copyrightText, logo }: Props) {
  const t = useTranslations('shell')
  // Solo para lectores de pantalla (el sufijo de "otra pestana").
  const newTab = <span className="jt-sr-only">{` ${t('opensInNewTab')}`}</span>

  return (
    <footer className="jt-footer" aria-label={t('landmarks.footer')}>
      <div className="jt-container">
        <div className={columns.length > 0 ? 'jt-footer__grid jt-footer__grid--columns' : 'jt-footer__grid'}>
          <div>
            <AppLink className="jt-link jt-footer__brand" href="/" aria-label={t('brandAria')}>
              {logo && (
                <Image
                  src={logo.url}
                  alt=""
                  width={32}
                  height={32}
                  style={{ borderRadius: '50%', objectFit: 'cover' }}
                />
              )}
              <span>Juan Carlos Angulo</span>
            </AppLink>
            <p className="jt-body2 jt-footer__tagline">{t('tagline')}</p>
          </div>

          {columns.length > 0 && (
            <div className="jt-footer__columns">
              {columns.map((column) => (
                <nav
                  key={column.id}
                  aria-label={column.title ? t('groupLabel', { title: column.title }) : t('landmarks.navFooter')}
                >
                  {column.title && <h2 className="jt-overline jt-footer__title">{column.title}</h2>}
                  <ul className="jt-footer__list">
                    {column.items.map((item) => {
                      const attrs = linkAttrs(item.href)
                      return (
                        <li key={item.id}>
                          <AppLink className="jt-link jt-link--hover jt-footer__item" href={item.href} {...attrs.extra}>
                            {item.label}
                            {attrs.external && newTab}
                          </AppLink>
                        </li>
                      )
                    })}
                  </ul>
                </nav>
              ))}
            </div>
          )}
        </div>

        <div className="jt-footer__bar">
          <span className="jt-caption">{copyrightText}</span>

          {legalLinks.length > 0 && (
            <nav aria-label={t('legalLabel')}>
              <ul className="jt-footer__legal">
                {legalLinks.map((legal) => {
                  const attrs = linkAttrs(legal.href)
                  return (
                    <li key={legal.id}>
                      <AppLink className="jt-link jt-link--hover jt-footer__legal-link" href={legal.href} {...attrs.extra}>
                        {legal.label}
                        {attrs.external && newTab}
                      </AppLink>
                    </li>
                  )
                })}
              </ul>
            </nav>
          )}

          {socialLinks.length > 0 && (
            <div className="jt-footer__social" role="group" aria-label={t('socialLabel')}>
              {socialLinks.map((social) => (
                <a
                  key={social.id}
                  className="jt-link jt-footer__social-link"
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${socialLabels[social.platform] ?? social.platform} ${t('opensInNewTab')}`}
                >
                  <SocialIcon platform={social.platform} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
