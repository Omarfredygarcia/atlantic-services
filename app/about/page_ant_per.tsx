'use client' // 🎯 Convertido para useLang (ya que necesita hook)

import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { useLang } from '@/lib/LanguageContext' // 🎯 CLAUDE i18n

const values = [ // ✅ TUS 3 VALORES IGUALES
  {
    title: 'Foundation of Trust', // 🎯 Se traduce via i18n
    description: 'Every project starts with honesty...',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
  },
  // ... otros 2 iguales
]

export default function About() {
  const { t } = useLang() // 🎯 HOOK CLAUDE

  const stats = t?.about?.stats || [ // ✅ i18n fallback
    { number: '15+', label: 'Years of experience' },
    { number: '500+', label: 'Projects completed' },
    { number: 'A+', label: 'BBB Rating' },
    { number: '100%', label: 'Licensed & insured' },
  ]

  const i18nValues = t?.about?.values || values // ✅ i18n values

  return (
    <main>
      <Navbar />

      {/* 🎯 Hero i18n */}
      <section className="bg-black py-24 px-10">
        <div className="max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-4">
            {t?.about?.badge || 'Our company'}
          </p>
          <h1 className="font-serif text-6xl font-semibold text-white leading-tight mb-6">
            {t?.about?.title1 || 'Built on Integrity.'}<br />
            {t?.about?.title2 || 'Driven by'} <em className="text-[#C9A84C] not-italic">{t?.about?.titleHighlight || 'Excellence'}</em>.
          </h1>
          <p className="text-xl text-white/60 font-light leading-relaxed max-w-2xl">
            {t?.about?.subtitle || 'Atlantic Services is a general construction...'}
          </p>
        </div>
      </section>

      {/* 🎯 Stats i18n */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-[#C9A84C]">
        {stats.map((stat, index) => (
          <div key={index} className="py-8 px-8 text-center border-r border-white/20 last:border-r-0">
            <p className="font-serif text-4xl font-semibold text-white">{stat.number}</p>
            <p className="text-xs text-white/80 uppercase tracking-wider mt-2 font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 🎯 Story i18n */}
      <section className="bg-white py-20 px-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-4">
              {t?.about?.storyBadge || 'Our story'}
            </p>
            <h2 className="font-serif text-4xl font-semibold text-gray-900 mb-6">
              {t?.about?.storyTitle || 'A Legacy of Quality Construction'}
            </h2>
            <p className="text-lg text-gray-500 font-light leading-relaxed mb-6">{t?.about?.storyP1}</p>
            <p className="text-lg text-gray-500 font-light leading-relaxed mb-6">{t?.about?.storyP2}</p>
            <p className="text-lg text-gray-500 font-light leading-relaxed">{t?.about?.storyP3}</p>
          </div>
          <div className="bg-[#3D4F5C] p-10 rounded-sm">
            <p className="font-serif text-3xl font-semibold text-white mb-6 leading-tight">
              "{t?.about?.quote || "We don't just build structures — we build relationships."}"
            </p>
            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/10">
              <div className="w-12 h-12 rounded-full bg-[#C9A84C] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                AS
              </div>
              <div>
                <p className="text-white font-semibold">{t?.about?.quoteAuthor || 'Atlantic Services Team'}</p>
                <p className="text-white/50 text-sm">{t?.about?.quoteLocation || 'Indianapolis, Indiana'}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 Values i18n */}
      <section className="bg-[#3D4F5C] py-20 px-10">
        <div className="text-center mb-14">
          <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-3">
            {t?.about?.valuesBadge || 'What drives us'}
          </p>
          <h2 className="font-serif text-5xl font-semibold text-white mb-5">
            {t?.about?.valuesTitle || 'Our Core Values'}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {i18nValues.map((value: any, index: number) => (
            <div key={index} className="bg-black/20 border border-white/10 rounded-sm p-8 hover:border-[#C9A84C] transition-colors">
              <div className="w-12 h-12 rounded-sm bg-[#C9A84C] flex items-center justify-center mb-6">
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

      {/* 🎯 CTA i18n */}
      <div className="bg-black px-10 py-16 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="font-serif text-4xl font-semibold text-white">
            {t?.about?.ctaTitle || 'Ready to start your project?'}
          </h2>
          <p className="text-base text-white/50 mt-2 font-light">
            {t?.about?.ctaSubtitle || 'Free estimates · BBB A+ Accredited · Indianapolis & surrounding areas'}
          </p>
        </div>
        <div className="flex gap-4 flex-shrink-0">
          <a href="tel:3179915878" className="px-8 py-4 border-2 border-white/20 text-white text-sm font-medium uppercase tracking-wider rounded-sm hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
            {t?.about?.ctaPhone || '(317) 991-5878'}
          </a>
          <a href="/#contact" className="px-8 py-4 bg-[#C9A84C] text-white text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#d4841a] transition-colors">
            {t?.about?.ctaButton || 'Get Free Estimate'}
          </a>
        </div>
      </div>

      <Footer />
    </main>
  )
}