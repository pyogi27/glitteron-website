import type { Metadata } from 'next'
import LegalPage, {
  Bullets,
  COMPANY,
  ContactBlock,
  KeyFacts,
  Section,
  type SectionSpec,
} from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description:
    'Free shipping across India on every LitMeUp order, delivered in 5 to 7 days by registered courier partners with email tracking.',
  alternates: { canonical: '/shipping' },
}

const SECTIONS: SectionSpec[] = [
  { id: 'delivery', title: 'Delivery' },
  { id: 'payment-methods', title: 'Payment methods' },
  { id: 'contact', title: 'Contact us' },
]

const DELIVERY = [
  'We extend free shipping to all orders placed with us.',
  'The items are sent to the delivery location that is registered during the checkout process.',
  'The items will be dispatched and arrive at your doorstep within a span of 5 to 7 days.',
  'After the shipment has been dispatched, the tracking number and shipping agency information will be provided to you via email.',
]

const PAYMENT = [
  'We welcome all major credit and debit cards, such as Mastercard, Visa, and American Express.',
  'We offer various Net Banking options from major banks, as well as recognised Wallet and UPI options.',
]

export default function ShippingPage() {
  return (
    <LegalPage
      title="Shipping Policy"
      intro="We use registered and reliable courier partners to deliver orders throughout India."
      sections={SECTIONS}
    >
      <Section id="delivery" title="Delivery">
        <KeyFacts
          facts={[
            { value: 'Free', label: 'Shipping' },
            { value: '5–7 days', label: 'Delivery' },
            { value: 'All India', label: 'Coverage' },
          ]}
        />
        <p>
          We utilise registered and reliable courier partners to deliver orders throughout India.
        </p>
        <Bullets items={DELIVERY} />
      </Section>

      <Section id="payment-methods" title="Payment methods">
        <Bullets items={PAYMENT} />
      </Section>

      <ContactBlock />
    </LegalPage>
  )
}
