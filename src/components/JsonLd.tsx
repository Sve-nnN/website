export function JsonLd({ data }: { data: Record<string, unknown> }) {
  // SECURITY (T-02-02, script-injection mitigation): JSON.stringify is used
  // to serialize the script body — never raw string concatenation of field
  // values, which would allow a crafted content field (e.g. a title
  // containing `</script>`) to break out of the JSON-LD block.
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
