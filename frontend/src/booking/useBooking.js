/**
 * All booking state — availability fetch, form, submit. Kept apart from the
 * markup so a landing page with its own design can reuse the logic and skip
 * `BookingWidget` entirely.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAttribution } from '../lib/attribution'
import { HORIZON_DAYS } from './config'
import { upcomingDays } from './dates'
import { maskSlots, rememberBooking } from './localSlots'

const ERRORS = {
  slot_unavailable: 'That time was just taken. Please pick another.',
  invalid_phone: 'That phone number does not look right — we need 10 digits.',
  invalid_address: 'We need a street address to send a van to.',
  missing_name: 'Please tell us your name.',
  missing_contact_pref: 'Please tell us whether we can text you, call you, or both.',
  captcha_failed: 'The bot check did not pass. Please try it again.',
  captcha_unavailable: 'We could not run the bot check. Please try again, or call us.',
}

/**
 * Client-side mirror of the Worker's rules (`api/appointments.ts`). The Worker
 * is the authority; this only saves the customer a round trip.
 */
export function validate(form) {
  const problems = {}
  if (!form.name.trim()) problems.name = 'Please tell us your name.'

  const digits = form.phone.replace(/\D/g, '')
  if (!form.phone.trim()) problems.phone = 'We need a phone number to confirm your booking.'
  else if (digits.length < 10 || digits.length > 15) problems.phone = 'That does not look like a full phone number.'

  if (!form.contactText && !form.contactCall)
    problems.contactPref = 'Pick at least one so we can confirm your booking.'

  const address = form.address.replace(/\s+/g, ' ').trim()
  if (!address) problems.address = 'We need the address to send a van to.'
  else if (!/\d/.test(address) || address.length < 8)
    problems.address = 'Please include the street number and street name.'

  return problems
}

export const emptyForm = {
  name: '',
  phone: '',
  email: '',
  contactText: false,
  contactCall: false,
  address: '',
  notes: '',
}

export function useBooking({ apiBase = '', days = HORIZON_DAYS, requireCaptcha = true } = {}) {
  const dayOptions = useMemo(() => upcomingDays(days), [days])
  const [date, setDate] = useState(() => dayOptions[0].key)
  const [slots, setSlots] = useState([])
  const [slot, setSlot] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(true)
  const [form, setForm] = useState(emptyForm)
  const [fieldErrors, setFieldErrors] = useState({})
  const [captchaToken, setCaptchaToken] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(null)

  // Only the newest response may write state; a fast day-tapper on mobile fires
  // several of these and the abort alone does not order them.
  const requestId = useRef(0)

  const loadSlots = useCallback(
    async (forDate, signal) => {
      const id = ++requestId.current
      setLoadingSlots(true)
      try {
        const response = await fetch(`${apiBase}/api/availability?date=${forDate}`, { signal })
        if (!response.ok) throw new Error('availability')
        const data = await response.json()
        if (id !== requestId.current) return
        // The Worker never closes a window; the greyed-out ones are added here.
        setSlots(maskSlots(forDate, data.slots || []))
        setError('')
      } catch (err) {
        if (err.name === 'AbortError' || id !== requestId.current) return
        setSlots([])
        setError('We could not load open times. Please call us and we will book you in.')
      } finally {
        if (id === requestId.current) setLoadingSlots(false)
      }
    },
    [apiBase],
  )

  useEffect(() => {
    const controller = new AbortController()
    setSlot('')
    loadSlots(date, controller.signal)
    return () => controller.abort()
  }, [date, loadSlots])

  const updateField = useCallback(
    (field) => (event) => {
      const { checked, type, value } = event.target
      setForm((f) => ({ ...f, [field]: type === 'checkbox' ? checked : value }))
      // Clear a field's complaint as soon as the customer edits it; re-checking
      // mid-typing would flag every half-entered phone number. The two contact
      // boxes share one error, so either of them clears it.
      const errorKey = field === 'contactText' || field === 'contactCall' ? 'contactPref' : field
      setFieldErrors((problems) =>
        problems[errorKey] ? { ...problems, [errorKey]: undefined } : problems,
      )
    },
    [],
  )

  const submit = useCallback(
    async (event) => {
      event?.preventDefault?.()
      if (!slot) {
        setError('Pick a time that works for you.')
        return null
      }

      const problems = validate(form)
      if (Object.keys(problems).length > 0) {
        setFieldErrors(problems)
        setError('Please check the highlighted fields.')
        return null
      }

      if (requireCaptcha && !captchaToken) {
        setError('Please complete the bot check below the form.')
        return null
      }

      setSubmitting(true)
      setError('')
      try {
        const response = await fetch(`${apiBase}/api/appointments`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            ...form,
            contactPref: [form.contactText && 'text', form.contactCall && 'call']
              .filter(Boolean)
              .join(','),
            date,
            slot,
            turnstileToken: captchaToken,
            attribution: getAttribution(),
          }),
        })
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'booking_failed')
        // So a second booking from this browser sees the window as taken.
        rememberBooking(date, slot)
        setConfirmed(data)
        setForm(emptyForm)
        setSlot('')
        setFieldErrors({})
        // Re-read so the window they just took comes back masked.
        loadSlots(date)
        return data
      } catch (err) {
        setError(ERRORS[err.message] || 'We could not book that. Please try again or call us.')
        // Turnstile tokens are single-use: whatever went wrong, the one we hold
        // is spent and the widget has to issue another.
        setCaptchaToken('')
        if (typeof window !== 'undefined') window.turnstile?.reset?.()
        return null
      } finally {
        setSubmitting(false)
      }
    },
    [apiBase, captchaToken, date, form, loadSlots, requireCaptcha, slot],
  )

  const reset = useCallback(() => {
    setConfirmed(null)
    setError('')
  }, [])

  return {
    dayOptions,
    date,
    setDate,
    slots,
    slot,
    setSlot,
    loadingSlots,
    form,
    fieldErrors,
    updateField,
    setCaptchaToken,
    submitting,
    error,
    confirmed,
    submit,
    reset,
  }
}
