import { SERVICES, ALSO_HELP } from '../content'
import SectionHeading from './SectionHeading'

export default function Services() {
  return (
    <section id="services" className="bg-white py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <SectionHeading eyebrow="What we do" title="Services" />

        <div className="mt-10 grid gap-5 sm:mt-12 sm:grid-cols-2 sm:gap-8 lg:grid-cols-4">
          {SERVICES.map((service) => (
            <article
              key={service.title}
              className="group relative min-h-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition hover:-translate-y-1 hover:border-brand-300 hover:shadow-xl"
            >
              <img
                src={service.image}
                alt=""
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/95 to-white/5" />
              <div className="relative flex min-h-72 flex-col justify-end p-6">
                <div className="h-40">
                  <h3 className="flex h-14 items-start text-lg font-bold uppercase tracking-wide text-brand-900">
                    {service.title}
                  </h3>
                  <p className="mt-2 text-slate-700">{service.body}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-brand-50 p-6 sm:mt-14 sm:p-8">
          <h3 className="text-xl font-bold uppercase tracking-wide text-brand-900">We also specialize in</h3>
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
