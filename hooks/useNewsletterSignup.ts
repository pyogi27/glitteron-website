'use client'
import { useState } from 'react'

/**
 * Newsletter signup shared by the home strip and the footer. It used to be
 * `if (email) setSubmitted(true)` — no request at all, so every visitor was told
 * they had subscribed and nothing was ever stored. Post for real and report
 * failure honestly; a form that lies is worse than one that admits it is down.
 */
export function useNewsletterSignup() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    setError('')
    setPending(true)
    try {
      const res = await fetch('/api/website/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error(String(res.status))
      setSubmitted(true)
    } catch {
      setError("We couldn't sign you up just now. Please try again in a moment.")
    } finally {
      setPending(false)
    }
  }

  return { email, setEmail, submitted, error, pending, submit }
}
