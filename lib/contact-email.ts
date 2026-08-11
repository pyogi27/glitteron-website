export interface ContactPayload {
  name: string
  email: string
  phone: string
  topic: string
  message: string
}

export interface EmailSender {
  name: string
  email: string
  site: string
}

/**
 * Shapes a validated contact enquiry into SES `SendEmailCommand` input.
 *
 * The sender is passed in rather than imported so this stays a dependency-free
 * pure function that `node --test lib/contact-email.test.ts` can run directly.
 * Callers pass `COMPANY` from `lib/company.ts` — still the single source.
 *
 * Sent from and to info@litmeup.in with the enquirer as reply-to, so replying
 * from the inbox thread reaches the customer directly.
 */
export function buildEnquiryEmail(payload: ContactPayload, sender: EmailSender) {
  const topic = payload.topic || 'General'

  const body = [
    `Name:    ${payload.name}`,
    `Email:   ${payload.email}`,
    `Phone:   ${payload.phone || '—'}`,
    `Topic:   ${topic}`,
    '',
    payload.message,
    '',
    `— Sent from the contact form at ${sender.site}`,
  ].join('\n')

  return {
    FromEmailAddress: `${sender.name} Website <${sender.email}>`,
    Destination: { ToAddresses: [sender.email] },
    ReplyToAddresses: [payload.email],
    Content: {
      Simple: {
        Subject: { Data: `New enquiry (${topic}) — ${payload.name}` },
        Body: { Text: { Data: body } },
      },
    },
  }
}
