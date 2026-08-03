import { EMAIL, NAV, PHONE, PHONE_HREF, SOCIAL } from '../content'
import { FacebookIcon, TwitterIcon, GoogleIcon, MailIcon, PhoneIcon } from './Icons'

export default function Footer() {
  return (
    // Extra bottom padding on phones clears the fixed MobileCallBar.
    <footer className="bg-slate-900 pb-28 pt-12 text-slate-300 md:pb-14 md:pt-14">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-3 md:gap-10">
        <div>
          <img src="/images/5star.png" alt="Georgia 5 Star Plumbing" className="h-12 w-auto brightness-0 invert" />
          <p className="mt-4 max-w-xs text-sm">
            Family owned, licensed and insured Atlanta plumbing with over 25 years of experience.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Contact</h3>
          <a href={PHONE_HREF} className="mt-4 flex items-center gap-2 font-semibold text-white hover:text-accent-400">
            <PhoneIcon className="h-4 w-4" /> {PHONE}
          </a>
          <a href={`mailto:${EMAIL}`} className="mt-2 flex items-center gap-2 break-all hover:text-accent-400">
            <MailIcon className="h-4 w-4" /> {EMAIL}
          </a>
          <div className="mt-5 flex gap-4">
            <a href={SOCIAL.facebook} aria-label="Facebook" target="_blank" rel="noreferrer" className="hover:text-accent-400">
              <FacebookIcon />
            </a>
            <a href={SOCIAL.twitter} aria-label="Twitter" target="_blank" rel="noreferrer" className="hover:text-accent-400">
              <TwitterIcon />
            </a>
            <a href={SOCIAL.google} aria-label="Google" target="_blank" rel="noreferrer" className="hover:text-accent-400">
              <GoogleIcon />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Menu</h3>
          <ul className="mt-2">
            {[{ href: '#top', label: 'Home' }, ...NAV].map((item) => (
              <li key={item.href}>
                <a href={item.href} className="flex min-h-11 items-center hover:text-accent-400">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 px-4 pt-6 text-sm sm:px-6">
        © {new Date().getFullYear()} Georgia 5 Star Plumbing Inc. All rights reserved.
      </div>
    </footer>
  )
}
