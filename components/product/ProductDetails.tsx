// components/product/ProductDetails.tsx
import type { Product } from '@/lib/types'

/**
 * Key features, description and specifications, directly under the buy controls. Native
 * <details>: no state, keyboard and screen-reader support for free, and collapsed
 * content still ships in the server HTML, so crawlers see the specs either way.
 *
 * Most of the catalogue has no description, so that section is omitted rather than
 * padded, and specifications open by default in its place.
 */
export default function ProductDetails({ product }: { product: Product }) {
  const description = product.description?.trim()
  const specs = Object.entries(product.specs)

  return (
    <div className="border-t border-[#D8D0C4] mb-7">
      {product.keyFeatures && (
        <Section title="Key Features" open>
          {/* Sanitized in lib/api/server.ts (lib/keyFeatures.ts allowlist); never pass raw API HTML here. */}
          <div
            className="text-[13.5px] leading-[1.9] text-[#4A4540] [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ol]:list-decimal [&_ul,&_ol]:pl-5 [&_ul,&_ol]:mb-2 [&_li]:pl-1 [&_li::marker]:text-[#C4714A] [&_h2,&_h3]:font-serif [&_h2]:text-[17px] [&_h3]:text-[15px] [&_h2,&_h3]:text-[#2C2825] [&_h2,&_h3]:mt-3 [&_h2,&_h3]:mb-1 [&_strong,&_b]:font-semibold [&_strong,&_b]:text-[#2C2825] [&_a]:underline [&_a]:underline-offset-2 [&_a]:text-[#8B5E3C] [&_a:hover]:text-[#C4714A]"
            dangerouslySetInnerHTML={{ __html: product.keyFeatures }}
          />
        </Section>
      )}
      {description && (
        <Section title="Description" open>
          <p className="text-[13.5px] leading-[1.9] text-[#4A4540]">{description}</p>
        </Section>
      )}
      <Section title="Specifications" open={!description}>
        {specs.length > 0 ? (
          <dl>
            {specs.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 text-[12.5px] py-2.5 border-b border-[#D8D0C4] last:border-b-0">
                <dt className="text-[#A09488]">{k}</dt>
                <dd className="text-[#2C2825] text-right max-w-[60%]">{v}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-[13.5px] leading-[1.9] text-[#A09488] italic">
            Full specifications for this piece aren&apos;t published yet. The size and
            finish options above are accurate, and the SKU will get you an exact answer
            on dimensions and wattage from our team.
          </p>
        )}
      </Section>
    </div>
  )
}

function Section({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details open={open} className="group border-b border-[#D8D0C4]">
      <summary className="flex items-center justify-between min-h-12 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-[11px] font-semibold tracking-[0.14em] uppercase text-[#2C2825] hover:text-[#8B5E3C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C4714A]">
        {title}
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="w-4 h-4 stroke-current fill-none transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
          strokeWidth={1.6}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className="pb-5">{children}</div>
    </details>
  )
}
