import { SERVICE_AREAS } from '../content'

export default function ServiceAreas() {
  return (
    <section id="service-areas" className="bg-brand-50 py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-600">North Georgia service area</p>
        <h2 className="mt-2 text-3xl font-black uppercase text-brand-950 sm:text-4xl">Local plumbers near you</h2>
        <p className="mt-4 max-w-3xl text-lg text-slate-700">
          Georgia 5 Star Plumbing provides residential and light commercial plumbing repair across North Metro
          Atlanta, including Cherokee, Cobb, Fulton and Gwinnett counties.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {SERVICE_AREAS.map((area) => (
            <article key={area.slug} className="rounded-xl border border-brand-200 bg-white p-5">
              <h3 className="text-lg font-bold text-brand-900">
                <a className="hover:text-brand-600" href={`/plumber-${area.slug}-ga/`}>
                  {area.city} plumber
                </a>
              </h3>
              <p className="mt-2 text-sm text-slate-600">ZIP codes: {area.zips.join(', ')}</p>
            </article>
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-600">
          Nearby community not listed? Call to confirm service availability throughout North Georgia.
        </p>
      </div>
    </section>
  )
}
