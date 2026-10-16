import copyJson from '../copy/errores-reales.json';
import { pick, SafeLink, SectionShell, Text, type Lang } from '../ui';
import '../styles/proof.css';

// Bloque central del brief: tres fixes reales del repositorio publico, con el codigo literal del commit.
// Superficie de lectura (D-10): sin canvas ni efectos. El codigo viene del JSON tal cual; aqui no se edita.

export default function ErroresReales({ lang }: { lang: Lang }) {
  const t = pick(copyJson, lang);
  return (
    <SectionShell id="errores-reales" heading={t.heading} surface="reading" className="hm-proof hm-proof--reading">
      <p className="hm-proof__lede">
        <Text>{t.intro}</Text>
      </p>
      <p>
        <SafeLink className="link-inline hm-link" href={t.repoUrl}>
          {t.repoLabel}
        </SafeLink>
      </p>
      <ol className="hm-fixes">
        {t.fixes.map((fix) => (
          <li key={fix.commitSha}>
            <article className="card hm-fix">
              <h3 className="card__title hm-fix__title">{fix.symptom}</h3>
              <div className="hm-fix__cause">
                <p className="card__meta pixel-label">{t.labels.cause}</p>
                <p className="card__text">
                  <Text>{fix.cause}</Text>
                </p>
              </div>
              <figure className="hm-fix__figure">
                <figcaption className="hm-fix__caption">
                  <span>
                    {t.labels.file}: <code>{fix.filePath}</code>
                  </span>
                  <SafeLink className="link-inline hm-link" href={fix.commitUrl}>
                    {t.commitLabel} <code>{fix.commitSha}</code>
                  </SafeLink>
                </figcaption>
                <pre className="hm-code" lang="en">
                  <code>{fix.code}</code>
                </pre>
              </figure>
              <div className="hm-fix__outcome">
                <p className="card__meta pixel-label">{t.labels.outcome}</p>
                <p className="card__text">
                  <Text>{fix.outcome}</Text>
                </p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}
