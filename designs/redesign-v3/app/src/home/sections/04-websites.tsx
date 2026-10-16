import copyJson from '../copy/websites.json';
import { pick, SafeLink, SectionShell, Text, type Lang } from '../ui';
import '../styles/proof.css';

// Tres websites con el puntaje publicado en la pagina viva. Falta fecha y herramienta: un solo pendiente visible.

export default function Websites({ lang }: { lang: Lang }) {
  const t = pick(copyJson, lang);
  return (
    <SectionShell id="websites" heading={t.heading} className="hm-proof">
      <ul className="hm-grid">
        {t.sites.map((site) => (
          <li key={site.href}>
            <article className="card card--link hm-site">
              <p className="card__meta">{site.sector}</p>
              <h3 className="card__title">
                <SafeLink href={site.href}>{site.name}</SafeLink>
              </h3>
              <p className="hm-site__score">
                <span className="card__meta">{t.scoreLabel}</span> <strong className="hm-site__value">{site.score}</strong>
              </p>
            </article>
          </li>
        ))}
      </ul>
      <p className="hm-proof__note">
        <Text>{t.pending}</Text>
      </p>
      <p>
        <SafeLink className="link-inline hm-link" href={t.allHref}>
          {t.allLabel}
        </SafeLink>
      </p>
    </SectionShell>
  );
}
