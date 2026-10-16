import { SafeLink, SectionShell, Text, pick, type Lang } from '../ui';
import copyJson from '../copy/servicios.json';
import '../styles/method.css';

// Servicios (D-03). Cada tarjeta tiene un unico enlace: el del titulo, estirado sobre toda la tarjeta por el kit.
export default function Servicios({ lang }: { lang: Lang }) {
  const t = pick(copyJson, lang);
  return (
    <SectionShell id="servicios" heading={t.heading} className="hm-block">
      <ul className="hm-service-list">
        {t.services.map((service, i) => (
          <li key={service.href}>
            <article className="card card--link hm-service">
              <h3 className="card__title">
                <SafeLink href={service.href} aria-describedby={`servicio-${i}-texto`}>
                  {service.title}
                </SafeLink>
              </h3>
              <p className="card__text" id={`servicio-${i}-texto`}>
                <Text>{service.text}</Text>
              </p>
              <p className="card__meta hm-service__go">{service.linkLabel}</p>
            </article>
          </li>
        ))}
      </ul>
      <p className="hm-block__more">
        <SafeLink className="link-inline" href={t.allHref}>
          {t.allLabel}
        </SafeLink>
      </p>
    </SectionShell>
  );
}
