import Hero from '@/components/sections/Hero'
import Stats from '@/components/sections/Stats'
import Services from '@/components/sections/Services'
import Testimonials from '@/components/sections/Testimonials'
import ContactForm from '@/components/sections/ContactForm'
import CtaBar from '@/components/sections/CtaBar'
import Footer from '@/components/sections/Footer'
import Navbar from '@/components/sections/Navbar'
import AIVisualizer from '@/components/sections/AIVisualizer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Stats />
      <Services />
      <Testimonials />
      <ContactForm />
      <CtaBar />
      <Footer />
      <AIVisualizer />
    </main>
  )
}