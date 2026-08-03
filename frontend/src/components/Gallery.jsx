import { useState } from 'react'
import { GALLERY } from '../content'
import SectionHeading from './SectionHeading'
import { ChevronIcon, CloseIcon } from './Icons'

export default function Gallery() {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState(false)

  const step = (delta) => setActive((i) => (i + delta + GALLERY.length) % GALLERY.length)

  return (
    <section id="gallery" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="Our work" title="Gallery" />

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-lg">
            <button type="button" onClick={() => setLightbox(true)} className="block w-full">
              <img
                src={GALLERY[active].src}
                alt={GALLERY[active].alt}
                className="aspect-4/3 w-full object-cover"
              />
            </button>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-brand-900 shadow hover:bg-white"
            >
              <ChevronIcon direction="left" className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-2 text-brand-900 shadow hover:bg-white"
            >
              <ChevronIcon className="h-6 w-6" />
            </button>
          </div>

          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-4">
            {GALLERY.map((photo, index) => (
              <li key={photo.src}>
                <button
                  type="button"
                  onClick={() => setActive(index)}
                  aria-label={`Show photo ${index + 1}`}
                  aria-current={index === active}
                  className={`block overflow-hidden rounded-lg border-2 transition ${
                    index === active ? 'border-brand-600' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={photo.src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-5 top-5 text-white"
            onClick={() => setLightbox(false)}
          >
            <CloseIcon className="h-8 w-8" />
          </button>
          <img src={GALLERY[active].src} alt={GALLERY[active].alt} className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </section>
  )
}
