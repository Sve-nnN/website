'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import config from '@payload-config'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// SECURITY (T-260713-2q2-02): minimal per-IP rate limit for this public,
// unauthenticated server action. `server-auth-actions` flags this action for
// having no auth check — that's a false positive on the auth premise: a
// public contact form is intentionally callable without login. The real gap
// was abuse protection, closed here. This runs as a single persistent Node
// process on Hostinger (not serverless), so a module-level Map survives
// between requests within the process — sufficient for a low-traffic
// portfolio contact form. No Redis / external dependency.
// KNOWN FALSE POSITIVE (react-doctor `server-no-mutable-module-state`): that
// rule assumes a serverless/edge deployment where module state does not
// reliably survive between invocations. This project's CLAUDE.md/ARCHITECTURE
// explicitly targets a single persistent Node process on Hostinger (PM2,
// `next start`, not Vercel/edge) -- shared module state across requests
// within that one process is the intended mechanism here, not a bug. Do not
// "fix" this by moving to per-request storage; that would defeat the rate
// limiter entirely.
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const RATE_LIMIT_MAX_SUBMISSIONS = 5
const submissionLog = new Map<string, number[]>()

async function isRateLimited(): Promise<boolean> {
  const headerList = await headers()
  const forwardedFor = headerList.get('x-forwarded-for')
  const clientIp = forwardedFor?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown'

  const now = Date.now()
  const existing = submissionLog.get(clientIp) ?? []
  const recent = existing.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)

  if (recent.length >= RATE_LIMIT_MAX_SUBMISSIONS) {
    submissionLog.set(clientIp, recent)
    return true
  }

  recent.push(now)
  submissionLog.set(clientIp, recent)
  return false
}

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

  if (await isRateLimited()) {
    redirect(`${redirectBase}?sent=false`)
  }

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
