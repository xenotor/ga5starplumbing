import { useCallback, useEffect, useMemo, useState } from 'react'
import SectionHeading from './SectionHeading'
import { PHONE, PHONE_HREF } from '../content'
import { getAttribution } from '../lib/attribution'
import { CheckIcon, PhoneIcon } from './Icons'

const SERVICE_OPTIONS = [
  'Emergency / leak',
  'Installation & repair',
  'Water heater',
  'Bathroom remodel',
  'Drain cleaning',
  'Something else',
]

/** Local (America/New_York-ish) date key. The Worker validates the real rules. */
function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

function nextDays(count) {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(today)
    day.setDate(today.getDate() + i)
    return day
  })
}

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  address: '',
  service: SERVICE_OPTIONS[0],
  notes: '',
}

export default function Booking() {
  const days = useMemo(() => nextDays(14), [])
  const [date, setDate] = useState(() => dateKey(days[0]))
  const [slots, setSlots] = useState([])
  const [slot, setSlot] = useState('')
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmed, setConfirmed] = useState(null)

  const loadSlots = useCallback(async (forDate, signal) => {
    setLoadingSlots(true)
    setError('')
    try {
      const response = await fetch(`/api/availability?date=${forDate}`, { signal })
      if (!response.ok) throw new Error('availability')
      const data = await response.json()
      setSlots(data.slots || [])
    } catch (err) {
      if (err.name === 'AbortError') return
      setSlots([])
      setError('We could not load open times. Please call us and we will book you in.')
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setSlot('')
    loadSlots(date, controller.signal)
    return () => controller.abort()
  }, [date, loadSlots])

  const update = (field) => (event) => setForm((f) => ({ ...f, [field]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    if (!slot) {
      setError('Pick a time that works for you.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...form, date, slot, attribution: getAttribution() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Booking failed')
      setConfirmed(data)
      setForm(emptyForm)
      // A taken slot must disappear for whoever books next.
      loadSlots(date)
    } catch (err) {
      setError(err.message === 'slot_unavailable' ? 'That time was just taken. Please pick another.' : err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (confirmed) {
    return (
      <section id="book" className="bg-brand-950 py-20 text-white">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-500 text-brand-950">
            <CheckIcon className="h-8 w-8" />
          </span>
          <h2 className="mt-6 text-3xl font-black uppercase">You are booked</h2>
          <p className="mt-4 text-lg text-brand-100">
            {confirmed.date} at {confirmed.slot}. Confirmation code{' '}
            <span className="font-mono font-bold text-accent-400">{confirmed.reference}</span>.
          </p>
          <p className="mt-2 text-brand-200">
            We will call you shortly to confirm. Need us sooner?{' '}
            <a href={PHONE_HREF} className="font-bold text-accent-400 underline">
              {PHONE}
            </a>
          </p>
          <button
            type="button"
            onClick={() => setConfirmed(null)}
            className="mt-8 rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold hover:bg-white/10"
          >
            Book another appointment
          </button>
        </div>
      </section>
    )
  }

  return (
    <section id="book" className="bg-brand-950 py-20 text-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex flex-col items-start">
          <SectionHeading eyebrow="No call needed" title="Book an appointment" invert />
        </div>
        <p className="mt-4 max-w-2xl text-brand-100">
          Pick a day and a two-hour window. We confirm every booking by phone, usually within the hour.
        </p>

        <form onSubmit={submit} className="mt-10 grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wide text-brand-200">Day</label>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {days.map((day) => {
                  const key = dateKey(day)
                  const selected = key === date
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDate(key)}
                      className={`shrink-0 rounded-xl px-4 py-3 text-center transition ${
                        selected ? 'bg-accent-500 text-brand-950' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                    >
                      <span className="block text-xs font-semibold uppercase">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </span>
                      <span className="block text-lg font-black">{day.getDate()}</span>
                      <span className="block text-xs">
                        {day.toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wide text-brand-200">Time window</label>
              {loadingSlots ? (
                <p className="mt-3 text-brand-200">Loading open times…</p>
              ) : slots.length === 0 ? (
                <p className="mt-3 text-brand-200">
                  No online slots left that day — pick another, or call {PHONE}.
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {slots.map((option) => (
                    <button
                      key={option.slot}
                      type="button"
                      disabled={!option.available}
                      onClick={() => setSlot(option.slot)}
                      className={`rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                        slot === option.slot
                          ? 'bg-accent-500 text-brand-950'
                          : option.available
                            ? 'bg-white/10 text-white hover:bg-white/20'
                            : 'cursor-not-allowed bg-white/5 text-white/30 line-through'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label htmlFor="service" className="block text-sm font-bold uppercase tracking-wide text-brand-200">
                What do you need?
              </label>
              <select
                id="service"
                value={form.service}
                onChange={update('service')}
                className="mt-2 w-full rounded-lg border border-white/20 bg-brand-900 px-4 py-3 text-white focus:border-accent-400 focus:outline-none"
              >
                {SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <Field id="name" label="Name" value={form.name} onChange={update('name')} required autoComplete="name" />
            <Field
              id="phone"
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={update('phone')}
              required
              autoComplete="tel"
            />
            <Field
              id="email"
              label="Email (optional)"
              type="email"
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
            />
            <Field
              id="address"
              label="Service address"
              value={form.address}
              onChange={update('address')}
              required
              autoComplete="street-address"
            />
            <div>
              <label htmlFor="notes" className="block text-sm font-bold uppercase tracking-wide text-brand-200">
                Describe the problem
              </label>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={update('notes')}
                className="mt-2 w-full rounded-lg border border-white/20 bg-brand-900 px-4 py-3 text-white placeholder-white/40 focus:border-accent-400 focus:outline-none"
                placeholder="Water heater is leaking from the bottom…"
              />
            </div>

            {error && <p className="rounded-lg bg-red-500/15 px-4 py-3 text-sm text-red-200">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-accent-500 px-6 py-4 text-base font-black uppercase tracking-wide text-brand-950 transition hover:bg-accent-400 disabled:opacity-60"
            >
              {submitting ? 'Booking…' : 'Confirm appointment'}
            </button>

            <a
              href={PHONE_HREF}
              className="flex items-center justify-center gap-2 text-sm font-semibold text-brand-100 hover:text-accent-400"
            >
              <PhoneIcon className="h-4 w-4" /> Emergency? Call {PHONE}
            </a>
          </div>
        </form>
      </div>
    </section>
  )
}

function Field({ id, label, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold uppercase tracking-wide text-brand-200">
        {label}
      </label>
      <input
        id={id}
        {...props}
        className="mt-2 w-full rounded-lg border border-white/20 bg-brand-900 px-4 py-3 text-white placeholder-white/40 focus:border-accent-400 focus:outline-none"
      />
    </div>
  )
}
