import footerJson from './copy/footer.json';
import type { Lang } from './HomePage';
import { liveUrl } from './links';

const copy = footerJson as Record<Lang, (typeof footerJson)['es']>;

/** Pie de la home. 52-05 agrega encima las columnas y las listas dinamicas. */
export function Footer({ lang }: { lang: Lang }) {
  const t = copy[lang];
  return (
    <footer className="site-footer hm-footer">
      <div className="hm-footer__top">
        <div>
          <a className="brand" href={lang === 'en' ? '/en' : '/'}>
            Juan Carlos Angulo
          </a>
          <p className="hm-footer__tagline">{t.tagline}</p>
        </div>
        <ul className="hm-footer__legal" aria-label={t.legalLabel}>
          {t.legal.map((item) => (
            <li key={item.path}>
              <a href={liveUrl(lang, item.path)}>{item.label}</a>
            </li>
          ))}
        </ul>
      </div>
      <div className="site-footer__legal">
        <p>{t.copyright}</p>
      </div>
    </footer>
  );
}
