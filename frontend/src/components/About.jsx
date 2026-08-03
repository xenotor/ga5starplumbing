import { ABOUT, WHY_US } from '../content'
import SectionHeading from './SectionHeading'
import { CheckIcon } from './Icons'

export default function About() {
  return (
    <>
      <section id="about" className="bg-brand-900 py-20 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Family owned" title="About" invert />
            {ABOUT.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mt-6 text-lg leading-relaxed text-brand-100">
                {paragraph}
              </p>
            ))}
          </div>
          <img
            src="/images/plumber2.png"
            alt="Master plumber at work"
            loading="lazy"
            className="mx-auto w-full max-w-md rounded-2xl"
          />
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="The difference" title="Why us?" />
            <ul className="mt-8 space-y-3">
              {WHY_US.map((reason) => (
                <li
                  key={reason}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 px-5 py-4 text-lg font-medium text-slate-700"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-600 text-white">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  {reason}
                </li>
              ))}
            </ul>
            <a
              href="https://homeguide.com/plumbers"
              target="_blank"
              rel="noreferrer"
              title="Plumbers Near Me"
              className="mt-8 inline-block"
            >
              <img src="/images/homeguide-2017.png" alt="Plumbers Near Me - HomeGuide" loading="lazy" className="h-20 w-auto" />
            </a>
          </div>
          <img
            src="/images/sink.png"
            alt="Finished sink installation"
            loading="lazy"
            className="mx-auto w-full max-w-md rounded-2xl"
          />
        </div>
      </section>
    </>
  )
}
