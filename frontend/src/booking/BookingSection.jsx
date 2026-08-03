/**
 * Full-width booking band. This is what a landing page references when it wants
 * the section as it appears on the marketing site; pass copy props to retitle it
 * for a campaign, or use BookingWidget directly for a custom layout.
 */

import SectionHeading from '../components/SectionHeading'
import { DEFAULT_COPY } from './config'
import BookingWidget from './BookingWidget'

export default function BookingSection({
  id = 'book',
  eyebrow = DEFAULT_COPY.eyebrow,
  title = DEFAULT_COPY.title,
  intro = DEFAULT_COPY.intro,
  ...widgetProps
}) {
  return (
    <section id={id} className="bg-brand-950 py-14 text-white sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <SectionHeading eyebrow={eyebrow} title={title} invert />
        {intro && <p className="mt-4 max-w-2xl text-brand-100">{intro}</p>}
        <BookingWidget className="mt-8 sm:mt-10" {...widgetProps} />
      </div>
    </section>
  )
}
