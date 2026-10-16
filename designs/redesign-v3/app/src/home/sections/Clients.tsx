import { useHome } from '../ctx';
import { DEV_CLIENTS, SEO_CLIENTS, type ClientItem } from '../clients';
import { Count, Sp } from '../ui';

function Item({ item, hidden }: { item: ClientItem; hidden: boolean }) {
  if ('text' in item) {
    return (
      <li className="cl cl-t">
        <span>{item.text}</span>
      </li>
    );
  }
  // Logo real en <img> con filtro CSS. El segundo juego del carrusel es decorativo: alt vacio.
  return (
    <li className="cl">
      <img src={`/home/logos/${item.file}.webp`} width={item.w} height={item.h} alt={hidden ? '' : item.name} loading="eager" fetchPriority="low" decoding="async" />
    </li>
  );
}

function Row({ items, reverse }: { items: ClientItem[]; reverse?: boolean }) {
  return (
    <div className={`crow${reverse ? ' crow-r' : ''}`}>
      <div className="ctrack">
        <ul className="cset" role="list">
          {items.map((it, i) => (
            <Item key={i} item={it} hidden={false} />
          ))}
        </ul>
        <ul className="cset" aria-hidden="true">
          {items.map((it, i) => (
            <Item key={i} item={it} hidden />
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Clients() {
  const { t } = useHome();
  const c = t.clients;
  return (
    <section className="clients" id="clientes" aria-labelledby="t-cli">
      <div className="wrap">
        <div className="clients-head">
          <Sp id="t-cli" className="h2-s">
            {c.title}
          </Sp>
          <p className="rv">{c.lead}</p>
        </div>
        <div className="crow-w">
          <p className="clabel">
            <Count as="b" value={SEO_CLIENTS.length} />
            <span>{c.seo}</span>
          </p>
          <Row items={SEO_CLIENTS} />
        </div>
        <div className="crow-w">
          <p className="clabel">
            <Count as="b" value={DEV_CLIENTS.length} />
            <span>{c.dev}</span>
          </p>
          <Row items={DEV_CLIENTS} reverse />
        </div>
      </div>
    </section>
  );
}
