/**
 * `/book` — the scheduler on its own page, so an ad or a partner landing page
 * can send traffic straight to it with a plain link instead of embedding
 * anything. The SPA fallback in the Worker serves this path already.
 */

import { PHONE, PHONE_HREF } from '../content'
import { PhoneIcon } from '../components/Icons'
import Footer from '../components/Footer'
import { BookingSection } from '../booking'

export default function BookingPage() {
  return (
    <>
      <header className="bg-brand-950 pt-[env(safe-area-inset-top)] text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <a href="/">
            <img src="/images/5star.png" alt="Georgia 5 Star Plumbing" className="h-10 w-auto sm:h-12" />
          </a>
          <a
            href={PHONE_HREF}
            className="flex min-h-11 items-center gap-2 rounded-full border border-white/30 px-4 text-sm font-bold hover:bg-white/10"
          >
            <PhoneIcon className="h-4 w-4" /> <span className="hidden sm:inline">{PHONE}</span>
            <span className="sm:hidden">Call</span>
          </a>
        </div>
      </header>
      <main>
        <BookingSection />
      </main>
      <Footer />
    </>
  )
}
