/**
 * Plugin PostCSS local: envuelve la salida de `globals.css` en `@layer tailwind`
 * y declara el orden `@layer tailwind, mui;` antes de cualquier regla.
 *
 * Por qué existe: Tailwind v3 no emite capas CSS nativas. Su salida (preflight,
 * utilidades, el `button { background-color: transparent }` del reset) queda
 * como reglas sin capa. En CSS, una declaración sin capa gana siempre a una
 * declaración dentro de cualquier `@layer`, sin importar la especificidad.
 * MUI con `enableCssLayer` mete sus estilos en `@layer mui`, así que sin este
 * plugin el reset de Tailwind aplastaría el fondo de un `Button contained`.
 * Envolver Tailwind en una capa propia declarada ANTES de `mui` invierte la
 * precedencia: `mui` gana a `tailwind`.
 *
 * Solo actúa sobre `globals.css`. No toca `@payloadcms/next/css` ni ningún
 * otro CSS de terceros (T-53-02).
 *
 * CommonJS porque `package.json` declara `"type": "module"` y Next carga los
 * plugins por nombre de cadena (rechaza funciones).
 *
 * Vida útil: convive con Tailwind en la rama del rediseño y se borra junto con
 * Tailwind en la fase 57 (CAL-03).
 */
module.exports = () => ({
  postcssPlugin: 'wrap-tailwind-in-layer',
  OnceExit(root, { AtRule }) {
    const file = root.source && root.source.input && root.source.input.file
    if (!file || !/globals\.css$/.test(file)) return

    const layer = new AtRule({ name: 'layer', params: 'tailwind' })
    root.nodes.slice().forEach((node) => {
      node.remove()
      layer.append(node)
    })
    // Sentencia de orden sin cuerpo: primero, para que tailwind quede bajo mui.
    root.append(new AtRule({ name: 'layer', params: 'tailwind, mui' }))
    root.append(layer)
  },
})
module.exports.postcss = true
