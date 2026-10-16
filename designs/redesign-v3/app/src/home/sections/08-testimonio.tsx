import copyJson from '../copy/testimonio.json';
import { pick, SectionShell, Text, type Lang } from '../ui';
import '../styles/proof.css';

// Unica cita real encontrada (Patricia Ibarra, Estylopia). Sin carrusel y sin otras citas: lo que falta queda como pendiente.

export default function Testimonio({ lang }: { lang: Lang }) {
  const t = pick(copyJson, lang);
  return (
    <SectionShell id="testimonio" heading={t.heading} className="hm-proof hm-proof--quote">
      <figure className="hm-quote">
        <blockquote className="hm-quote__text">
          <p>{`“${t.quote}”`}</p>
        </blockquote>
        <figcaption className="hm-quote__author">
          <span className="hm-quote__name">{t.author}</span>
          <span className="card__meta">
            {t.role}, {t.company}
          </span>
        </figcaption>
      </figure>
      <ul className="hm-pending-list">
        {t.pending.map((item) => (
          <li key={item}>
            <Text>{item}</Text>
          </li>
        ))}
      </ul>
    </SectionShell>
  );
}
