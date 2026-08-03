import { PHONE, PHONE_HREF, EMAIL } from '../content'
import { PhoneIcon, MailIcon, StarIcon } from './Icons'

export default function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-brand-950 pt-28 text-white sm:pt-32">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_40rem_at_80%_-10%,rgba(51,133,251,0.45),transparent)]"
        aria-hidden="true"
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pb-14 pt-6 sm:px-6 sm:pb-20 sm:pt-10 lg:grid-cols-12 lg:pb-28">
        <div className="lg:col-span-8">
          {/* Stars and the credential wrap as two lines on a narrow phone
              rather than breaking the sentence mid-way beside them. */}
          <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-accent-400">
            <span className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <StarIcon key={i} className="h-5 w-5" />
              ))}
            </span>
            <span className="text-sm font-medium text-brand-100">Licensed &amp; insured Master Plumber</span>
          </div>

          <h1 className="text-4xl font-black uppercase leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            Will fix <span className="text-accent-400">any leak!</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-brand-100">
            We are a family owned business with over 25 years of experience. Our hard-working licensed and insured
            plumbers guarantee to solve any issue with excellence.
          </p>
          <p className="mt-3 max-w-2xl text-lg text-brand-100">
            If you are looking for timely and exceptional service, call now or book an appointment.
          </p>

          {/* Full-width stacked buttons on a phone; inline pills from sm up. */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#book"
              className="flex min-h-14 items-center justify-center rounded-full bg-accent-500 px-7 text-base font-bold uppercase tracking-wide text-brand-950 shadow-lg transition hover:bg-accent-400"
            >
              Book an appointment
            </a>
            <a
              href={PHONE_HREF}
              className="flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 text-base font-bold tracking-wide text-white transition hover:bg-white/20"
            >
              <PhoneIcon /> {PHONE}
            </a>
            <a
              href={`mailto:${EMAIL}`}
              className="hidden min-h-14 items-center justify-center gap-2 rounded-full border border-white/30 px-7 text-base font-medium text-white transition hover:bg-white/10 sm:flex"
            >
              <MailIcon /> Email us
            </a>
          </div>
        </div>

        <div className="hidden lg:col-span-4 lg:block">
          <img src="/images/kluch.png" alt="Pipe wrench" className="mx-auto w-full max-w-xs drop-shadow-2xl" />
        </div>
      </div>
    </section>
  )
}
