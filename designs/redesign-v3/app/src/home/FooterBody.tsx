import footerJson from './copy/footer.json';
import type { Lang } from './HomePage';
import { Pending, SafeLink } from './ui';

const copy = footerJson as Record<Lang, (typeof footerJson)['es']>;

/** Pie de la home: columnas del sitio vivo, listas de ultimos articulos y casos, legales y copyright. */
export default function FooterBody({ lang }: { lang: Lang }) {
  const t = copy[lang];
  const { articles, cases } = t.latest;
  return (
    <footer className="site-footer hm-footer">
      <div className="hm-footer__top">
        <div>
          <a className="brand" href={lang === 'en' ? '/en' : '/'}>
            Juan Carlos Angulo
          </a>
          <p className="hm-footer__tagline">{t.tagline}</p>
          <SafeLink href={t.linkedin.href} className="hm-footer__linkedin">
            {t.linkedin.label}
          </SafeLink>
        </div>
      </div>
      <div className="site-footer__cols hm-footer__cols">
        {t.columns.map((column) => (
          <nav key={column.title} aria-label={column.ariaLabel}>
            <p className="site-footer__title pixel-label">{column.title}</p>
            <ul>
              {column.links.map((link) => (
                <li key={link.href}>
                  <SafeLink href={link.href}>{link.label}</SafeLink>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="hm-footer__lists">
        <div>
          <p className="site-footer__title pixel-label" id="hm-footer-articles">
            {articles.title}
          </p>
          <ul aria-labelledby="hm-footer-articles">
            {articles.items.map((item) => (
              <li key={item.href}>
                <SafeLink href={item.href} lang={item.spanishTitle ? 'es' : undefined}>
                  {item.label}
                </SafeLink>
                {item.spanishTitle ? (
                  <>
                    {' '}
                    <Pending>{articles.pendingTitle}</Pending>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="site-footer__title pixel-label" id="hm-footer-cases">
            {cases.title}
          </p>
          <ul aria-labelledby="hm-footer-cases">
            {cases.items.map((item) => (
              <li key={item.href}>
                <SafeLink href={item.href}>{item.label}</SafeLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="site-footer__legal">
        <ul className="hm-footer__legal" aria-label={t.legalLabel}>
          {t.legal.map((item) => (
            <li key={item.href}>
              <SafeLink href={item.href}>{item.label}</SafeLink>
            </li>
          ))}
        </ul>
        <p>{t.copyright}</p>
      </div>
    </footer>
  );
}
