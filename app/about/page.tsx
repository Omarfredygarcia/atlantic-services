import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'

const values = [
  {
    title: 'Foundation of Trust',
    description: 'Every project starts with honesty and a firm commitment to delivering what we promise. We believe trust is the foundation of every great relationship.',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  },
  {
    title: 'Commitment to Precision',
    description: 'Every detail matters. Our work is guided by meticulous planning and execution to ensure flawless results on every single project.',
    icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z'
  },
  {
    title: 'People at the Center',
    description: 'Our clients are at the heart of everything we do. Your vision inspires our work, and your satisfaction drives our success.',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z'
  },
]

const stats = [
  { number: '15+', label: 'Years of experience' },
  { number: '500+', label: 'Projects completed' },
  { number: 'A+', label: 'BBB Rating' },
  { number: '100%', label: 'Licensed & insured' },
]

export default function About() {
  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="bg-black py-24 px-10">
        <div className="max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#E8951A] mb-4">Our company</p>
          <h1 className="font-serif text-6xl font-semibold text-white leading-tight mb-6">
            Built on Integrity.<br />Driven by <em className="text-[#E8951A] not-italic">Excellence.</em>
          </h1>
          <p className="text-xl text-white/60 font-light leading-relaxed max-w-2xl">
            Atlantic Services is a general construction company based in Indianapolis, Indiana. For over 15 years we have delivered quality craftsmanship across residential, commercial and specialized construction projects.
          </p>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-[#E8951A]">
        {stats.map((stat, index) => (
          <div key={index} className="py-8 px-8 text-center border-r border-white/20 last:border-r-0">
            <p className="font-serif text-4xl font-semibold text-white">{stat.number}</p>
            <p className="text-xs text-white/80 uppercase tracking-wider mt-2 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Story */}
      <section className="bg-white py-20 px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#E8951A] mb-4">Our story</p>
            <h2 className="font-serif text-4xl font-semibold text-gray-900 mb-6">A Legacy of Quality Construction</h2>
            <p className="text-lg text-gray-500 font-light leading-relaxed mb-6">
              Atlantic Services was founded with a simple mission — to deliver construction projects that stand the test of time. From our first project in Indianapolis, we have grown into a trusted name in the region.
            </p>
            <p className="text-lg text-gray-500 font-light leading-relaxed mb-6">
              Our team of experienced craftsmen, project managers and designers work together to bring every client's vision to life — on time, on budget and beyond expectations.
            </p>
            <p className="text-lg text-gray-500 font-light leading-relaxed">
              We are proud to be BBB A+ accredited, fully licensed and insured, serving Indianapolis and surrounding areas including Carmel, Fishers, Zionsville and Westfield.
            </p>
          </div>
          <div className="bg-[#3D4F5C] p-10 rounded-sm">
            <p className="font-serif text-3xl font-semibold text-white mb-6 leading-tight">
              "We don't just build structures — we build relationships."
            </p>
            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/10">
              <div className="w-12 h-12 rounded-full bg-[#E8951A] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                AS
              </div>
              <div>
                <p className="text-white font-semibold">Atlantic Services Team</p>
                <p className="text-white/50 text-sm">Indianapolis, Indiana</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#3D4F5C] py-20 px-10">
        <div className="text-center mb-14">
          <p className="text-sm font-bold uppercase tracking-widest text-[#E8951A] mb-3">What drives us</p>
          <h2 className="font-serif text-5xl font-semibold text-white mb-5">Our Core Values</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {values.map((value, index) => (
            <div key={index} className="bg-black/20 border border-white/10 rounded-sm p-8 hover:border-[#E8951A] transition-colors">
              <div className="w-12 h-12 rounded-sm bg-[#E8951A] flex items-center justify-center mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d={value.icon} />
                </svg>
              </div>
              <h3 className="font-serif text-xl font-semibold text-white mb-3">{value.title}</h3>
              <p className="text-white/60 text-base font-light leading-relaxed">{value.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-black px-10 py-16 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="font-serif text-4xl font-semibold text-white">Ready to start your project?</h2>
          <p className="text-base text-white/50 mt-2 font-light">Free estimates · BBB A+ Accredited · Indianapolis & surrounding areas</p>
        </div>
        <div className="flex gap-4 flex-shrink-0">
          <a href="tel:3179915878" className="px-8 py-4 border-2 border-white/20 text-white text-sm font-medium uppercase tracking-wider rounded-sm hover:border-[#E8951A] hover:text-[#E8951A] transition-colors">
            (317) 991-5878
          </a>
          <a href="/#contact" className="px-8 py-4 bg-[#E8951A] text-white text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#d4841a] transition-colors">
            Get Free Estimate
          </a>
        </div>
      </div>

      <Footer />
    </main>
  )
}