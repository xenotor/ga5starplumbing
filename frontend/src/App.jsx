import Header from './components/Header'
import Hero from './components/Hero'
import Services from './components/Services'
import About from './components/About'
import Gallery from './components/Gallery'
import Reviews from './components/Reviews'
import Footer from './components/Footer'
import MobileCallBar from './components/MobileCallBar'
import { BookingSection } from './booking'

export default function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Services />
        <About />
        <Gallery />
        <Reviews />
        <BookingSection />
      </main>
      <Footer />
      <MobileCallBar />
    </>
  )
}
