import { useLayoutEffect } from 'react';
import { ASCII_ART } from '../gallery/fallbacks';
import { HomeEffect, HomeEffectProvider, useHomeEffects } from './home-effect';
import { HomeSections } from './HomeSections';
import copyJson from './copy/page.json';
import './home.css';

export type Lang = 'es' | 'en';
const copy = copyJson as Record<Lang, (typeof copyJson)['es']>;

const HOME_PATH: Record<Lang, string> = { es: '/', en: '/en' };

/** D-06 y D-13: idioma, titulo y meta descripcion de la ruta, antes de pintar. */
function useDocumentMeta(lang: Lang) {
  useLayoutEffect(() => {
    const { title, description } = copy[lang].meta;
    document.documentElement.lang = lang;
    document.title = title;
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = description;
  }, [lang]);
}

function Header({ lang }: { lang: Lang }) {
  const { paused, togglePause } = useHomeEffects();
  const t = copy[lang].header;
  return (
    <header className="site-header hm-header">
      <a className="brand" href={HOME_PATH[lang]}>
        Juan Carlos Angulo
      </a>
      <div className="site-header__tools">
        <ul className="lang" aria-label={t.langLabel}>
          <li>
            <a href={HOME_PATH.es} lang="es" hrefLang="es" aria-label="Español" aria-current={lang === 'es' ? 'true' : undefined}>
              ES
            </a>
          </li>
          <li>
            <a href={HOME_PATH.en} lang="en" hrefLang="en" aria-label="English" aria-current={lang === 'en' ? 'true' : undefined}>
              EN
            </a>
          </li>
        </ul>
        <button type="button" className="btn btn--ghost pause-toggle" data-fx-pause aria-pressed={paused} onClick={togglePause}>
          {t.pause}
        </button>
      </div>
    </header>
  );
}

function Hero({ lang }: { lang: Lang }) {
  const t = copy[lang].hero;
  return (
    <section className="fx-grain hm-hero" aria-labelledby="hm-h1">
      <HomeEffect id="hero" original="Grainient" />
      <div className="hm-hero__grid">
        <div className="fx-content hm-hero__panel">
          <h1 id="hm-h1">{t.h1}</h1>
          <p className="lede">{t.lede}</p>
          <div className="hm-hero__cta">
            <a className="btn btn--primary" href="#contacto">
              {t.ctaPrimary}
            </a>
            <a className="btn btn--ghost" href="#casos">
              {t.ctaSecondary}
            </a>
          </div>
        </div>
        <div className="ascii-block hm-hero__ascii">
          <pre className="fx-ascii" aria-hidden="true">
            {ASCII_ART}
          </pre>
        </div>
      </div>
    </section>
  );
}

function Page({ lang }: { lang: Lang }) {
  useDocumentMeta(lang);
  const after = (
    <footer className="site-footer hm-footer">
      <a className="brand" href={HOME_PATH[lang]}>
        Juan Carlos Angulo
      </a>
    </footer>
  );
  return (
    <>
      <a className="skip-link" href="#contenido">
        {copy[lang].skip}
      </a>
      <Header lang={lang} />
      <main id="contenido" tabIndex={-1}>
        <Hero lang={lang} />
        <HomeSections lang={lang} after={after} />
      </main>
      <div id="hm-after" />
    </>
  );
}

export function HomePage({ lang }: { lang: Lang }) {
  return (
    <HomeEffectProvider>
      <Page lang={lang} />
    </HomeEffectProvider>
  );
}
