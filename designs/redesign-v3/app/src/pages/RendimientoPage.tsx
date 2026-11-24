import { useEffect, useState } from 'react';

// Los datos se piden en tiempo de ejecucion: no entran al bundle y no cambian los hashes del build medido.

interface WeightRow {
  original: string;
  group: string;
  ownJsGzip: number;
  ownCssGzip: number;
  sharedGzip: number;
  totalGzip: number;
  totalBrotli: number;
  vanillaGzip: number;
  ratio: number;
  exceedsCap: boolean;
  note: string;
}

interface Weights {
  generatedAt: string;
  buildSha256: string;
  base: { gzip: number; brotli: number; react: string | null };
  shared: { file: string; gzip: number; usedBy: string[] }[];
  rows: WeightRow[];
  budgets: { perEffect: number };
}

interface Combo {
  target: string;
  label: string;
  factor: 'mobile' | 'desktop';
  median: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    lcpMs: number;
    cls: number;
    tbtMs: number;
    transferBytes: number;
  };
}

interface Lighthouse {
  generatedAt: string;
  lighthouseVersion: string;
  buildSha256: string;
  runsPerCombination: number;
  combos: Combo[];
  verdicts: Record<string, { result: string; value: number }>;
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

type State = { status: 'loading' } | { status: 'missing' } | { status: 'ready'; weights: Weights; lighthouse: Lighthouse };

export function RendimientoPage() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [w, l] = await Promise.all([
          fetch('/measurements/original-vs-vanilla.json'),
          fetch('/measurements/lighthouse-summary.json'),
        ]);
        if (!w.ok || !l.ok) throw new Error('sin mediciones');
        const weights = (await w.json()) as Weights;
        const lighthouse = (await l.json()) as Lighthouse;
        if (!cancelled) setState({ status: 'ready', weights, lighthouse });
      } catch {
        if (!cancelled) setState({ status: 'missing' });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <header className="site-header page-header">
        <span className="brand">Juan Tech</span>
        <h1>Rendimiento de los originales frente a mi porte vanilla</h1>
        <nav className="page-nav" aria-label="Principal">
          <ul>
            <li>
              <a href="/system">Galería /system</a>
            </li>
            <li>
              <a href="/rendimiento" aria-current="page">
                Rendimiento
              </a>
            </li>
          </ul>
        </nav>
      </header>

      <main id="contenido" className="page">
        {state.status === 'loading' ? <p role="status">Cargando mediciones.</p> : null}
        {state.status === 'missing' ? (
          <p role="status">
            No encontré las mediciones. Ejecuta <code>npm run measure</code>.
          </p>
        ) : null}
        {state.status === 'ready' ? <Report weights={state.weights} lighthouse={state.lighthouse} /> : null}
      </main>

      <footer className="site-footer">
        <p>
          Los originales son de React Bits, con licencia MIT más Commons Clause. Detalle en{' '}
          <code>designs/redesign-v3/app/LICENSES.md</code>.
        </p>
      </footer>
    </>
  );
}

function Report({ weights, lighthouse }: { weights: Weights; lighthouse: Lighthouse }) {
  const cap = weights.budgets.perEffect;
  return (
    <>
      <section aria-labelledby="t-peso">
        <h2 id="t-peso">Peso por componente</h2>
        <p>
          Base de React y cascarón: {kb(weights.base.gzip)} gzip{weights.base.react ? ` con React ${weights.base.react}` : ''}. El
          porte vanilla no necesita React. Compartido es el código que varios originales piden juntos, sobre todo{' '}
          <code>ogl</code>.
        </p>
        <div className="data-table-wrap">
          <table className="data-table">
            <caption>Peso gzip de cada original medido sobre el build de producción y su porte vanilla de la fase 51</caption>
            <thead>
              <tr>
                <th scope="col">Original</th>
                <th scope="col">Grupo</th>
                <th scope="col">Propio gzip</th>
                <th scope="col">Compartido gzip</th>
                <th scope="col">Total gzip</th>
                <th scope="col">Porte vanilla gzip</th>
                <th scope="col">Relación</th>
                <th scope="col">Tope por efecto</th>
              </tr>
            </thead>
            <tbody>
              {weights.rows.map((r) => (
                <tr key={r.original}>
                  <th scope="row">{r.original}</th>
                  <td>{r.group === 'base' ? 'Pedido' : 'Scout'}</td>
                  <td>{kb(r.ownJsGzip + r.ownCssGzip)}</td>
                  <td>{kb(r.sharedGzip)}</td>
                  <td>{kb(r.totalGzip)}</td>
                  <td>{kb(r.vanillaGzip)}</td>
                  <td>{r.ratio.toFixed(1)}x</td>
                  <td className={r.exceedsCap ? 'is-over' : undefined}>
                    {kb(cap)}: {r.exceedsCap ? 'supera' : 'dentro'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Build medido: <code>{weights.buildSha256.slice(0, 12)}</code>. El tope es el de la fase 51 para un porte vanilla; los
          originales lo superan por diseño porque traen su propio motor de render.
        </p>
      </section>

      <section aria-labelledby="t-lh">
        <h2 id="t-lh">Lighthouse del build de producción</h2>
        <div className="data-table-wrap">
          <table className="data-table">
            <caption>Mediana de {lighthouse.runsPerCombination} corridas por objetivo y factor de forma</caption>
            <thead>
              <tr>
                <th scope="col">Objetivo</th>
                <th scope="col">Factor</th>
                <th scope="col">Performance</th>
                <th scope="col">Accesibilidad</th>
                <th scope="col">Mejores prácticas</th>
                <th scope="col">LCP</th>
                <th scope="col">CLS</th>
                <th scope="col">TBT</th>
                <th scope="col">Transferido</th>
              </tr>
            </thead>
            <tbody>
              {lighthouse.combos.map((c) => (
                <tr key={`${c.target}-${c.factor}`}>
                  <th scope="row">{c.label}</th>
                  <td>{c.factor === 'mobile' ? 'Mobile' : 'Desktop'}</td>
                  <td>{c.median.performance}</td>
                  <td>{c.median.accessibility}</td>
                  <td>{c.median.bestPractices}</td>
                  <td>{c.median.lcpMs} ms</td>
                  <td>{c.median.cls}</td>
                  <td>{c.median.tbtMs} ms</td>
                  <td>{kb(c.median.transferBytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="t-como">
        <h2 id="t-como">Cómo medí</h2>
        <ul>
          <li>Servidor propio con brotli en 127.0.0.1 sobre el build de producción de Vite.</li>
          <li>Lighthouse {lighthouse.lighthouseVersion}, tres corridas por objetivo y factor, y tomo la mediana de cada métrica.</li>
          <li>Hash del build: <code>{lighthouse.buildSha256.slice(0, 12)}</code>. Pesos y Lighthouse salen del mismo build.</li>
          <li>
            Chromium headless renderiza WebGL por software y exagera el tiempo de hilo principal. Confirma TBT y LCP con el
            original montado en una GPU real antes de decidir.
          </li>
        </ul>
        <ul>
          {Object.entries(lighthouse.verdicts).map(([k, v]) => (
            <li key={k}>
              {k}: {v.result} ({v.value})
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
