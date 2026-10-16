import { catalog } from './catalog';
import { BLOCKED_TEXT, useSlot } from './slot';

export const BLOCKED_ID = 'aviso-bloqueo';

/** Barra de control: pausa global, estado del cupo y aviso del motivo de bloqueo. */
export function Toolbar() {
  const { activeId, blockedReason, paused, togglePause } = useSlot();
  const active = activeId ? catalog.find((e) => e.name === activeId) : undefined;

  return (
    <div className="toolbar">
      <button type="button" className="btn-toggle" data-pause aria-pressed={paused} onClick={togglePause}>
        Pausar animaciones
      </button>
      <p className="toolbar-status" role="status" data-slot-status>
        {active ? `Montado: ${active.title}. Cupo: 1 de 1.` : 'Ningún original montado. Cupo: 0 de 1.'}
      </p>
      {blockedReason ? (
        <p className="toolbar-blocked" id={BLOCKED_ID} data-blocked-reason={blockedReason}>
          {BLOCKED_TEXT[blockedReason]}
        </p>
      ) : null}
    </div>
  );
}
