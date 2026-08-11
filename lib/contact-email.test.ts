// Run: node --test lib/contact-email.test.ts
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildEnquiryEmail } from './contact-email.ts'

const SENDER = { name: 'LitMeUp', email: 'info@litmeup.in', site: 'www.litmeup.in' }

const payload = {
  name: 'Asha Mehta',
  email: 'asha@example.com',
  phone: '+91 98250 12345',
  topic: 'Bulk order',
  message: 'Do you supply chandeliers for a 40-room hotel?',
}

test('sends from and to the company inbox, replies to the enquirer', () => {
  const mail = buildEnquiryEmail(payload, SENDER)

  assert.equal(mail.FromEmailAddress, 'LitMeUp Website <info@litmeup.in>')
  assert.deepEqual(mail.Destination.ToAddresses, ['info@litmeup.in'])
  assert.deepEqual(mail.ReplyToAddresses, ['asha@example.com'])
})

test('subject carries the topic and name; body carries every field', () => {
  const { Subject, Body } = buildEnquiryEmail(payload, SENDER).Content.Simple

  assert.ok(Subject.Data.includes('Bulk order'))
  assert.ok(Subject.Data.includes('Asha Mehta'))

  for (const value of Object.values(payload)) {
    assert.ok(Body.Text.Data.includes(value), `body is missing: ${value}`)
  }
})

test('falls back when optional fields are blank', () => {
  const { Subject, Body } = buildEnquiryEmail(
    { ...payload, phone: '', topic: '' },
    SENDER,
  ).Content.Simple

  assert.ok(Subject.Data.includes('General'))
  assert.ok(Body.Text.Data.includes('Phone:   —'))
})
