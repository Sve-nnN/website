// Stub de next-intl/server para pruebas fuera de Next (plan 55-05).
// Fuera de la condición `react-server`, next-intl/server resuelve a un módulo
// que lanza "no es compatible con Client Components". La prueba SSR de 55-05
// llama al componente asíncrono de captura de email directamente, así que
// sustituye solo ese especificador por getLocale y getTranslations
// deterministas (idioma es, la clave tal cual entre corchetes).
const Module = require('node:module')

const source = [
  'export const getLocale = async () => "es";',
  'export const getTranslations = async () => (key) => "[" + key + "]";',
].join('\n')
const STUB_URL = 'data:text/javascript,' + encodeURIComponent(source)

Module.registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next-intl/server') return { url: STUB_URL, shortCircuit: true, format: 'module' }
    return nextResolve(specifier, context)
  },
})
