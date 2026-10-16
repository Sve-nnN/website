import { useRef, useState, type FormEvent } from 'react';
import { HomeEffect } from '../home-effect';
import { Text, SectionShell, SafeLink, pick, type Lang } from '../ui';
import copyJson from '../copy/contacto.json';
import '../styles/conversion.css';

const copy = copyJson as { es: (typeof copyJson)['es']; en: (typeof copyJson)['es'] };

type FieldName = 'name' | 'email' | 'message';
type Errors = Partial<Record<FieldName, 'missing' | 'format'>>;
type Status = { kind: 'ok' | 'invalid'; text: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validacion local. Nada sale de la pagina: el formulario no tiene action y no hay ninguna llamada de red. */
function validate(values: Record<FieldName, string>): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = 'missing';
  if (!values.email.trim()) errors.email = 'missing';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'format';
  if (!values.message.trim()) errors.message = 'missing';
  return errors;
}

export default function Contacto({ lang }: { lang: Lang }) {
  const t = pick(copy, lang);
  const f = t.form;
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>(null);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const values = {
      name: String(data.get('name') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
    };
    const found = validate(values);
    setErrors(found);
    const first = (['name', 'email', 'message'] as const).find((key) => found[key]);
    if (first) {
      setStatus({ kind: 'invalid', text: f.invalidStatus });
      refs[first].current?.focus();
      return;
    }
    setStatus({ kind: 'ok', text: f.mockupStatus });
  }

  const message = (field: FieldName): string | null => {
    const kind = errors[field];
    if (!kind) return null;
    if (field === 'email' && kind === 'format') return f.email.errorFormat;
    return f[field].error;
  };

  const describedBy = (field: FieldName) => `hm-c-${field}-help${errors[field] ? ` hm-c-${field}-error` : ''}`;

  const renderError = (field: FieldName) => {
    const text = message(field);
    if (!text) return null;
    return (
      <p className="field-error" id={`hm-c-${field}-error`}>
        <span className="field-error__icon" aria-hidden="true">
          [!]
        </span>
        <span>
          <strong>{f.errorLabel}</strong> {text}
        </span>
      </p>
    );
  };

  return (
    <SectionShell id="contacto" heading={t.heading} className="hm-contact">
      {/* Banda decorativa (guia 6): el terminal nunca sustituye al texto real. HomeEffect decora a este padre. */}
      <div className="hm-terminal fx-crt" aria-hidden="true">
        <HomeEffect id="terminal" original="CRTWarp" />
        <pre className="crt-screen fx-crt-text hm-terminal__text">
          {t.terminal} <span className="crt-cursor" aria-hidden="true" />
        </pre>
      </div>
      <p className="lede">{t.description}</p>
      <div className="hm-contact__grid">
        <form className="form hm-form" noValidate aria-labelledby="contacto-titulo" onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="hm-c-name">{f.name.label}</label>
            <p className="field-help" id="hm-c-name-help">
              {f.name.help}
            </p>
            <input
              ref={refs.name}
              className="input"
              id="hm-c-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              aria-invalid={errors.name ? 'true' : undefined}
              aria-describedby={describedBy('name')}
            />
            {renderError('name')}
          </div>
          <div className="field">
            <label htmlFor="hm-c-email">{f.email.label}</label>
            <p className="field-help" id="hm-c-email-help">
              {f.email.help}
            </p>
            <input
              ref={refs.email}
              className="input"
              id="hm-c-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              aria-invalid={errors.email ? 'true' : undefined}
              aria-describedby={describedBy('email')}
            />
            {renderError('email')}
          </div>
          <div className="field">
            <label htmlFor="hm-c-message">{f.message.label}</label>
            <p className="field-help" id="hm-c-message-help">
              {f.message.help}
            </p>
            <textarea
              ref={refs.message}
              className="input"
              id="hm-c-message"
              name="message"
              rows={5}
              required
              aria-invalid={errors.message ? 'true' : undefined}
              aria-describedby={describedBy('message')}
            />
            {renderError('message')}
          </div>
          <div className="field">
            <button type="submit" className="btn btn--primary">
              {f.submit}
            </button>
          </div>
          <p className="form-status hm-form-status" role="status" data-kind={status?.kind}>
            {status?.text}
          </p>
        </form>
        <div className="hm-contact__aside">
          <h3>{t.sidebar.title}</h3>
          <p>{t.sidebar.text}</p>
          <p className="hm-contact__mail">
            {t.sidebar.emailLabel}:{' '}
            <SafeLink className="link-inline hm-tap" href={t.sidebar.href}>
              {t.sidebar.email}
            </SafeLink>
          </p>
          <p className="hm-contact__response">
            <Text>{t.responseTime}</Text>
          </p>
        </div>
      </div>
    </SectionShell>
  );
}
