import type { Metadata } from 'next'
import LegalPage, {
  Bullets,
  COMPANY,
  ContactBlock,
  Section,
  type SectionSpec,
} from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How LitMeUp collects, uses, shares and protects your personal information, and the choices you can make about it.',
  alternates: { canonical: '/privacy' },
}

const SECTIONS: SectionSpec[] = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'information-we-collect', title: 'Information we collect' },
  { id: 'how-we-use', title: 'How we use the information' },
  { id: 'online-advertising', title: 'Online advertising' },
  { id: 'information-we-share', title: 'Information we share' },
  { id: 'contact', title: 'Contact us' },
]

const INFORMATION_WE_COLLECT = [
  'Your contact information (such as name, social handle, postal and email address, or phone number)',
  'Contact information of friends or other people you would like us to contact',
  'Username and password for the account you may establish on our sites',
  'Your billing address',
  'Your shipping information (including the shipping address and phone number) or shipping information of other people to whom purchases have been shipped at your request',
  'Demographic information (such as age, date of birth, and gender)',
  'Information you provide by interacting with us through social media, including photographs',
  'Location information, such as the real-time geographic location of the device on which you install our mobile applications',
  'Shopping behaviour and preferences, and a record of the purchases you make on our websites and product searches conducted by you',
  'Other details that you may submit to us or that may be included in the information provided to us by third parties (e.g., updated delivery addresses provided by our carriers)',
]

const HOW_WE_USE = [
  'Register you for membership at our websites, and manage and maintain your account on the sites',
  'Provide products or services you request',
  'Process, validate, confirm, verify, deliver and track your purchases (including by processing payment card transactions, arranging shipping and handling returns and refunds, and contacting you about your orders, including by telephone)',
  'Maintain a record of the purchases you make on our sites',
  'Respond to your questions and comments and provide customer support',
  'Communicate with you about our products, services, offers, events and promotions, and offer you products and services we believe may be of interest to you',
  'Enable you to communicate with us through our blogs, social networks and other interactive media',
  'Publish your testimonials about LitMeUp, including on our websites and blogs, and on social networks (if we choose to publish your testimonial, we will include only your first name, last initial, city and state)',
  'Manage your participation in our events and other promotions',
  'Tailor our products and services to suit your personal interests and the manner in which visitors use our sites, applications, and social media assets',
  'Operate, evaluate and improve our business and the products and services we offer',
  'Analyse and enhance our marketing communications and strategies (including by identifying when emails sent to you have been received and read)',
  'Analyse trends and statistics regarding visitors’ use of our sites, mobile applications, and social media assets, and the purchases visitors make on our sites',
  'Protect against and prevent fraud, unauthorised transactions, claims, and other liabilities, and manage risk exposure, including by identifying potential hackers and other unauthorised users',
  'Enforce our Website Terms of Use and Product Policies',
  'Comply with applicable legal requirements and industry standards and our policies',
]

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="How we collect, use, share and protect your personal information — and the choices you can make about it."
      sections={SECTIONS}
    >
      <Section id="introduction" title="Introduction">
        <p>
          The website {COMPANY.site} is a service provided by {COMPANY.name}, which has its
          registered office at {COMPANY.address}. {COMPANY.name} and its subsidiaries and affiliates
          (collectively, “{COMPANY.name}” or “we” or “us”) respect your concerns about privacy.
        </p>
        <p>
          This Privacy Notice describes the types of personal information we collect, how we store,
          handle, and use the information, with whom we share it, and the choices you can make about
          our collection, use, and disclosure of the information. We also describe the measures we
          take to protect the security of the information and how you can contact us about our
          privacy practices.
        </p>
        <p>
          This Privacy Notice is incorporated into the Terms of Use and therefore governs your use of
          the {COMPANY.name} websites and/or any services offered by {COMPANY.name}. By visiting the{' '}
          {COMPANY.name} websites and/or utilising any services offered by {COMPANY.name}, you agree
          to and accept the then-current practices and policies governing your use of them. Further,
          by accepting this Privacy Notice, you consent to the manner of collection, handling, usage,
          disclosure, and transfer of your personal information as set out in this Privacy Notice.
          The phrase “personal information” refers to any information by which you or the device you
          are using to connect to the Internet can be identified.
        </p>
      </Section>

      <Section id="information-we-collect" title="Information we collect">
        <p>
          We may obtain personal information about you from various sources, including this website
          and other {COMPANY.name} websites. This includes any information that you may provide (i)
          while registering as a member, (ii) engaging in transactions, (iii) searching products
          and/or services, mobile applications, when you call or email us or communicate with us
          through social media, or when you participate in chats, forums, opinion polls, surveys,
          bulletin boards, discussion boards or in events or other promotions. We also may obtain
          information about you from our parent, affiliate or subsidiary companies, business
          partners, and other third parties. The types of personal information we may obtain include:
        </p>
        <Bullets items={INFORMATION_WE_COLLECT} />
        <p>
          In addition, when you visit our websites or use our mobile applications, we may collect
          certain information by automated means, such as cookies and web beacons.
        </p>
      </Section>

      <Section id="how-we-use" title="How we use the information we collect">
        <p>We may use the information we obtain about you to:</p>
        <Bullets items={HOW_WE_USE} />
        <p>
          In addition to the data uses described above, we may use the information collected through
          cookies and other automated means to uniquely identify the electronic shopping basket you
          may create on our sites and enable you to retrieve shopping baskets you previously created.
          We also may use cookies to identify and authenticate visitors.
        </p>
        <p>
          We may combine the information we collect with publicly available information and
          information we receive from our parent, affiliate, or subsidiary companies, business
          partners, and other third parties. We may use that combined information to enhance and
          personalise your shopping experience with us, to communicate with you about products,
          services, and events that may be of interest to you, for other promotional purposes, and
          for other purposes described in this section. We also may use the information we obtain
          about you in other ways for which we provide specific notice at the time of collection.
        </p>
      </Section>

      <Section id="online-advertising" title="Online advertising">
        <p>
          On our websites, we may collect information about your online activities to provide
          advertising about products and services tailored to your individual interests. You may see
          certain ads on this and other {COMPANY.name} websites because we participate in advertising
          networks. Ad networks allow us to target our advertising to users through demographic,
          behavioural, and contextual means.
        </p>
        <p>
          These networks track your online activities over time by collecting information through
          automated means, including through the use of cookies, web server logs, web beacons, and
          other methods. The networks use this information to show you advertisements for{' '}
          {COMPANY.name} and our business partners that are tailored to your individual interests.
          The information our ad network vendors collect includes information about your visits to
          websites that participate in the vendors’ advertising networks, such as the pages or
          advertisements you have viewed, and the actions you take on the sites. This data collection
          and ad targeting take place both on our websites and on third-party websites that
          participate in the ad networks. This process also helps us track the effectiveness of our
          marketing efforts.
        </p>
      </Section>

      <Section id="information-we-share" title="Information we share">
        <p>
          We do not sell or otherwise disclose personal information about you, except as described in
          this Privacy Notice. We may share the personal information we collect with our parent,
          affiliate, and subsidiary companies, business partners, franchisees, marketing agents, ad
          network vendors, and their participants, and other third parties for the purposes described
          in this Privacy Notice, including to communicate with you about products, services and
          offers.
        </p>
      </Section>

      <ContactBlock />
    </LegalPage>
  )
}
