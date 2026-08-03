import type { Metadata } from 'next'
import Link from 'next/link'
import LegalPage, {
  Bullets,
  COMPANY,
  ContactBlock,
  Section,
  type SectionSpec,
} from '@/components/legal/LegalPage'

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'The terms governing your use of the LitMeUp website — site access and licence, content you submit, disclaimers, liability, and governing law.',
  alternates: { canonical: '/terms' },
}

const SECTIONS: SectionSpec[] = [
  { id: 'general', title: 'General' },
  { id: 'privacy-notice', title: 'Privacy notice' },
  { id: 'product-policy', title: 'Product policy' },
  { id: 'license', title: 'Licence and site access' },
  { id: 'content-you-submit', title: 'Content you submit' },
  { id: 'links', title: 'Links' },
  { id: 'disclaimers', title: 'Disclaimers' },
  { id: 'liability', title: 'Limitation of liability' },
  { id: 'indemnities', title: 'Indemnities' },
  { id: 'electronic-communications', title: 'Electronic communications' },
  { id: 'password-areas', title: 'Password-protected areas' },
  { id: 'trademarks', title: 'Trademarks and copyrights' },
  { id: 'ip-claims', title: 'IP infringement claims' },
  { id: 'assignment', title: 'Assignment' },
  { id: 'entire-agreement', title: 'Entire agreement' },
  { id: 'governing-law', title: 'Governing law' },
  { id: 'severability', title: 'Severability' },
  { id: 'contact', title: 'Contact us' },
]

