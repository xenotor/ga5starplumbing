import Header from './components/Header'
import Hero from './components/Hero'
import Services from './components/Services'
import About from './components/About'
import Gallery from './components/Gallery'
import Reviews from './components/Reviews'
import ServiceAreas from './components/ServiceAreas'
import Footer from './components/Footer'
import MobileCallBar from './components/MobileCallBar'
import { BookingSection } from './booking'
import { SERVICE_AREAS } from './content'

export default function App() {
  const slug = window.location.pathname.match(/^\/plumber-([a-z]+)-ga\/?$/)?.[1]
  const area = SERVICE_AREAS.find((item) => item.slug === slug)

  return (
    <>
      <Header />
      <main>
        <Hero area={area} />
        <Services />
        <About />
        <Gallery />
        <Reviews />
        <ServiceAreas />
        <BookingSection />
      </main>
      <Footer />
      <MobileCallBar />
    </>
  )
}
