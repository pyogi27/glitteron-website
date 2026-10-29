/**
 * A wa.me click-to-chat link with a prefilled message.
 *
 * wa.me wants the number as bare digits with the country code, so formatting
 * like COMPANY.phone's '+91 97278 00808' is stripped. A number that comes out
 * empty or the wrong length throws: wa.me with no number opens WhatsApp's
 * share picker instead of our chat, which would fail silently for a customer.
 */
export function waMeUrl(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, '')
  // E.164 allows at most 15 digits; 8 is a safe floor for country code + number.
  if (!/^\d{8,15}$/.test(digits)) throw new Error(`waMeUrl: not a phone number: "${phone}"`)
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

/** Prefilled text for the site-wide chat entry points (floating button, footer link). */
export const WHATSAPP_MESSAGE = "Hi LitMeUp, I'd like help choosing a light."
