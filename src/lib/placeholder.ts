// Render-time guard against unreplaced placeholder copy reaching a visitor.
//
// scripts/phase34-apply-local-landing.ts seeded the two local landings with
// stats and testimonials it could not fill, marking each one with the literal
// string `[PLACEHOLDER]` precisely so they would be greppable and obviously
// temporary. They were never replaced, so production served them: on
// 2026-08-14 `/seo-tecnico-madrid` and its English twin carried 14 occurrences
// each, `/seo-tecnico-lima` and its twin 10 each — including a testimonial
// card whose quote read "Testimonio real pendiente — reemplazar antes de
// publicar". Those are the pages that sell.
//
// This module is the render-side half of the fix. The data still holds the
// placeholders until someone runs the cleanup against the CMS, but no visitor
// or crawler sees them: every block that renders seeded copy filters through
// here first. Keeping the guard permanently is deliberate — placeholder copy
// escaping to production is a class of mistake, not a one-off, and a guard
// that outlives the incident is worth more than one that gets removed with it.
//
// The check is substring-based, not prefix-based: the seed puts the marker at
// the start of every value today, but a future editor pasting a placeholder
// mid-sentence should be caught just the same.

const MARKER = '[PLACEHOLDER]'

/** True when `value` is a string carrying the placeholder marker. */
export function isPlaceholder(value: unknown): boolean {
  return typeof value === 'string' && value.includes(MARKER)
}

/**
 * Returns `value` unchanged, or `undefined` when it is placeholder copy.
 *
 * Written to drop straight into an existing truthiness guard, which is why it
 * returns `undefined` rather than an empty string: `{x && <p>{x}</p>}` already
 * renders nothing for `undefined`, so callers need no new branch.
 */
export function omitPlaceholder<T>(value: T): T | undefined {
  return isPlaceholder(value) ? undefined : value
}

/**
 * Drops entries whose selected fields carry the marker.
 *
 * `fields` names the properties that make the entry worth rendering at all —
 * for a stat that is its `value` and `label`, since a stat with a placeholder
 * label is noise regardless of how real its number looks.
 */
export function withoutPlaceholders<T extends Record<string, unknown>>(
  items: T[] | null | undefined,
  fields: (keyof T)[],
): T[] {
  if (!items) return []
  return items.filter((item) => !fields.some((field) => isPlaceholder(item[field])))
}
