import { SectionShell, Text, pick, type Lang } from '../ui';
import copyJson from '../copy/faq.json';
import '../styles/method.css';

// FAQ (D-03, D-10): superficie de lectura. details nativos, sin JavaScript, sin canvas ni grano.
export default function Faq({ lang }: { lang: Lang }) {
  const t = pick(copyJson, lang);
  return (
    <SectionShell id="faq" heading={t.heading} surface="reading" className="hm-block hm-faq">
      <div className="hm-faq__list">
        {t.items.map((item) => (
          <details key={item.question}>
            <summary>{item.question}</summary>
            <p>
              <Text>{item.answer}</Text>
            </p>
          </details>
        ))}
      </div>
    </SectionShell>
  );
}
