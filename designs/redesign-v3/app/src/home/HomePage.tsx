import './styles/fonts.css';
import './styles/tokens.css';
import './styles/home.css';
import './styles/fx.css';

import { useRef } from 'react';
import { HomeProvider, useHome, type Lang } from './ctx';
import { PaperNoise } from './fx';
import { About } from './sections/About';
import { Cases } from './sections/Cases';
import { Clients } from './sections/Clients';
import { Contact, Faq } from './sections/FaqContact';
import { Footer } from './sections/Footer';
import { Hero } from './sections/Hero';
import { Marquee, Measurement } from './sections/Measurement';
import { Nav } from './sections/Nav';
import { PaletteSelector } from './sections/PaletteSelector';
import { Process } from './sections/Process';
import { Services } from './sections/Services';
import { Testimonials } from './sections/Testimonials';
import { Websites } from './sections/Websites';
import { Sprite, useReveal } from './ui';

// Home v4 "manual editorial" (diseno aprobado: designs/redesign-v4/c-manual) con componentes originales de React Bits.
// Rutas: / en espanol y /en en ingles. Paleta por defecto papel-bosque; las otras cinco se prueban con ?paleta= o el selector.

function Body() {
  const { t, lang } = useHome();
  const host = useRef<HTMLDivElement>(null);
  useReveal(host, [lang]);
  return (
    <div ref={host}>
      <Sprite />
      <a className="skip" href="#main">
        {t.a11y.skip}
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        <Hero />
        <Clients />
        <Marquee />
        <Measurement />
        <Services />
        <Cases />
        <Process />
        <Websites />
        <About />
        <Testimonials />
        <Faq />
        <Contact />
      </main>
      <Footer />
      <PaletteSelector />
      <PaperNoise />
    </div>
  );
}

export function HomePage({ lang }: { lang: Lang }) {
  return (
    <HomeProvider initialLang={lang}>
      <Body />
    </HomeProvider>
  );
}
