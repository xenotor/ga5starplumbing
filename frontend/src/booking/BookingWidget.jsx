/**
 * The booking form itself — no section chrome, no page assumptions, so it drops
 * into any landing page layout. See BookingSection for the full-width band used
 * on the marketing site.
 */

import { useEffect, useRef } from 'react'
import { PHONE, PHONE_HREF } from '../content'
import { CheckIcon, PhoneIcon } from '../components/Icons'
import { TURNSTILE_SITE_KEY } from './config'
import { useBooking } from './useBooking'
import Turnstile from './Turnstile'

const FIELD_CLASS =
  // text-base is load-bearing on iOS: anything under 16px zooms the page on focus.
  'mt-2 w-full rounded-xl border border-white/20 bg-brand-900 px-4 py-3.5 text-base text-white placeholder-white/40 focus:border-accent-400 focus:outline-none focus:ring-2 focus:ring-accent-400/40'

const LABEL_CLASS = 'block text-sm font-bold uppercase tracking-wide text-brand-200'

export default function BookingWidget({
  apiBase = '',
  phone = PHONE,
  phoneHref = PHONE_HREF,
  siteKey = TURNSTILE_SITE_KEY,
  onBooked,
  className = '',
}) {
  const booking = useBooking({ apiBase, requireCaptcha: Boolean(siteKey) })
  const { confirmed, error } = booking
  const confirmationRef = useRef(null)
  const errorRef = useRef(null)

  useEffect(() => {
    if (confirmed) {
      confirmationRef.current?.focus()
      onBooked?.(confirmed)
    }
  }, [confirmed, onBooked])

  // On a phone the error lands below the fold of the form controls.
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [error])

  if (confirmed) {
    return (
      <div
        ref={confirmationRef}
        tabIndex={-1}
        role="status"
        className={`mx-auto max-w-xl text-center focus:outline-none ${className}`}
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-brand-950 sm:h-16 sm:w-16">
          <CheckIcon className="h-7 w-7 sm:h-8 sm:w-8" />
        </span>
        <h3 className="mt-5 text-2xl font-black uppercase text-white sm:text-3xl">You are booked</h3>
        <p className="mt-3 text-lg text-brand-100">
          {confirmed.date} at {confirmed.slot}. Confirmation code{' '}
          <span className="font-mono font-bold text-accent-400">{confirmed.reference}</span>.
        </p>
        <p className="mt-2 text-brand-200">
          We will call you shortly to confirm. Need us sooner?{' '}
          <a href={phoneHref} className="font-bold text-accent-400 underline">
            {phone}
          </a>
        </p>
        <button
          type="button"
          onClick={booking.reset}
          className="mt-8 min-h-12 rounded-full border border-white/30 px-6 text-sm font-semibold text-white hover:bg-white/10"
        >
          Book another appointment
        </button>
      </div>
    )
  }

  return (
    // One column at every width: the customer works straight down the page and
    // never has to hunt across for the next field.
    <form onSubmit={booking.submit} className={`mx-auto w-full max-w-xl space-y-6 ${className}`}>
      <DayPicker booking={booking} />
      <SlotPicker booking={booking} phone={phone} />

      <div className="min-w-0 space-y-4">
        <Field
          id="ga5-name"
          label="Name"
          value={booking.form.name}
          onChange={booking.updateField('name')}
          error={booking.fieldErrors.name}
          required
          autoComplete="name"
          enterKeyHint="next"
        />
        <Field
          id="ga5-phone"
          label="Phone"
          type="tel"
          inputMode="tel"
          value={booking.form.phone}
          onChange={booking.updateField('phone')}
          error={booking.fieldErrors.phone}
          required
          autoComplete="tel"
          enterKeyHint="next"
        />
        <ContactPreference booking={booking} />
        <Field
          id="ga5-email"
          label="Email (optional)"
          type="email"
          inputMode="email"
          value={booking.form.email}
          onChange={booking.updateField('email')}
          autoComplete="email"
          enterKeyHint="next"
        />
        <Field
          id="ga5-address"
          label="Service address"
          value={booking.form.address}
          onChange={booking.updateField('address')}
          error={booking.fieldErrors.address}
          required
          autoComplete="street-address"
          enterKeyHint="next"
          placeholder="123 Peachtree St NE, Atlanta"
        />
        <div>
          <label htmlFor="ga5-notes" className={LABEL_CLASS}>
            Describe the problem
          </label>
          <textarea
            id="ga5-notes"
            rows={3}
            value={booking.form.notes}
            onChange={booking.updateField('notes')}
            className={FIELD_CLASS}
            placeholder="Water heater is leaking from the bottom…"
          />
        </div>

        <Turnstile siteKey={siteKey} onToken={booking.setCaptchaToken} />

        {error && (
          <p ref={errorRef} role="alert" className="rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {/* Sticks to the bottom of the viewport on phones so the CTA is always
            one thumb-reach away while the customer fills in the long form. */}
        <div className="sticky bottom-0 z-10 border-t border-white/10 bg-brand-950/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
          <Summary booking={booking} />
          <button
            type="submit"
            disabled={booking.submitting}
            className="min-h-14 w-full rounded-full bg-accent-500 px-6 text-base font-black uppercase tracking-wide text-brand-950 transition hover:bg-accent-400 disabled:opacity-60"
          >
            {booking.submitting ? 'Booking…' : 'Confirm appointment'}
          </button>
        </div>

        <a
          href={phoneHref}
          className="flex min-h-12 items-center justify-center gap-2 text-sm font-semibold text-brand-100 hover:text-accent-400"
        >
          <PhoneIcon className="h-4 w-4" /> Emergency? Call {phone}
        </a>
      </div>
    </form>
  )
}

