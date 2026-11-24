import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType, type LazyExoticComponent } from 'react';
import { catalog, type CatalogEntry } from './catalog';
import { fallbacks } from './fallbacks';
import type { OriginalName } from './originals';
import { useSlot } from './slot';
import { BLOCKED_ID } from './Toolbar';
import { readTokens } from './tokens';

// Un lazy() por original, creado una sola vez a nivel de modulo: el chunk no se pide hasta el primer montaje.
const lazies = Object.fromEntries(catalog.map((e) => [e.name, lazy(e.loader)])) as Record<
  OriginalName,
  LazyExoticComponent<ComponentType<any>>
>;

/** Hijo sonda: su efecto corre solo cuando el original diferido ya se renderizo dentro del mismo Suspense. */
function Probe({ onReady }: { onReady: (ready: boolean) => void }) {
  useEffect(() => {
    onReady(true);
    return () => onReady(false);
  }, [onReady]);
  return null;
}

export function EffectCard({ entry }: { entry: CatalogEntry }) {
  const { activeId, blockedReason, toggle, reportVisible } = useSlot();
  const [ready, setReady] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const props = useMemo(() => entry.buildProps(readTokens()), [entry]);
  const shown = useMemo(() => entry.shownProps(props), [entry, props]);
  const Original = lazies[entry.name];
  const Fallback = fallbacks[entry.name];
  const slug = entry.name.toLowerCase();
  const active = activeId === entry.name;
  const blocked = blockedReason !== null;

  // Visibilidad del escenario: el cupo libera la tarjeta activa cuando sale del viewport.
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (records) => {
        for (const record of records) reportVisible(entry.name, record.intersectionRatio >= 0.15);
      },
      { threshold: [0, 0.15, 1] },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [entry.name, reportVisible]);

  useEffect(() => {
    if (!active) setReady(false);
  }, [active]);

  const original = <Original {...props} />;

  return (
    <article className="card" data-effect={slug} data-mounted={active && ready ? 'true' : 'false'}>
      <h3>{entry.title}</h3>
      <p className="card-origin" data-origin>
        Origen: {entry.originName}, React Bits, {entry.category}.
      </p>
      <a className="card-docs" href={entry.docsUrl} data-docs rel="noreferrer">
        Documentación de {entry.originName}
      </a>

      <div
        ref={stageRef}
        className="stage"
        data-stage
        data-placement={entry.placement}
        style={{ height: entry.stageHeight }}
        aria-hidden={entry.decorative ? true : undefined}
      >
        {active ? (
          <>
            <Suspense fallback={<Fallback />}>
              {entry.wrap ? entry.wrap(original) : <div className="stage-original">{original}</div>}
              <Probe onReady={setReady} />
            </Suspense>
            {entry.overlay && ready ? entry.overlay() : null}
          </>
        ) : (
          <Fallback />
        )}
      </div>

      <dl className="props" data-props>
        {shown.map((p) => (
          <div key={p.name}>
            <dt>{p.name}</dt>
            <dd data-prop={p.name}>
              {p.values.map((v, i) => (
                <code key={`${v}-${i}`}>{v}</code>
              ))}
            </dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        className="btn-toggle"
        data-toggle
        aria-pressed={active}
        aria-label={`Montar original de ${entry.title}`}
        aria-disabled={blocked ? true : undefined}
        aria-describedby={blocked ? BLOCKED_ID : undefined}
        onClick={() => toggle(entry.name, stageRef.current)}
      >
        Montar original
      </button>
    </article>
  );
}
