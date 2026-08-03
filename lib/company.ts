/**
 * Single source of truth for business contact details.
 *
 * These appear on the contact page, every policy page and in the Organization
 * schema. They used to be duplicated per file and had drifted apart (two
 * different emails, two phone numbers, two cities), so anything user-facing
 * should read from here rather than hardcoding a value.
 */
export const COMPANY = {
  name: 'LitMeUp',
  site: 'www.litmeup.in',
  email: 'info@litmeup.in',
  phone: '+91 99793 40909',
  /** E.164-ish, for tel: links. */
  phoneHref: 'tel:+919979340909',
  city: 'Surat, Gujarat',
  address:
    '69 Jalaram Industrial Estate, Navjivan Circle, Udhana Magdalla Road, Surat, Gujarat 395007',
} as const
