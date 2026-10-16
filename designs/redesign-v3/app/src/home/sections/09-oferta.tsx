import { SafeLink, SectionShell, Text, pick, type Lang } from '../ui';
import copyJson from '../copy/oferta.json';
import '../styles/method.css';

// Oferta de auditoria (D-03, D-05): precio fijado en la memoria del brief. Texto dentro de .fx-content (D-10).
export default function Oferta({ lang }: { lang: Lang }) {
  const t = pick(copyJson, lang);
  return (
    <SectionShell id="oferta" heading={t.heading} className="hm-block">
      <article className="card card--gradient fx-grain hm-offer">
        <div className="fx-content">
          <p>
            <Text>{t.description}</Text>
          </p>
          <p className="hm-price">
            <span className="hm-price__value">{t.price}</span> <span className="hm-price__caption">{t.priceCaption}</span>
          </p>
          <p className="card__meta">
            <Text>{t.deliveryNote}</Text>
          </p>
          <h3 className="hm-offer__list-title">{t.includesLabel}</h3>
          <ul className="hm-offer__list">
            {t.includes.map((item) => (
              <li key={item}>
                <Text>{item}</Text>
              </li>
            ))}
          </ul>
          <p>
            <Text>{t.creditNote}</Text>
          </p>
          <p>
            <SafeLink className="btn btn--primary" href={t.cta.href}>
              {t.cta.label}
            </SafeLink>
          </p>
        </div>
      </article>
    </SectionShell>
  );
}
