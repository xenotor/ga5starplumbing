/** Site copy, carried over verbatim from the legacy static page. */

export const PHONE = '404.488.4889'
export const PHONE_HREF = 'tel:+14044884889'
export const EMAIL = 'georgia5starplumbing@gmail.com'

export const SERVICE_AREAS = [
  { city: 'Woodstock', slug: 'woodstock', zips: ['30188', '30189'] },
  { city: 'Alpharetta', slug: 'alpharetta', zips: ['30004', '30005', '30009', '30022'] },
  { city: 'Marietta', slug: 'marietta', zips: ['30060', '30061', '30062', '30064', '30066', '30067', '30068'] },
  { city: 'Canton', slug: 'canton', zips: ['30114', '30115'] },
  { city: 'Suwanee', slug: 'suwanee', zips: ['30024'] },
  { city: 'Roswell', slug: 'roswell', zips: ['30075', '30076', '30077', '30078'] },
  { city: 'Cumming', slug: 'cumming', zips: ['30040', '30041'] },
]

export const SOCIAL = {
  facebook: 'https://www.facebook.com/georgia5starplumbing/',
  twitter: 'https://twitter.com/star_georgia',
  google:
    'https://www.google.com/search?q=Georgia+5+Star+Plumbing+Inc&ludocid=586669743005163233',
}

export const NAV = [
  { href: '#services', label: 'Services' },
  { href: '#about', label: 'About' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#service-areas', label: 'Service Areas' },
  { href: '#book', label: 'Book' },
]

export const SERVICES = [
  {
    image: '/images/jobs/general-plumbing.webp',
    title: 'Installation & Repair',
    body: 'Professional plumbing installation, diagnosis and repair for fixtures, piping and gas lines.',
  },
  {
    image: '/images/jobs/water-heaters.webp',
    title: 'Water Heaters',
    body: 'Professional water heater installation, replacement and repair, including hybrid systems.',
  },
  {
    image: '/images/jobs/tankless-water-heaters.webp',
    title: 'Tankless Water Heaters',
    body: 'Professional tankless water heater installation, replacement and repair for reliable hot water.',
  },
  {
    image: '/images/jobs/sewer-line-repair.webp',
    title: 'Drain Cleaning',
    body: 'Professional drain cleaning, camera inspection and sewer or drain pipe repair and replacement.',
  },
]

export const ALSO_HELP = [
  'Emergency Plumbing',
  'Camera Inspection',
  'Plumbing Inspection',
  'Leak Detection',
  'Light Commercial Plumbing',
  'Outdoor Plumbing',
  'Water Filters',
  'Garbage Disposals',
  'Water and Gas Piping',
  'Laundry Room Plumbing',
]

export const WHY_US = [
  'Always available for emergencies',
  'Licensed & insured',
  '25 years of experience',
  'Punctual to appointments',
]

export const GALLERY = [
  { src: '/images/jobs/gas-line-for-heater-grill.webp', alt: 'Gas line installation for a heater or grill' },
  { src: '/images/jobs/general-plumbing.webp', alt: 'Finished under-sink plumbing and garbage disposal installation' },
  { src: '/images/jobs/laundry-room-plumbing.webp', alt: 'Laundry room plumbing installation' },
  { src: '/images/jobs/main-water-line-repair.webp', alt: 'Excavated main water line repair' },
  { src: '/images/jobs/main-water-line-replacement.webp', alt: 'Main water line replacement at a North Georgia home' },
  { src: '/images/jobs/sewer-line-repair.webp', alt: 'Excavated sewer line repair' },
  { src: '/images/jobs/tankless-water-heaters.webp', alt: 'Installed tankless water heater' },
  { src: '/images/jobs/water-heaters-2.webp', alt: 'Water heater installation with expansion tank' },
  { src: '/images/jobs/water-heaters.webp', alt: 'Finished water heater installation' },
  ...Array.from({ length: 16 }, (_, i) => ({
    src: `/images/gal${i + 1}.png`,
    alt: 'Completed plumbing installation by Georgia 5 Star Plumbing',
  })),
]

export const REVIEWS = [
  {
    name: 'Carl Raab',
    body: 'Jiv is a "pro". After dealing with other "so called" plumbing concerns, and seeing Jiv work we were very glad to have his services. We were amazed at the beautiful job he did, and are no longer concerned about recurring plumbing problems he solved. Thanks Jiv!',
  },
  {
    name: 'John Rehm Jr',
    body: 'Jiv was great! He was very careful and neat. He installed three toilets in our house and made sure they were all level and straight. He is a craftsman and has much experience. We did not find any mistakes in all three bathrooms.',
  },
  {
    name: 'Bianca Maynard',
    body: "My water heater went out on me this weekend. I felt compelled to write this review on behalf of Stephen who gave excellent customer service and took the time to ensure that I understood all the issues regarding my new installation and future maintenance needs. They don't make them like Stephen anymore. Kudos!",
  },
  {
    name: 'Suzanne Ziemann',
    body: 'J.J. was right on time, explained all the necessary repairs and warranty coverage. He was great help in store obtaining new product since the clerk had no idea how to process return of the discontinued product that was still 100% under warranty. Professional and polite. A+',
  },
  {
    name: 'Miles Denson',
    body: 'Both plumbers were courteous, knowledgeable, professional on our hot water repair. Thank you!',
  },
  {
    name: 'Betty Ann Blake',
    body: 'Stephen was very thorough and professional. He was very knowledgeable and I would definitely recommend him for your plumbing needs.',
  },
  {
    name: 'Donald Herod',
    body: 'The service tech, Mr. Jiv J. or "JJ" called approximately 45 minutes prior to arriving and was very, very courteous. The repairs were more in depth than "JJ" expected but he stayed with it and finished. If there is an employee of the year award, Mr. Jiv J. should certainly receive it.',
  },
]

export const ABOUT = [
  'Jiv Jelev is the owner and operator of Georgia 5 Star Plumbing. Jiv is a Master Plumber with over 25 years of experience with plumbing and drain cleaning. What sets Georgia 5 Star Plumbing apart from the rest is that honesty and integrity are always our first priority.',
  'The company provides top notch equipment options, expertise and professional service for all your plumbing needs. We pride ourselves on personalized service, which is paramount to our success and makes you our loyal customer for life.',
]
