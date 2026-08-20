/**
 * Static grain overlay for the navy bands that are NOT the hero.
 *
 * WHY NOT THE SHADER — `HeroGrainGradient` is a real WebGL2 canvas
 * (`@paper-design/shaders-react`) animating on a timer. It earns its cost
 * twice on this page: once opening the hero, once closing the audit CTA.
 * Mounting it a third and fourth time to make the intermediate bands feel
 * related would put four animating canvases on the surface whose entire
 * argument is that this developer ships fast sites. The grain is the
 * material; the shader is the moment. Those are different jobs.
 *
 * So this is the material: an inline SVG `feTurbulence` painted once as a
 * data URI, no JavaScript, no canvas, no animation frame. It reads as the
 * same surface as the hero because it is the same kind of noise, sitting on
 * the same navy, just holding still.
 *
 * `feTurbulence` with `type="fractalNoise"` and a high `baseFrequency`
 * produces fine film grain rather than the woolly clouds a low frequency
 * gives. The result is desaturated to keep the two-temperature rule intact:
 * raw turbulence is full-colour RGB noise, and left alone it would smuggle a
 * third hue into a palette that allows exactly navy and ember.
 */

const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='140' height='140' filter='url(%23g)' opacity='0.55'/></svg>`

const GRAIN_DATA_URI = `url("data:image/svg+xml,${GRAIN_SVG.replace(/"/g, "'").replace(/#/g, '%23')}")`

/**
 * @param opacity how present the grain is. The default is deliberately low:
 * on the navy band the grain should be felt at reading distance and only
 * become visible when you lean in, the way film grain works. Push it higher
 * only behind large empty areas, never behind body copy.
 */
export function GrainTexture({ opacity = 0.16 }: { opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 mix-blend-overlay"
      style={{ backgroundImage: GRAIN_DATA_URI, backgroundRepeat: 'repeat', opacity }}
    />
  )
}
