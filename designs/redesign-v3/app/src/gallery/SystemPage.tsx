import { catalog } from './catalog';
import { EffectCard } from './EffectCard';
import { SlotProvider } from './slot';
import { Toolbar } from './Toolbar';

const base = catalog.filter((e) => e.group === 'base');
const scout = catalog.filter((e) => e.group === 'scout');

export function SystemPage() {
  return (
    <SlotProvider>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="site-header page-header">
        <span className="brand">Juan Tech</span>
        <h1>Mi sistema visual con los componentes originales de React Bits</h1>
        <p className="lede">
          Cada tarjeta muestra el fallback CSS de la fase 51. Con el botón monto el componente original de React Bits en el
          mismo espacio y lo comparo con mi porte vanilla.
        </p>
        <p className="lede">
          Monto un solo original a la vez, lo cargo después del primer pintado y lo desmonto cuando sale de la pantalla. Si tu
          sistema pide menos movimiento o si pausas las animaciones, solo ves el fallback.
        </p>
        <Toolbar />
      </header>

      <main id="contenido" className="page">
        <section aria-labelledby="t-pedidos">
          <h2 id="t-pedidos">Efectos pedidos</h2>
          <ul className="grid">
            {base.map((entry) => (
              <li key={entry.name}>
                <EffectCard entry={entry} />
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="t-scout">
          <h2 id="t-scout">Adicionales del scout</h2>
          <ul className="grid">
            {scout.map((entry) => (
              <li key={entry.name}>
                <EffectCard entry={entry} />
              </li>
            ))}
          </ul>
        </section>

        <section data-surface="reading" aria-labelledby="t-lectura">
          <h2 id="t-lectura">Superficie de lectura</h2>
          <div className="reading-sample fx-dotgrid">
            <div className="fx-noise" aria-hidden="true" />
            <p className="reading-text">
              Aquí el texto manda. Los originales no se montan en esta superficie. Solo hay grano estático y dot grid estático.
            </p>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <p>
          Entorno de mockups de la fase 51.1. Los originales son de React Bits, con licencia MIT más Commons Clause. Los avisos
          y los hashes viven en <code>designs/redesign-v3/app/LICENSES.md</code>.
        </p>
        <p>
          <a href="https://reactbits.dev" rel="noreferrer">
            Documentación de React Bits
          </a>
        </p>
      </footer>
    </SlotProvider>
  );
}
