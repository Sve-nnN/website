// SECURITY (T-02-02 + 22-REVIEW WR-01): JSON.stringify alone does NOT escape
// `<`, `>`, or `&` — a field value containing `</script>` would still break
// out of the tag. These three characters are additionally escaped to their
// unicode sequences before injection.
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