function DayPicker({ booking }) {
  return (
    <div>
      <span className={LABEL_CLASS} id="ga5-day-label">
        Day
      </span>
      {/* Snap points make the strip feel like a native date carousel on touch. */}
      <div
        role="group"
        aria-labelledby="ga5-day-label"
        className="mt-3 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {booking.dayOptions.map((day) => {
          const selected = day.key === booking.date
          return (
            <button
              key={day.key}
              type="button"
              aria-pressed={selected}
              aria-label={day.label}
              onClick={() => booking.setDate(day.key)}
              className={`min-h-20 w-16 shrink-0 snap-start rounded-xl px-2 py-3 text-center transition ${
                selected ? 'bg-accent-500 text-brand-950' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span className="block text-xs font-semibold uppercase">{day.weekday}</span>
              <span className="block text-lg font-black">{day.dayOfMonth}</span>
              <span className="block text-xs">{day.month}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SlotPicker({ booking, phone }) {
  return (
    <div>
      <span className={LABEL_CLASS} id="ga5-slot-label">
        Time window
      </span>
      {booking.loadingSlots ? (
        <p className="mt-3 text-brand-200" role="status">
          Loading open times…
        </p>
      ) : booking.slots.length === 0 ? (
        <p className="mt-3 text-brand-200">No online slots left that day — pick another, or call {phone}.</p>
      ) : (
        <div role="group" aria-labelledby="ga5-slot-label" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {booking.slots.map((option) => (
            <button
              key={option.slot}
              type="button"
              disabled={!option.available}
              aria-pressed={booking.slot === option.slot}
              onClick={() => booking.setSlot(option.slot)}
              className={`min-h-12 rounded-xl px-3 text-sm font-semibold transition ${
                booking.slot === option.slot
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
  )
}

/**
 * How the owner may open the confirmation. Both start blank — an unticked box
 * is the only kind the customer actually agreed to — and at least one has to be
 * picked, or nobody can reach them.
 */
function ContactPreference({ booking }) {
  const error = booking.fieldErrors.contactPref
  return (
    <fieldset aria-describedby={error ? 'ga5-contact-error' : undefined}>
      <legend className={LABEL_CLASS}>
        How should we reach you?<span className="ml-1 text-accent-400">*</span>
      </legend>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Checkbox
          id="ga5-contact-text"
          label="Text me"
          checked={booking.form.contactText}
          onChange={booking.updateField('contactText')}
          invalid={Boolean(error)}
        />
        <Checkbox
          id="ga5-contact-call"
          label="Call me"
          checked={booking.form.contactCall}
          onChange={booking.updateField('contactCall')}
          invalid={Boolean(error)}
        />
      </div>
      {error && (
        <p id="ga5-contact-error" className="mt-1 text-sm text-red-200">
          {error}
        </p>
      )}
    </fieldset>
  )
}

function Checkbox({ id, label, invalid, ...props }) {
  return (
    // The whole tile is the hit target — a bare 16px box is a miss on a phone.
    <label
      htmlFor={id}
      className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border bg-brand-900 px-4 text-base text-white ${
        invalid ? 'border-red-400' : 'border-white/20'
      }`}
    >
      <input
        id={id}
        type="checkbox"
        {...props}
        className="h-5 w-5 shrink-0 accent-accent-500"
      />
      {label}
    </label>
  )
}

/** Above the sticky button the picked window scrolls out of sight — restate it. */
function Summary({ booking }) {
  const day = booking.dayOptions.find((option) => option.key === booking.date)
  const picked = booking.slots.find((option) => option.slot === booking.slot)
  if (!day) return null
  return (
    <p className="mb-2 text-center text-xs text-brand-200 sm:hidden">
      {picked ? `${day.label} · ${picked.label}` : `${day.label} · pick a time window above`}
    </p>
  )
}

function Field({ id, label, error, ...props }) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
        {props.required && <span className="ml-1 text-accent-400">*</span>}
      </label>
      <input
        id={id}
        {...props}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${FIELD_CLASS} ${error ? 'border-red-400' : ''}`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-200">
          {error}
        </p>
      )}
    </div>
  )
}
