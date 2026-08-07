import { COMPANY } from '@/lib/company'

/**
 * Every answer here restates a fact published elsewhere on the site
 * (/shipping, /returns, /about, product pages) in a question shape.
 *
 * Two audiences: shoppers, and the answer engines that quote a page rather
 * than rank it. Both want the fact in the first sentence, so each answer
 * leads with the number and explains after — never the other way round.
 *
 * If a policy changes, change it here and on the policy page together.
 */
export interface FaqItem {
  question: string
  answer: string
}

export interface FaqGroup {
  /** Anchor id for the section index. */
  id: string
  title: string
  items: FaqItem[]
}

export const FAQ_GROUPS: FaqGroup[] = [
  {
    id: 'shipping',
    title: 'Shipping & delivery',
    items: [
      {
        question: 'Does LitMeUp ship free across India?',
        answer:
          'Yes. Shipping is free on every LitMeUp order, anywhere in India, with no minimum order value. Orders go out through registered courier partners to the address entered at checkout.',
      },
      {
        question: 'How long does delivery take?',
        answer:
          'Orders arrive within 5 to 7 days of dispatch. Once the shipment leaves the workshop you get the tracking number and the courier partner’s details by email.',
      },
      {
        question: 'Do you deliver outside India?',
        answer:
          'Not currently. LitMeUp ships within India only. For an enquiry from outside India, write to ' +
          COMPANY.email +
          ' and we will tell you what is possible.',
      },
      {
        question: 'How do I track my order?',
        answer:
          'Tracking details are emailed as soon as the order is dispatched. If you ordered with an account, the same details sit on your My Orders page.',
      },
    ],
  },
  {
    id: 'returns',
    title: 'Returns, exchanges & cancellations',
    items: [
      {
        question: 'What is the return window?',
        answer:
          'You have 7 days from receiving the product to raise a return. A no-questions return carries a 15% re-stocking fee on the invoiced MRP, and the fixture must come back uninstalled and unused in its original packaging with tags, manual, warranty card and invoice.',
      },
      {
        question: 'How long does a refund take?',
        answer:
          'Refunds are processed within 5 to 7 business days of the item reaching us in good condition. A credit note for returned items in perfect condition can take up to three business days to issue.',
      },
      {
        question: 'What if my light arrives damaged or wrong?',
        answer:
          'Tell us within 24 hours of delivery, by email at ' +
          COMPANY.email +
          ' or by phone at ' +
          COMPANY.phone +
          ', and the replacement ships within 3 days of the product reaching us. Reported after 24 hours, we cannot guarantee a replacement.',
      },
      {
        question: 'Can I cancel or change an order?',
        answer:
          'A confirmed order cannot be cancelled, but within 24 hours and before dispatch you can modify it by adding products of equal or greater value. Call ' +
          COMPANY.phone +
          ' or email ' +
          COMPANY.email +
          ' with the change.',
      },
    ],
  },
  {
    id: 'products',
    title: 'Products & installation',
    items: [
      {
        question: 'What does the LitMeUp warranty cover?',
        answer:
          'Every fixture carries a 5-year warranty against manufacturing defects. Keep the warranty card that ships in the box — it is needed for a claim.',
      },
      {
        question: 'Are LitMeUp lights dimmable?',
        answer:
          'Our fixtures are designed dimmable as standard, with warm colour temperatures and glare-controlled diffusers. Check the specifications tab on the product page for the exact wattage and fitting of the piece you are looking at, or ask us with the SKU.',
      },
      {
        question: 'Do you handle installation?',
        answer:
          'Installation is not included. Fixtures ship ready for a qualified electrician, packed in moulded pulp and insured in transit. Note that a return is only accepted if the product has not been installed.',
      },
      {
        question: 'Which chandelier size suits my room?',
        answer:
          'A common starting point is to add the room’s length and width in feet and treat that number in inches as the fixture diameter — a 12 ft by 14 ft living room suits roughly a 26-inch chandelier. Over a dining table, aim for a fixture about half to two-thirds the table width, hung 30 to 36 inches above it. Our room visualizer lets you see a fixture in a photo of your own room before you decide.',
      },
      {
        question: 'What are the lights made of?',
        answer:
          'Brass, hand-blown glass and solid steel rather than plated shortcuts. Each fixture passes a metalworker, a glass finisher and a quality lead before it ships, and the catalogue spans over 500 designs across twelve finishes.',
      },
    ],
  },
  {
    id: 'orders',
    title: 'Ordering & payment',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer:
          'Mastercard, Visa and American Express credit and debit cards, net banking from the major banks, plus recognised UPI and wallet options.',
      },
      {
        question: 'Do I need an account to order?',
        answer:
          'No. You can check out as a guest. An account keeps your order history, wishlist and saved visualizer rooms in one place, and lets you cancel eligible orders yourself.',
      },
      {
        question: 'Where is LitMeUp based?',
        answer:
          'LitMeUp designs and assembles its lighting in Surat, Gujarat, at ' +
          COMPANY.address +
          '. We sell direct rather than through dealers, which is why there is no showroom markup on the price.',
      },
    ],
  },
]

export const FAQ_ITEMS: FaqItem[] = FAQ_GROUPS.flatMap(g => g.items)
