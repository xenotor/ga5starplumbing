import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const dist = resolve(root, 'dist')
const template = await readFile(resolve(dist, 'index.html'), 'utf8')
const origin = 'https://ga5starplumbing.com'
const areas = [
  { city: 'Woodstock', slug: 'woodstock', zips: ['30188', '30189'] },
  { city: 'Alpharetta', slug: 'alpharetta', zips: ['30004', '30005', '30009', '30022'] },
  { city: 'Marietta', slug: 'marietta', zips: ['30060', '30061', '30062', '30064', '30066', '30067', '30068'] },
  { city: 'Canton', slug: 'canton', zips: ['30114', '30115'] },
  { city: 'Suwanee', slug: 'suwanee', zips: ['30024'] },
]

function pageHtml(area) {
  const path = area ? `/plumber-${area.slug}-ga/` : '/'
  const canonical = `${origin}${path}`
  const title = area
    ? `Plumber in ${area.city}, GA | Georgia 5 Star Plumbing`
    : 'North Georgia Plumber | Georgia 5 Star Plumbing'
  const description = area
    ? `Licensed, insured ${area.city}, GA plumber for emergency plumbing, leaks, drains, water heaters and plumbing repair. Serving ${area.zips.join(', ')}. Call 404.488.4889.`
    : 'Licensed, insured North Georgia plumbers serving Woodstock, Alpharetta, Marietta, Canton and Suwanee. Plumbing repair, drains and water heaters. Book online.'
  const fallback = area
    ? `<div><h1>Plumber in ${area.city}, Georgia</h1><p>Georgia 5 Star Plumbing provides emergency plumbing, leak repair, drain cleaning, water heater repair and installation in ${area.city}, GA ${area.zips.join(', ')}.</p><p>Licensed and insured Master Plumber. Call 404.488.4889 or book online.</p></div>`
    : '<div><h1>North Georgia plumber</h1><p>Georgia 5 Star Plumbing serves Woodstock, Alpharetta, Marietta, Canton and Suwanee with emergency plumbing, leak repair, drain cleaning and water heater service.</p><p>Licensed and insured Master Plumber. Call 404.488.4889 or book online.</p></div>'
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Plumber',
    '@id': `${origin}/#business`,
    name: 'Georgia 5 Star Plumbing Inc.',
    url: origin,
    telephone: '+1-404-488-4889',
    email: 'georgia5starplumbing@gmail.com',
    image: `${origin}/images/5star.png`,
    priceRange: '$$',
    areaServed: areas.map(({ city, zips }) => ({
      '@type': 'City',
      name: `${city}, Georgia`,
      containedInPlace: { '@type': 'State', name: 'Georgia' },
      postalCode: zips,
    })),
    sameAs: [
      'https://www.facebook.com/georgia5starplumbing/',
      'https://twitter.com/star_georgia',
    ],
  }

  return template
    .replace(/<title>.*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, `<meta name="description" content="${description}" />`)
    .replace(/<meta property="og:title"[^>]*\/>/, `<meta property="og:title" content="${title}" />`)
    .replace(/<meta\s+property="og:description"[\s\S]*?\/>/, `<meta property="og:description" content="${description}" />`)
    .replace(/<meta name="twitter:title"[^>]*\/>/, `<meta name="twitter:title" content="${title}" />`)
    .replace(/<meta name="twitter:description"[^>]*\/>/, `<meta name="twitter:description" content="${description}" />`)
    .replace('</head>', () => `    <link rel="canonical" href="${canonical}" />\n    <meta property="og:url" content="${canonical}" />\n    <script type="application/ld+json">${JSON.stringify(schema)}</script>\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${fallback}</div>`)
}

await writeFile(resolve(dist, 'index.html'), pageHtml())
for (const area of areas) {
  const directory = resolve(dist, `plumber-${area.slug}-ga`)
  await mkdir(directory, { recursive: true })
  await writeFile(resolve(directory, 'index.html'), pageHtml(area))
}
