import { useState, type CSSProperties } from 'react';
import { useHome } from '../ctx';
import { SiteHalftone } from '../fx';
import { Count, Icon, Sp } from '../ui';

type Item = ReturnType<typeof useHome>['t']['websites']['items'][number];

function Site({ item, index }: { item: Item; index: number }) {
  const { t } = useHome();
  const [hot, setHot] = useState(false);
  return (
    <li className="site rv" style={{ '--d': index } as CSSProperties}>
      <a
        className="devlink"
        href={`https://${item.host}`}
        target="_blank"
        rel="noopener"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHot(true)}
        onPointerLeave={() => setHot(false)}
      >
        <span className="dev">
          <span className="dev-bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <b>{item.host}</b>
          </span>
          <img src={`/home/img/${item.id}-desktop.webp`} width={1280} height={800} loading="lazy" decoding="async" alt={item.alt} />
          <span className="phone" aria-hidden="true">
            <img src={`/home/img/${item.id}-mobile.webp`} width={260} height={563} loading="lazy" decoding="async" alt="" />
          </span>
          <SiteHalftone src={`/home/img/${item.id}-desktop.webp`} hot={hot} />
        </span>
        <span className="sr">{t.a11y.newTab.replace('{0}', item.host)}</span>
      </a>
      <div className="site-t">
        <h3>{item.name}</h3>
        <p>{item.kind}</p>
      </div>
      <p className="score">
        <Count as="b" value={item.score} />
        <span>Performance</span>
      </p>
    </li>
  );
}

export function Websites() {
  const { t } = useHome();
  const w = t.websites;
  return (
    <section className="ch ch-alt" id="websites" aria-labelledby="t-web">
      <div className="wrap">
        <header className="ch-head">
          <Sp id="t-web">{w.title}</Sp>
        </header>
        <p className="sample-note rv">
          <b className="stamp stamp-warn">{w.pending}</b> <span>{w.note}</span>
        </p>
        <ul className="sites">
          {w.items.map((it, i) => (
            <Site key={it.id} item={it} index={i} />
          ))}
        </ul>
        <p className="after rv">
          <a className="more" href={w.allHref}>
            <span>{w.all}</span>
            <Icon name="arrow-right" />
          </a>
        </p>
      </div>
    </section>
  );
}
