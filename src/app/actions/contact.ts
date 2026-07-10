'use server'

import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Very small HTML-escape to prevent the submitted message from injecting
// markup into the outbound email body (T-05-12-03).
function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Server action wired as ContactFormBlock's `onSubmit` prop at the contact
 * page level (05-04's Component.tsx markup is untouched). Recipient is
 * always sourced from CONTACT_TO_EMAIL — never hardcoded here (T-05-12-01).
 */
export async function sendContactMessage(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const message = String(formData.get('message') ?? '').trim()
  // Honeypot: real users never fill this hidden field. Bots that fill every
  // input will populate it — silently drop the submission (T-05-12-02).
  const honeypot = String(formData.get('company_website') ?? '').trim()
  const locale = String(formData.get('locale') ?? 'es')
  const redirectBase = locale === 'en' ? '/en/contact' : '/contact'

  if (honeypot) {
    redirect(`${redirectBase}?sent=true`)
  }

  if (!name || !email || !message || !EMAIL_REGEX.test(email)) {
    redirect(`${redirectBase}?sent=false`)
  }

  const toAddress = process.env.CONTACT_TO_EMAIL

  if (!toAddress) {
    console.error('CONTACT_TO_EMAIL is not set — cannot send contact email.')
    redirect(`${redirectBase}?sent=false`)
  }

  // `redirect()` throws internally (NEXT_REDIRECT) — kept outside the
  // try/catch so a successful redirect is never mistaken for a send failure.
  let sendSucceeded = false

  try {
    const payload = await getPayload({ config })

    await payload.sendEmail({
      to: toAddress,
      replyTo: email,
      subject: `New contact form submission from ${name}`,
      html: `<p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(email)}</p><p><strong>Message:</strong></p><p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>`,
    })

    sendSucceeded = true
  } catch (err) {
    console.error('Failed to send contact email:', err)
  }

  redirect(`${redirectBase}?sent=${sendSucceeded}`)
}
