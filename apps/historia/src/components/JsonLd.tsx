/**
 * Renders schema.org data as a JSON-LD script tag.
 *
 * `<` is escaped so a string value containing `</script>` cannot close the tag early.
 */
export function JsonLd({ data }: Readonly<{ data: object }>) {
  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: serialised JSON with `<` escaped, not HTML
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replaceAll('<', '\\u003c') }}
    />
  );
}
