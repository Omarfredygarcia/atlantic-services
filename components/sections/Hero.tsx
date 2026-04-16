'use client'
import Image from 'next/image'
import { useLang } from '@/lib/LanguageContext'

export default function Hero() {
  const { t } = useLang()
  const h = t.hero
  return (
    <section className="min-h-[600px] flex items-center relative overflow-hidden">
      <Image src="/images/hero.jpg" alt="Atlantic Services Project" fill className="object-cover object-[35%_center] md:object-center" priority />
      <div className="absolute inset-0 bg-black/50"></div>
      <div className="relative z-10 px-6 md:px-16 py-16 md:py-20 max-w-4xl">
        <p className="text-xs md:text-sm font-semibold tracking-[0.25em] uppercase text-[#E2B84A] mb-4 md:mb-6">{h.badge}</p>
        <h1 className="font-serif text-4xl md:text-7xl font-semibold text-white leading-tight mb-6 md:mb-8">
          {h.title1}<br />{h.title2}{' '}
          <em className="text-[#E2B84A] not-italic border-b-4 border-[#E2B84A]">{h.titleHighlight}</em>
        </h1>
        <p className="text-base md:text-xl font-light text-white/75 leading-relaxed mb-8 md:mb-10 max-w-2xl">{h.subtitle}</p>
        <div className="flex gap-4 flex-wrap">
          <a href="/#contact" className="text-sm font-bold uppercase tracking-wider px-6 py-3 bg-[#E2B84A] text-white rounded-sm hover:bg-[#c49a2e] transition-colors">{h.ctaPrimary}</a>
          <a href="/gallery" className="px-8 py-3 md:px-10 md:py-4 border-2 border-white/40 text-white text-sm font-medium uppercase tracking-wider rounded-sm hover:border-[#E2B84A] hover:text-[#E2B84A] transition-colors">{h.ctaSecondary}</a>
        </div>
      </div>
    </section>
  )
}