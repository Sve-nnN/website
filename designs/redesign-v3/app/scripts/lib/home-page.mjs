/*
 * home-page.mjs: utilidades compartidas por las etapas de la home v4 (52-06).
 * Sin dependencias. Todo lo que corre en el navegador va como funcion que se serializa con page.evaluate.
 *
 * En v4 la apertura de paginas la hace el runner (`ctx.openPage(ruta, { viewport, contextOptions, init })`),
 * que ya resuelve la ruta y captura pageerror/console.error; aqui solo viven las constantes de viewport y
 * los fragmentos que se inyectan con addInitScript.
 */

export const DESKTOP = { width: 1440, height: 900 };
export const PHONE = { width: 390, height: 844 };
export const MOBILE_OPTS = { viewport: PHONE, contextOptions: { isMobile: true, hasTouch: true, deviceScaleFactor: 1 } };

/** Simula navigator.connection.saveData: se inyecta antes de la carga. */
export const SAVE_DATA_INIT = () => {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: { saveData: true, addEventListener() {}, removeEventListener() {} },
  });
};
