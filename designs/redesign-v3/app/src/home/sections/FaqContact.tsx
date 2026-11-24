import { useState, type FormEvent } from 'react';
import { useHome } from '../ctx';
import { Icon, Sp } from '../ui';

export function Faq() {
  const { t } = useHome();
  return (
    <section className="ch ch-paper" id="faq" aria-labelledby="t-faq">
      <div className="wrap faq-wrap">
        <header className="ch-head">
          <Sp id="t-faq">{t.faq.title}</Sp>
        </header>
        <div className="faq">
          {t.faq.items.map((it) => (
            <details className="rv" key={it.q}>
              <summary>
                <span className="q">
                  <Icon name={it.icon} className="ic qi" />
                  <span>{it.q}</span>
                </span>
                <i className="pm" aria-hidden="true" />
              </summary>
              <div className="ans">
                <div>
                  <p>{it.a}</p>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Contact() {
  const { t } = useHome();
  const c = t.contacto;
  const [status, setStatus] = useState('');

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = e.currentTarget.elements;
    const name = f.namedItem('name') as HTMLInputElement;
    const mail = f.namedItem('email') as HTMLInputElement;
    const msg = f.namedItem('message') as HTMLTextAreaElement;
    if (!name.value.trim() || !mail.value.trim() || !msg.value.trim()) {
      setStatus(c.missing);
      (!name.value.trim() ? name : !mail.value.trim() ? mail : msg).focus();
      return;
    }
    setStatus(c.mock);
  };

  return (
    <section className="ch ch-tomato" id="contacto" aria-labelledby="t-con">
      <div className="wrap contact">
        <div>
          <header className="ch-head">
            <Sp id="t-con">{c.title}</Sp>
          </header>
          <p className="rv">{c.text}</p>
          <p className="mail rv">
            <Icon name="mail" />
            <a href={`mailto:${c.email}`}>{c.email}</a>
          </p>
          <p className="sample-note rv">
            <b className="stamp stamp-ink">{c.pending}</b> <span>{c.note}</span>
          </p>
        </div>
        <form className="form rv" id="form" noValidate onSubmit={onSubmit}>
          <div className="f">
            <label htmlFor="f-name">
              <Icon name="user" />
              <span>{c.name}</span>
            </label>
            <input id="f-name" name="name" type="text" autoComplete="name" required />
          </div>
          <div className="f">
            <label htmlFor="f-mail">
              <Icon name="mail" />
              <span>{c.mail}</span>
            </label>
            <input id="f-mail" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="f">
            <label htmlFor="f-msg">
              <Icon name="message-square" />
              <span>{c.message}</span>
            </label>
            <textarea id="f-msg" name="message" rows={5} required />
          </div>
          <button className="btn btn-ink btn-lg" type="submit">
            <span>{c.send}</span>
            <Icon name="send" />
          </button>
          <p id="form-status" className="status" role="status">
            {status}
          </p>
        </form>
      </div>
    </section>
  );
}
