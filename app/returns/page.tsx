import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, {
  Bullets,
  COMPANY,
  ContactBlock,
  KeyFacts,
  Section,
  type SectionSpec,
} from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Cancellation, Return & Exchange',
  description:
    'How to return, exchange or cancel a LitMeUp order — return windows, condition requirements, refund timelines and how to reach us.',
  alternates: { canonical: '/returns' },
}

const SECTIONS: SectionSpec[] = [
  { id: 'returns', title: 'Returns' },
  { id: 'exchange', title: 'Exchange' },
  { id: 'cancellation', title: 'Cancellation' },
  { id: 'contact', title: 'Contact us' },
]

const RETURNS = [
  `In the event that you wish to initiate a product return without any inquiries, ${COMPANY.name} will apply a re-stocking fee of 15% based on the invoiced MRP.`,
  `Kindly reach out to us via email at ${COMPANY.email} or by phone at ${COMPANY.phone}, and we will promptly respond within 24 hours upon receiving your request.`,
  'A return request can only be made within 7 days of receiving the product. It is necessary to return the products in their original packaging, including the price tags, barcodes, labels, user manual, warranty card, invoices, and any other accompanying items. Please drop off the product(s) at the nearest store or warehouse.',
  `The installation of the product should have been avoided, or the product(s) should be free from any signs of usage. The returned items will undergo thorough examination and scrutiny by ${COMPANY.name} to ascertain the authenticity of the return.`,
  'Products that are returned in a damaged state will not be eligible for a refund.',
  'The refund processing time is between 5 and 7 business days upon receiving the item in good condition. It may require a maximum of three business days to issue a credit note for the returned items in perfect condition.',
]

const EXCHANGE_CONDITIONS = [
  `Please notify ${COMPANY.name} of receipt of a damaged, defective or incorrect product within 24 hours of delivery to you. If you are unable to do so within 24 hours, ${COMPANY.name} shall not be held liable for the failure to replace the order.`,
  'Products should be unused.',
  `${COMPANY.name} will coordinate the collection of the damaged, defective, or incorrect product with its logistics partner. In the event that ${COMPANY.name} is unable to arrange the pick-up, you will be informed and instructed to send the product through a reputable courier in your area within one day of receiving the notification. The courier freight charges will be reimbursed in a manner determined by the logistics team in consultation with ${COMPANY.name}.`,
  'Products must be returned in their original packaging, accompanied by the original price tags, barcodes, labels, user manual, warranty card, and invoices, among other necessary items.',
  'It is recommended to ensure that the return packets are securely and sufficiently packaged to prevent any additional product damage during transportation.',
  `The legitimacy of the complaint will be determined by ${COMPANY.name} through verification and checks of the returned products. In the event that the claim is found to be illegitimate, you will be responsible for bearing the shipping costs of the product.`,
  `Upon receipt of the product by ${COMPANY.name}, the replacement item will be promptly sent to you within a span of 3 days.`,
]

export default function ReturnsPage() {
  return (
    <LegalPage
      title="Cancellation, Return & Exchange"
      intro="Return windows, condition requirements, refund timelines and how to reach us if something arrives wrong."
      sections={SECTIONS}
    >
      <Section id="returns" title="Returns">
        <KeyFacts
          facts={[
            { value: '7 days', label: 'Return window' },
            { value: '15%', label: 'Re-stocking fee' },
            { value: '5–7 days', label: 'Refund time' },
          ]}
        />
        <Bullets items={RETURNS} />
      </Section>

      <Section id="exchange" title="Exchange">
        <p>
          If you have encountered a product that is damaged, defective, or incorrect, kindly contact
          our customer service via email at{' '}
          <a
            href={`mailto:${COMPANY.email}`}
            className="text-[#A8552C] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] rounded-sm"
          >
            {COMPANY.email}
          </a>{' '}
          within 24 hours of receiving the item. Microscopic imperfections that are undetectable upon
          installation will not be accommodated.
        </p>
        <p>
          Upon receipt of your complaint, {COMPANY.name} will proceed to authenticate and assess the
          nature of the complaint. If {COMPANY.name} determines that the complaint is valid,{' '}
          {COMPANY.name} will then commence the replacement procedure.
        </p>
        <p>
          To facilitate the product exchange process, it is necessary for you to adhere to the
          conditions outlined below:
        </p>
        <Bullets items={EXCHANGE_CONDITIONS} />
      </Section>

      <Section id="cancellation" title="Cancellation">
        <p>
          Once a confirmation has been made, it is not possible to cancel an order. However, within a
          24-hour timeframe and as long as the order has not been shipped, it is permissible to make
          modifications to the order by adding products of equal or greater value.
        </p>
        <p>
          If you wish to make changes to your order (within 24 hours) prior to shipment, kindly
          contact our customer service hotline at{' '}
          <a
            href={COMPANY.phoneHref}
            className="text-[#A8552C] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] rounded-sm"
          >
            {COMPANY.phone}
          </a>{' '}
          or alternatively, you may send an email to{' '}
          <a
            href={`mailto:${COMPANY.email}`}
            className="text-[#A8552C] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] rounded-sm"
          >
            {COMPANY.email}
          </a>{' '}
          providing the updated product information including the name, colour, price, and size.
        </p>
        <p>
          Please cancel your order from your{' '}
          <Link
            href="/orders"
            className="text-[#A8552C] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] rounded-sm"
          >
            My Orders
          </Link>{' '}
          page if you already have an account. If you don’t, please contact us by email at{' '}
          <a
            href={`mailto:${COMPANY.email}`}
            className="text-[#A8552C] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] rounded-sm"
          >
            {COMPANY.email}
          </a>
          .
        </p>
      </Section>

      <ContactBlock />
    </LegalPage>
  )
}
