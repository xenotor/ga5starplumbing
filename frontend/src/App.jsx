import { useEffect } from 'react'
import Header from './components/Header'
import Hero from './components/Hero'
import Services from './components/Services'
import About from './components/About'
import Gallery from './components/Gallery'
import Reviews from './components/Reviews'
import Booking from './components/Booking'
import Footer from './components/Footer'
import { captureAttribution } from './lib/attribution'

export default function App() {
  // First paint is the only moment the ad params are guaranteed present.
  useEffect(() => {
    captureAttribution()
  }, [])

  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <About />
        <Gallery />
        <Reviews />
        <Booking />
      </main>
      <Footer />
    </>
  )
}
