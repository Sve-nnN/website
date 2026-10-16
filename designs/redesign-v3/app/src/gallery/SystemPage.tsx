import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { catalog, type CatalogEntry } from './catalog';
import { originals } from './originals';
import { readTokens } from './tokens';

/** Hijo sonda: su efecto corre solo cuando el original diferido ya se renderizo dentro del mismo Suspense. */
function Probe({ onReady }: { onReady: () => void }) {
  useEffect(() => {
    onReady();
  }, [onReady]);
  return null;
}

function formatValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  return [String(value)];
}

function EffectCard({ entry }: { entry: CatalogEntry }) {
  const [wanted, setWanted] = useState(false);
  const [mounted, setMounted] = useState(false);
  const props = useMemo(() => entry.buildProps(readTokens()), [entry]);
  const Original = useMemo(() => lazy(originals[entry.name]), [entry.name]);
  const slug = entry.name.toLowerCase();

  const toggle = () => {
    setWanted((prev) => !prev);
    setMounted(false);
  };

  return (
    <article className="card" data-effect={slug} data-mounted={mounted ? 'true' : 'false'}>
      <h3>{entry.title}</h3>
      <p className="pixel-label">Origen: {entry.name}, React Bits, {entry.category}.</p>

      <div className="stage">
        <div className="fx-grain" />
        {wanted ? (
          <div className="stage-original">
            <Suspense fallback={null}>
              <Original {...props} />
              <Probe onReady={() => setMounted(true)} />
            </Suspense>
          </div>
        ) : null}
        <div className="fx-content stage-panel">
          <p>Fallback CSS de la fase 51 debajo, componente original encima al montarlo.</p>
        </div>
      </div>

      <dl data-props className="props">
        {Object.entries(props).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd data-prop={key}>
              {formatValue(value).map((v) => (
                <code key={v}>{v}</code>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <button type="button" className="toggle" data-toggle aria-pressed={wanted} onClick={toggle}>
        {wanted ? 'Desmontar original' : 'Montar original'}
      </button>
    </article>
  );
}

export function SystemPage() {
  return (
    <>
      <header className="site-header">
        <span className="brand">Juan Tech</span>
      </header>
      <main className="page">
        <h1>Mi sistema visual con los componentes originales de React Bits</h1>
        <p className="lede">
          Cada tarjeta carga su original solo cuando lo pido y conserva debajo el fallback CSS de la fase 51.
        </p>
        <div className="grid">
          {catalog.map((entry) => (
            <EffectCard key={entry.name} entry={entry} />
          ))}
        </div>
      </main>
      <footer className="site-footer">
        <p>Entorno de mockups, fase 51.1. Los originales son de React Bits, licencia MIT más Commons Clause.</p>
      </footer>
    </>
  );
}
