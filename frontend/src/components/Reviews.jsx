import { useEffect, useState } from 'react'
import { REVIEWS, SOCIAL } from '../content'
import SectionHeading from './SectionHeading'
import { StarIcon, ChevronIcon } from './Icons'

const ROTATE_MS = 8000

export default function Reviews() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return undefined
    const timer = setInterval(() => setIndex((i) => (i + 1) % REVIEWS.length), ROTATE_MS)
    return () => clearInterval(timer)
  }, [paused])

  const step = (delta) => setIndex((i) => (i + delta + REVIEWS.length) % REVIEWS.length)
  const review = REVIEWS[index]

  return (
    <section
      id="reviews"
      className="bg-white py-14 sm:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      // Touch has no hover: a reader who taps a dot should not be yanked on.
      onTouchStart={() => setPaused(true)}
    >
      <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="flex flex-col items-center">
          <SectionHeading eyebrow="Reviews" title="What our customers say" />
        </div>

        <div className="mt-10 flex items-center gap-4">
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous review"
            className="hidden shrink-0 rounded-full border border-slate-200 p-2 text-brand-700 hover:bg-slate-50 sm:block"
          >
            <ChevronIcon direction="left" className="h-6 w-6" />
          </button>

          <blockquote className="flex-1 rounded-2xl bg-slate-50 p-6 sm:min-h-56 sm:p-8">
            <div className="flex justify-center gap-1 text-accent-500">
              {Array.from({ length: 5 }, (_, i) => (
                <StarIcon key={i} className="h-5 w-5" />
              ))}
            </div>
            <p className="mt-5 text-base leading-relaxed text-slate-700 sm:text-lg">“{review.body}”</p>
            <footer className="mt-5 font-bold uppercase tracking-wide text-brand-800">— {review.name}</footer>
          </blockquote>

          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next review"
            className="hidden shrink-0 rounded-full border border-slate-200 p-2 text-brand-700 hover:bg-slate-50 sm:block"
          >
            <ChevronIcon className="h-6 w-6" />
          </button>
        </div>

        {/* The dot is 8px; the button around it is 44px so a thumb can hit it. */}
        <div className="mt-4 flex justify-center">
          {REVIEWS.map((r, i) => (
            <button
              key={r.name}
              type="button"
              aria-label={`Review ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className="flex h-11 w-6 items-center justify-center"
            >
              <span
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-brand-600' : 'w-2 bg-slate-300'}`}
              />
            </button>
          ))}
        </div>

        <a
          href={SOCIAL.google}
          target="_blank"
          rel="noreferrer"
          className="mt-8 inline-block text-sm font-semibold uppercase tracking-wide text-brand-600 hover:text-brand-800"
        >
          Read more reviews on Google →
        </a>
      </div>
    </section>
  )
}
