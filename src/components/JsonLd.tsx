// SECURITY (T-02-02 + 22-REVIEW WR-01 + T-260713-2q2-01): JSON.stringify alone
// does NOT escape `<`, `>`, or `&` — a field value containing `</script>`
// would still break out of the tag. These three characters are additionally
// escaped to their unicode sequences before injection via
// dangerouslySetInnerHTML. This is the mitigation for react-doctor's
// `unsafe-json-in-html` rule, which flags raw `JSON.stringify` calls feeding
// dangerouslySetInnerHTML via static pattern-matching — react-doctor cannot
// trace through this wrapper function's escaping, so it will keep reporting
// a false positive here. DO NOT "fix" this by removing escapeForScriptTag or
// reverting to raw JSON.stringify; regression-checked by
// scripts/verify-jsonld-escape.mjs.
function escapeForScriptTag(json: string): string {
  return json.replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
}

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: escapeForScriptTag(JSON.stringify(data)) }}
    />
  )
}