const PROHIBITED_USES = [
  `Any downloading, copying or other use of the content or the Site for purposes competitive to ${COMPANY.name} or for the benefit of another vendor or any third party;`,
  'Any caching, unauthorised linking to the Site or the framing of any content available on the Site;',
  'Any modification, distribution, transmission, performance, broadcast, publication, uploading, licensing, reverse engineering, transfer or sale of, or the creation of derivative works from, any content, products or services obtained from the Site that you do not have a right to make available (such as the intellectual property rights of another party);',
  'Any uploading, posting or transmitting of any material that contains software viruses or any other computer code, files or programs designed to interrupt, destroy or limit the functionality of any computer;',
  'Using any hardware or software intended to surreptitiously intercept or otherwise obtain any information (such as system data or personal information) from the Site (including, but not limited to the use of any “scraping” or other data mining techniques, robots or similar data gathering and extraction tools); or',
  `Any action that imposes or may impose (in ${COMPANY.name}’s sole discretion) an unreasonable or disproportionately large load on ${COMPANY.name}’s infrastructure, or damage or interfere with the proper working of our systems.`,
]

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      intro="The terms that govern your use of this site, your membership, and any products or services you purchase through it."
      sections={SECTIONS}
    >
      <Section id="general" title="General">
        <p>
          These Terms of Use have been executed and delivered by you and constitute a valid and
          binding agreement between you and {COMPANY.name}, enforceable against you in accordance
          with their terms. You represent that (1) you are at least 18 years of age, (2) you are not
          incapacitated to form a binding contract, (3) in case you are registering as a member on
          behalf of a corporate body, you represent that you have the requisite authority to bind
          such corporate body, and (4) that all of the information, data and other materials you
          provide on this Site or to {COMPANY.name} through any other means are true, accurate,
          current and complete. You are responsible for updating and correcting the information you
          have provided on this Site, as appropriate.
        </p>
        <p>
          You shall establish and use your membership on the Site, and purchase and use the products
          and services available through the Site in strict compliance with these Terms of Use and
          all applicable policies, laws, rules and regulations. All calls, emails and other
          communications between you and {COMPANY.name} may be recorded.
        </p>
      </Section>

      <Section id="privacy-notice" title="Privacy notice">
        <p>
          The Privacy Notice pertaining to the gathering, utilisation, management, revelation,
          transfer, and other handling of personal data by {COMPANY.name} can be found on our{' '}
          <Link
            href="/privacy"
            className="text-[#A8552C] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] rounded-sm"
          >
            Privacy Policy
          </Link>{' '}
          page. By utilising the Site, or by means of email, telephone, or any other method, you
          agree to the collection, storage, disclosure, transfer, and other processing of any
          personal information we may acquire about you in accordance with the terms outlined in the
          Privacy Notice. {COMPANY.name} reserves the right to periodically update its Privacy Notice
          at its own discretion and will publish an updated version of the notice at that address.
        </p>
      </Section>

      <Section id="product-policy" title="Product policy">
        <p>
          The Product Policy encompasses all aspects of your product purchases through the Site. As a
          user of the {COMPANY.name} website, it is your responsibility to maintain the
          confidentiality of your User ID and password. You are also accountable for any activities
          that occur under your User ID and password. It is essential that the personal information
          you provide during registration and when availing the services is accurate, current, and
          complete.
        </p>
        <p>
          You must ensure that your personal information is regularly updated and remains true,
          accurate, and complete at all times. If you provide any information that is untrue,
          inaccurate, not current, or incomplete, or if we have reasonable grounds to suspect so, we
          reserve the right to indefinitely suspend, terminate, or block your membership with the{' '}
          {COMPANY.name} website. In such cases, we may also refuse to provide you with access to the
          website and any of our services, present or future. Please note that any losses or disputes
          arising from the non-updation of personal and contact information will be your
          responsibility, and we will not be held liable for them.
        </p>
        <p>
          By registering on the {COMPANY.name} website, you consent to the collection, storage, and
          use of your personal information for the purpose of providing you with efficient access to
          the website and its services. Furthermore, you agree that your personal information may be
          displayed, either automatically or otherwise, when you log into your account. It is
          important to remember that your information, including personal details, is readily
          available on the {COMPANY.name} website and can only be viewed by you upon logging in.
        </p>
      </Section>

      <Section id="license" title="Licence and site access">
        <p>
          All the content accessible on this website, including but not limited to text, design,
          graphics, logos, icons, images, audio clips, downloads, interfaces, code, and software, as
          well as the arrangement and appearance of the site, is the exclusive property of{' '}
          {COMPANY.name}, its franchisees, licensors, or content providers. This content is protected
          by copyright, trademark, and other applicable Indian and foreign laws. Please note that
          accessing this website does not grant you any rights to the intellectual property of{' '}
          {COMPANY.name}, its franchisees, licensors, or content providers, except as expressly
          provided herein. However, {COMPANY.name} does provide you with a limited licence to access
          and use this site for personal purposes.
        </p>
        <p>
          Unless stated otherwise, you are permitted to access, copy, download, and print the content
          available on this site for your personal, non-commercial use. However, you must not modify
          or remove any copyright, trademark, or other proprietary notices that are present in the
          content. It is strictly prohibited to transmit, post, link, deep link, or make any
          modifications to the site without the prior express permission of {COMPANY.name}.{' '}
          {COMPANY.name}, along with its licensors and content providers, retains full ownership and
          complete title to the content available on the site, including all associated intellectual
          property rights. This content is provided to you under a limited licence, which can be
          revoked at any time at the sole discretion of {COMPANY.name}. This licence is
          non-transferable, royalty-free, and applicable worldwide.
        </p>
        <p>
          {COMPANY.name} strictly prohibits any other use of any content available through the Site,
          including but not limited to:
        </p>
        <Bullets items={PROHIBITED_USES} />
        <p>
          It is your responsibility to acquire access to the Site, which may require payment of
          third-party fees (such as charges from your Internet service provider or airtime charges).
          Furthermore, you are required to provide and be responsible for all the necessary equipment
          to access the Site. You are strictly prohibited from circumventing any measures that have
          been put in place to prevent or restrict access to this Site. Any unauthorised access to
          the Site by you (including any access or use that involves an account you have created on
          the Site or any device you use to access the Site) will result in the termination of the
          permission or licence granted to you by {COMPANY.name}.
        </p>
        <p>
          {COMPANY.name} reserves the right to refuse or cancel any person’s registration for this
          Site, remove any person from this Site and prohibit any person from using this Site for any
          reason whatsoever, and to limit or terminate your access to or use of the Site at any time
          without notice. {COMPANY.name} neither warrants nor represents that your use of the content
          available on this Site will not infringe rights of third parties not affiliated with{' '}
          {COMPANY.name}. Termination of your access or use will not waive or affect any other right
          or relief to which {COMPANY.name} may be entitled, at law or in equity.
        </p>
      </Section>

      <Section id="content-you-submit" title="Content you submit">
        <p>
          By submitting our web form, you agree to receive promotional calls on the number shared,
          and such calls and SMS would be coming from a third party platform.
        </p>
        <p>
          You acknowledge that you are responsible for any content you may submit through the Site,
          including the legality, reliability, appropriateness, originality and copyright of any such
          content. You may not upload to, host, display, modify, transmit, update, share, distribute
          or otherwise publish through this Site any content that is confidential, proprietary,
          invasive of privacy or publicity rights, infringing on patents, trademarks, copyrights, or
          other intellectual property rights, or that is unlawful, harmful, threatening, false,
          fraudulent, libelous, defamatory, obscene or otherwise objectionable.
        </p>
      </Section>

      <Section id="links" title="Links">
        <p>
          This Site may contain links to other websites or resources that are operated by third
          parties not affiliated with {COMPANY.name}. These links are provided as a convenience to
          you and as an additional avenue of access to the information contained therein. We are not
          responsible or liable for any content, advertising, products or other materials on or
          available from such sites or resources. Inclusion of links to other sites or resources
          should not be viewed as an endorsement of the content of linked sites or resources.
          Different terms and conditions and privacy policies may apply to your use of any linked
          sites or resources. {COMPANY.name} is not responsible or liable, directly or indirectly,
          for any damage, loss or liability caused or alleged to be caused by or in connection with
          any use of or reliance on any such content, products or services available on or through
          any such linked site or resource.
        </p>
      </Section>

      <Section id="disclaimers" title="Disclaimers">
        <p>
          With the exception of any provisions explicitly stated in these Terms of Use or mandated by
          applicable law, {COMPANY.name} does not make any representations, promises, or guarantees,
          and does not offer any other terms, whether expressed or implied, concerning any matter.
          This includes, but is not limited to, the merchantability, suitability, fitness for a
          specific use or purpose, or non-infringement of {COMPANY.name} membership, any content on
          the site, or any products or services purchased through the site. Additionally, there are
          no warranties implied from a course of performance or course of dealing.
        </p>
        <p>
          Your utilisation of this website is entirely at your own risk. The website is provided on
          an “as is” and “as available” basis. We retain the right to limit or terminate your access
          to the website or any of its features or components at any given time. {COMPANY.name}{' '}
          disclaims any warranties regarding uninterrupted or error-free access to the website, the
          security of the website, the absence of viruses on the website or the server that makes it
          available, and the correctness, accuracy, adequacy, usefulness, timeliness, reliability, or
          completeness of the information on the website. If you choose to download any content from
          this website, you do so at your own discretion and risk. You will be solely responsible for
          any damage to your computer system or loss of data that may result from the download of
          such content. No advice or information obtained from the website shall create any warranty
          of any kind.
        </p>
      </Section>

      <Section id="liability" title="Limitation of liability">
        <p className="uppercase text-[13px] leading-[1.9] tracking-[0.01em]">
          You acknowledge and agree that {COMPANY.name} provides the Site and the products and
          services. {COMPANY.name} is not liable for the acts, errors, omissions, representations,
          warranties, breaches or negligence of any such products or services for any personal
          injuries, death, property damage, or other damages or expenses resulting therefrom.
        </p>
        <p className="uppercase text-[13px] leading-[1.9] tracking-[0.01em]">
          You acknowledge and agree that you assume full responsibility for your use of the Site
          and/or for use of the Site’s membership, communications with third parties, and purchase
          and use of the products and services available through the Site. With respect to third
          party user generated content, {COMPANY.name} neither originates nor initiates any
          transmission on the Site nor selects the sender and receiver of a transmission nor selects
          nor modifies the information contained in a transmission. {COMPANY.name} has no control
          over the third party user generated content in the Site and acts as an “intermediary” as
          understood in terms of the Information Technology Act, 2000 with respect to all third party
          user generated content.
        </p>
        <p className="uppercase text-[13px] leading-[1.9] tracking-[0.01em]">
          You acknowledge and agree that any information you send or receive during your membership
          and/or use of the Site may not be secure and may be intercepted by unauthorised parties.
          You acknowledge and agree that your use of the Site is at your own risk and that the Site
          is made available to you at no charge. Recognising such, you acknowledge and agree that, to
          the fullest extent permitted by applicable law, neither {COMPANY.name} nor its licensors,
          suppliers or third party content providers will be liable for any direct, indirect,
          punitive, exemplary, incidental, special, consequential or other damages arising out of or
          in any way related to (1) this Site, or any other site or resource you access through a
          link from this Site; (2) any action we take or fail to take as a result of communications
          you send to us; (3) your {COMPANY.name} membership, any termination or cancellation of your
          membership, any referral credit program (or associated credits); (4) any products or
          services made available or purchased through the Site; (5) any fraudulent act committed by
          any person using the Site which may or may not involve financial transactions, including
          any damages or injury arising from any use of such products or services; (6) any delay or
          inability to use the Site or any information, products or services advertised in or
          obtained through the Site; or (7) the modification, removal or deletion of any content
          submitted to the Site.
        </p>
      </Section>

      <Section id="indemnities" title="Indemnities">
        <p>
          You will indemnify and hold harmless {COMPANY.name}, its licensees, subsidiaries,
          affiliates, and their employees, directors, officers, agents and representatives
          (“Indemnified Parties”) from and against any and all fines, penalties, liabilities, losses
          and other damages of any kind whatsoever (including attorneys’ and experts’ fees), incurred
          by such Indemnified Parties, and shall defend such Indemnified Parties against any and all
          claims arising out of (1) your breach of these Terms of Use, Privacy Notice, Product Policy
          and all other policies applicable to you by virtue of using this Site or any other{' '}
          {COMPANY.name} websites; (2) fraud you commit, or your intentional misconduct or gross
          negligence; or (3) your violation of any applicable laws or the rights of a third party.
          The Indemnified Parties will control the defence of any claim to which this indemnity may
          apply, and in any event, you shall not settle any claim without the prior written approval
          of the Indemnified Parties.
        </p>
      </Section>

      <Section id="electronic-communications" title="Electronic communications">
        <p>
          When you use the Site or send emails to {COMPANY.name}, you are communicating with{' '}
          {COMPANY.name} electronically. You consent to receive electronically any communications
          related to your use of this Site. {COMPANY.name} will communicate with you by email or by
          posting notices on this Site. Please refer to the Privacy Notice to opt out of
          communication that you may not desire to receive from {COMPANY.name}. You agree that all
          agreements, notices, disclosures and other communications that are provided to you
          electronically satisfy any legal requirement that such communications be in writing. All
          notices from {COMPANY.name} intended for receipt by a customer shall be deemed delivered
          and effective when sent to the email address you provide on the Site.
        </p>
      </Section>

      <Section id="password-areas" title="Access to password-protected areas of the site">
        <p>
          Access to and use of password-protected areas of the Site is restricted to authorised users
          only. You are responsible for protecting your login credentials, including any password.
          You agree that you will be responsible for any and all statements made, and acts or
          omissions that occur, through the use of your login credentials. If you have any reason to
          believe or become aware of any loss, theft or unauthorised use of your login credentials,
          notify {COMPANY.name} immediately. {COMPANY.name} may assume that any communications we
          receive from your email or other address, or communications that are associated with your
          login credentials or your account on this Site, have been made by you unless we receive
          notice indicating otherwise.
        </p>
      </Section>

      <Section id="trademarks" title="Trademarks and copyrights">
        <p>
          The Marks displayed on the Site, including trademarks, logos, design marks, and service
          marks, are the exclusive property of {COMPANY.name}, its licensors, content providers, or
          other parties. Any use of these Marks by users or any other parties, including as meta tags
          on other pages or sites, is strictly prohibited without the written permission of{' '}
          {COMPANY.name} or the respective third party that owns the Marks. Additionally, you are not
          allowed to enclose any content from the Site using frames or framing techniques without the
          express written consent of {COMPANY.name}. Furthermore, the use of any Site content,
          including software programs, in meta tags or any other hidden text techniques or
          technologies, is strictly prohibited without {COMPANY.name}’s express written consent.
          Please note that all content available on or through the Site is protected by copyright,
          trademark, and other applicable laws.
        </p>
      </Section>

      <Section id="ip-claims" title="Claims of intellectual property infringement">
        <p>
          {COMPANY.name} respects the intellectual property rights of others, and we ask our users to
          do the same. You are hereby informed that {COMPANY.name} has adopted and reasonably
          implemented a policy that provides for the termination in appropriate circumstances of
          website users or {COMPANY.name} members who are repeat copyright infringers.
        </p>
        <p>
          {COMPANY.name} may, in appropriate circumstances and at its discretion, disable and/or
          terminate the accounts and/or memberships of users who may be infringing the intellectual
          property of a third party. If you believe that your work has been copied in a way that
          constitutes copyright infringement, or your intellectual property rights have been
          otherwise violated, please contact us at{' '}
          <a
            href={`mailto:${COMPANY.email}`}
            className="text-[#A8552C] no-underline hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A8552C] rounded-sm"
          >
            {COMPANY.email}
          </a>
          . {COMPANY.name} may update this contact information from time to time without notice to
          you. We will post the current contact information on this Site.
        </p>
      </Section>

      <Section id="assignment" title="Assignment">
        <p>
          You may not assign these Terms of Use (or any rights, benefits or obligations hereunder) by
          operation of law or otherwise without the prior written consent of {COMPANY.name}, which
          may be withheld at {COMPANY.name}’s sole discretion. Any attempted assignment that does not
          comply with these Terms of Use shall be null and void. {COMPANY.name} may assign these
          Terms of Use, in whole or in part, to any third party in its sole discretion.
        </p>
      </Section>

      <Section id="entire-agreement" title="Entire agreement">
        <p>
          These Terms of Use constitute the entire agreement between you and {COMPANY.name} regarding
          the specific matters herein, and all prior agreements, letters, proposals, discussions and
          other documents regarding the matters herein are superseded and merged into these Terms of
          Use.
        </p>
      </Section>

      <Section id="governing-law" title="Governing law and dispute resolution">
        <p>
          These Terms of Use shall be governed by the laws of India without reference to conflict of
          laws principles. The courts in Surat, Gujarat would have the exclusive jurisdiction in any
          proceedings that arise out of these Terms of Use.
        </p>
      </Section>

      <Section id="severability" title="Severability">
        <p>
          Each of the provisions of these Terms of Use is severable. If any provision of these Terms
          of Use (or part of a provision) is found by any court of competent jurisdiction to be
          invalid, unenforceable or illegal, the other provisions shall remain in force. If any
          invalid, unenforceable or illegal provision would be valid, enforceable or legal if some
          part of it were deleted or modified, the provision shall apply with whatever modification
          is necessary to give effect to these Terms of Use.
        </p>
      </Section>

      <ContactBlock />
    </LegalPage>
  )
}
