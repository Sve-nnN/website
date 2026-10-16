import copyJson from '../copy/clientes.json';
import { pick, SectionShell, Text, type Lang } from '../ui';
import '../styles/proof.css';

// Clientes como texto (cero recursos externos). El conteo sale de la longitud de la lista: sin digitos en el JSON.

export default function Clientes({ lang }: { lang: Lang }) {
  const t = pick(copyJson, lang);
  return (
    <SectionShell id="clientes" heading={t.heading} className="hm-proof">
      <div className="hm-groups">
        {t.groups.map((group) => (
          <div key={group.heading} className="hm-group">
            <h3 className="hm-group__title">{group.heading}</h3>
            <p className="card__meta pixel-label">
              {group.clients.length} {group.countNoun}
            </p>
            <ul className="hm-chips">
              {group.clients.map((name) => (
                <li key={name} className="badge">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="hm-proof__note">
        <Text>{t.pending}</Text>
      </p>
    </SectionShell>
  );
}
