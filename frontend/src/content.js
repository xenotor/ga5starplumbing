/** Site copy, carried over verbatim from the legacy static page. */

export const PHONE = '404.488.4889'
export const PHONE_HREF = 'tel:+14044884889'
export const EMAIL = 'georgia5starplumbing@gmail.com'

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
  { href: '#book', label: 'Book' },
]

export const SERVICES = [
  {
    image: '/images/repair.png',
    title: 'Installation & Repair',
    body: 'Our team has made numerous plumbing and gas line diagnosis and repairs.',
  },
  {
    image: '/images/waterheater.png',
    title: 'Water Heaters',
    body: 'Experienced in a variety of water heater repairs and installation, including tankless and hybrid.',
  },
  {
    image: '/images/bathroom.png',
    title: 'Bathroom Remodels',
    body: 'From leaky pipes to new installations, we will cover all plumbing needs.',
  },
  {
    image: '/images/drain.png',
    title: 'Drain Cleaning',
    body: 'You need a plumbing professional when replacing sewer and drain pipes.',
  },
]

export const ALSO_HELP = [
  'Emergency Plumbing',
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

export const GALLERY = Array.from({ length: 16 }, (_, i) => ({
  src: `/images/gal${i + 1}.png`,
  alt: `Georgia 5 Star Plumbing completed job ${i + 1}`,
}))

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
