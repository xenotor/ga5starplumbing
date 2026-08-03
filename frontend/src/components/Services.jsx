import { SERVICES, ALSO_HELP } from '../content'
import SectionHeading from './SectionHeading'

export default function Services() {
  return (
    <section id="services" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="What we do" title="Services" />

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <article
              key={service.title}
              className="group rounded-2xl border border-slate-200 p-6 transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
            >
              <img
                src={service.image}
                alt={service.title}
                loading="lazy"
                className="h-24 w-auto object-contain"
              />
              <h3 className="mt-5 text-lg font-bold uppercase tracking-wide text-brand-900">{service.title}</h3>
              <p className="mt-2 text-slate-600">{service.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-14 rounded-2xl bg-brand-50 p-8">
          <h3 className="text-xl font-bold uppercase tracking-wide text-brand-900">We can also help with</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {ALSO_HELP.map((item) => (
              <li
                key={item}
                className="rounded-full border border-brand-200 bg-white px-4 py-1.5 text-sm font-medium text-brand-800"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
