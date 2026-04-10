import Image from 'next/image'

export default function Hero() {
  return (
    <section className="min-h-[600px] flex items-center relative overflow-hidden">
      
      <Image
        src="/images/hero.jpg"
        alt="Atlantic Services Project"
        fill
        className="object-cover object-center"
        priority
      />

      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 px-16 py-20 max-w-4xl">
        <p className="text-sm font-semibold tracking-[0.25em] uppercase text-[#E2B84A] mb-6">
          Indianapolis, Indiana · Licensed & Insured
        </p>
        <h1 className="font-serif text-6xl md:text-7xl font-semibold text-white leading-tight mb-8">
          Building on the<br />Principle of{' '}
          <em className="text-[#E2B84A] not-italic border-b-4 border-[#E2B84A]">Integrity</em>
        </h1>
        <p className="text-xl font-light text-white/75 leading-relaxed mb-10 max-w-2xl">
          From flooring and painting to full-scale restoration and commercial construction — precision craftsmanship, delivered on time and on budget.
        </p>
        <div className="flex gap-4 flex-wrap">
          <a href="/#contact" className="text-sm font-bold uppercase tracking-wider px-6 py-3 bg-[#E2B84A] text-white rounded-sm hover:bg-[#c49a2e] transition-colors">
            Free Estimate
          </a>
          <a href="/gallery" className="px-10 py-4 border-2 border-white/40 text-white text-sm font-medium uppercase tracking-wider rounded-sm hover:border-[#E2B84A] hover:text-[#E2B84A] transition-colors">
            View Our Work →
          </a>
        </div>
      </div>

    </section>
  )
}