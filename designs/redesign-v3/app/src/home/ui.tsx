import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { isAllowedHref } from './links';
import { splitPending } from './pending';

// Primitivas compartidas de las secciones de la home (fase 52, plan 02).
// Las secciones de la ola 2 importan solo de aqui; lo que necesiten de mas va dentro de su propio archivo.
// Solo clases del kit (assets/css): nada de hex ni estilos en linea.

/** Idioma de la pagina. Igual por estructura al de HomePage.tsx, que lo declara por su cuenta. */
export type Lang = 'es' | 'en';

/** Devuelve la rama del idioma de un bloque de copy. */
export function pick<T>(copy: { es: T; en: T }, lang: Lang): T {
  return copy[lang];
}

/**
 * Dato que falta (D-05, regla 8 del kit): insignia .badge--pending con la palabra fija "Pendiente" y,
 * a su lado, la descripcion. Es una anotacion de revision escrita en espanol, tambien dentro de la pagina
 * en ingles, por eso lleva lang propio (A11Y.md). La descripcion queda fuera de la insignia para poder
 * partirse en varias lineas (.badge no corta lineas).
 */
export function Pending({ children }: { children: ReactNode }) {
  return (
    <span data-pending lang="es">
      <span className="badge badge--pending pixel-label">Pendiente</span> <span data-pending-detail>{children}</span>
    </span>
  );
}

/** Pinta una cadena de copy: texto plano y, donde hay [PENDIENTE: ...], el componente Pending. Sin HTML crudo. */
export function Text({ children }: { children: string }) {
  return (
    <>
      {splitPending(children).map((part, i) =>
        part.type === 'pending' ? <Pending key={i}>{part.value}</Pending> : part.value,
      )}
    </>
  );
}

type SectionShellProps = {
  /** Id de la seccion: ancla, data-section y base del id del h2 (`<id>-titulo`). */
  id: string;
  heading: ReactNode;
  /** 'reading' marca una superficie de lectura (FAQ, bloques de codigo): sin efectos (D-10, regla 7 del kit). */
  surface?: 'reading';
  className?: string;
  headingClassName?: string;
  children?: ReactNode;
};

/** Seccion con landmark nombrado por su h2. */
export function SectionShell({ id, heading, surface, className, headingClassName, children }: SectionShellProps) {
  const headingId = `${id}-titulo`;
  return (
    <section id={id} data-section={id} aria-labelledby={headingId} data-surface={surface} className={className}>
      <h2 id={headingId} className={headingClassName}>
        {heading}
      </h2>
      {children}
    </section>
  );
}

type SafeLinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'target'> & {
  href: string;
  /** Abre en una pestana nueva. El texto del enlace debe avisarlo (A11Y.md). */
  newTab?: boolean;
};

/**
 * Enlace con lista cerrada de destinos (T-52-02). Un destino fuera de la lista lanza un Error: el copy es
 * estatico, asi que el fallo aparece en desarrollo y en la build que sirve el harness en lugar de pintar
 * un enlace roto en silencio. Los https:// agregan rel="noopener noreferrer".
 */
export function SafeLink({ href, newTab = false, rel, children, ...rest }: SafeLinkProps) {
  if (!isAllowedHref(href)) {
    throw new Error(`SafeLink: destino fuera de la lista permitida: ${JSON.stringify(href)}`);
  }
  const external = href.startsWith('https://');
  const relParts = new Set((rel ?? '').split(/\s+/).filter(Boolean));
  if (external || newTab) {
    relParts.add('noopener');
    relParts.add('noreferrer');
  }
  return (
    <a {...rest} href={href} target={newTab ? '_blank' : undefined} rel={relParts.size ? [...relParts].join(' ') : undefined}>
      {children}
    </a>
  );
}
