/**
 * Renders a JSON-LD block. Schema objects are built server-side from our own
 * data, never from user input, so stringifying into the script is safe — but we
 * escape `<` anyway so a stray sequence in a product description cannot close
 * the script tag early.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
