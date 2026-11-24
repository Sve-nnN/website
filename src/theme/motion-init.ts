/**
 * Estado inicial de movimiento (D-15). TypeScript puro, sin imports, para que
 * lo carguen tanto el layout (como script inline) como los scripts de verify.
 *
 * Por qué es una cadena y no una función: el script tiene que correr en el
 * `<head>` ANTES del primer pintado, así que se inyecta como texto. Cuando
 * `data-motion` se fija después de hidratar, las animaciones arrancan un frame
 * y se detienen, y eso es justo el parpadeo que el toggle quiere evitar.
 *
 * Reglas, en este orden:
 *   1. Un valor guardado válido (`paused` o `running`) gana. Es la elección
 *      explícita de la persona (SC 2.2.2) y debe respetarse.
 *   2. Sin valor guardado, `prefers-reduced-motion: reduce` da `paused`.
 *   3. Si no, `running`.
 *   4. Ante cualquier error (almacenamiento bloqueado, `matchMedia` ausente),
 *      `running`: un fallo del script nunca puede dejar la página congelada.
 *
 * T-53-22 y T-53-23: cualquier otro valor en `localStorage` se ignora y la
 * cadena es constante, sin datos de usuario interpolados.
 */
export const MOTION_STORAGE_KEY = 'jt-motion'

export const MOTION_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${MOTION_STORAGE_KEY}');var m=(s==='paused'||s==='running')?s:(matchMedia('(prefers-reduced-motion: reduce)').matches?'paused':'running');document.documentElement.setAttribute('data-motion',m)}catch(e){document.documentElement.setAttribute('data-motion','running')}})()`
