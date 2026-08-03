import { useState } from 'react'
import { NAV, PHONE, PHONE_HREF, SOCIAL } from '../content'
import { FacebookIcon, TwitterIcon, GoogleIcon, PhoneIcon, MenuIcon, CloseIcon } from './Icons'

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="bg-brand-950 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-sm sm:px-6">
          <a href={PHONE_HREF} className="flex items-center gap-2 font-semibold hover:text-accent-400">
            <PhoneIcon className="h-4 w-4" />
            Call Now {PHONE}
          </a>
          <div className="flex items-center gap-3">
            <a href={SOCIAL.facebook} aria-label="Facebook" target="_blank" rel="noreferrer" className="hover:text-accent-400">
              <FacebookIcon className="h-4 w-4" />
            </a>
            <a href={SOCIAL.twitter} aria-label="Twitter" target="_blank" rel="noreferrer" className="hover:text-accent-400">
              <TwitterIcon className="h-4 w-4" />
            </a>
            <a href={SOCIAL.google} aria-label="Google reviews" target="_blank" rel="noreferrer" className="hover:text-accent-400">
              <GoogleIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      <nav className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="#top" className="flex items-center gap-3">
            <img src="/images/5star.png" alt="Georgia 5 Star Plumbing" className="h-11 w-auto" />
          </a>

          <ul className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-sm font-semibold uppercase tracking-wide text-slate-700 hover:text-brand-600"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="#book"
                className="rounded-full bg-brand-600 px-5 py-2 text-sm font-bold uppercase tracking-wide text-white shadow hover:bg-brand-700"
              >
                Book Now
              </a>
            </li>
          </ul>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-slate-700 md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>

        {open && (
          <ul className="border-t border-slate-200 bg-white px-4 pb-4 md:hidden">
            {[...NAV, { href: '#book', label: 'Book Now' }].map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block border-b border-slate-100 py-3 text-sm font-semibold uppercase tracking-wide text-slate-700"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </header>
  )
}
