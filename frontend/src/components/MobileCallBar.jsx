/**
 * Phone-only sticky call/book bar. Ad traffic arrives on a small screen and
 * often wants the phone, not the form — this keeps both one tap away.
 * It hides itself over the booking section, whose own sticky submit button
 * would otherwise be buried under it.
 */

import { useEffect, useState } from 'react'
import { PHONE, PHONE_HREF } from '../content'
import { PhoneIcon } from './Icons'

export default function MobileCallBar() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const target = document.getElementById('book')
    if (!target || typeof IntersectionObserver === 'undefined') return undefined
    const observer = new IntersectionObserver((entries) => setHidden(entries[0].isIntersecting), {
      threshold: 0,
    })
    observer.observe(target)
    return () => observer.disconnect()
  }, [])

  if (hidden) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex gap-2 border-t border-white/10 bg-brand-950/95 px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden">
      <a
        href={PHONE_HREF}
        className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-white/30 text-sm font-bold text-white"
      >
        <PhoneIcon className="h-4 w-4" /> {PHONE}
      </a>
      <a
        href="#book"
        className="flex min-h-12 flex-1 items-center justify-center rounded-full bg-accent-500 text-sm font-black uppercase tracking-wide text-brand-950"
      >
        Book now
      </a>
    </div>
  )
}
