'use client'

import { useState } from 'react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { useLang } from '@/lib/LanguageContext'

const valueIcons = [
  'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
  'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
]

const PRESENTATION_VIDEO_ID = 'wSTu8Ry4rKM'

function PresentationVideo() {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="flex justify-center">
      <div
        className="relative overflow-hidden rounded-sm shadow-2xl"
        style={{ aspectRatio: '9/16', width: '100%', maxWidth: '380px' }}
      >
        {playing ? (
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${PRESENTATION_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
            title="Atlantic Services — Company Presentation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 cursor-pointer group" onClick={() => setPlaying(true)}>
            <img
              src={`https://img.youtube.com/vi/${PRESENTATION_VIDEO_ID}/hqdefault.jpg`}
              alt="Atlantic Services — Company Presentation"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-[#E2B84A] flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-300">
                <svg viewBox="0 0 24 24" fill="white" className="w-9 h-9 ml-1">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
            <div className="absolute bottom-5 left-0 right-0 text-center">
              <span className="bg-black/70 text-white text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-sm">
                Watch Our Story
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function About() {
  const { t, lang } = useLang()
  const a = t.about

  const videoBadge   = lang === 'es' ? 'Véanos en acción'      : 'See us in action'
  const videoTitle   = lang === 'es' ? 'Conozca Atlantic Services' : 'Meet Atlantic Services'
  const videoSubtitle = lang === 'es'
    ? 'Vea de primera mano la calidad, dedicación y profesionalismo que nos han convertido en un nombre de confianza en la construcción en Indianapolis y el Medio Oeste durante más de 30 años.'
    : 'See firsthand the quality, dedication and professionalism that have made us a trusted name in construction across Indianapolis and the Midwest for over 30 years.'

  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="bg-black py-24 px-10">
        <div className="max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-4">{a.badge}</p>
          <h1 className="font-serif text-6xl font-semibold text-white leading-tight mb-6">
            {a.title1}<br />
            {a.title2} <em className="text-[#C9A84C] not-italic">{a.titleHighlight}</em>
          </h1>
          <p className="text-xl text-white/60 font-light leading-relaxed max-w-2xl">{a.subtitle}</p>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 bg-[#C9A84C]">
        {a.stats.map((stat, index) => (
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
            <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-4">{a.storyBadge}</p>
            <h2 className="font-serif text-4xl font-semibold text-gray-900 mb-6">{a.storyTitle}</h2>
            <p className="text-lg text-gray-500 font-light leading-relaxed mb-6">{a.storyP1}</p>
            <p className="text-lg text-gray-500 font-light leading-relaxed mb-6">{a.storyP2}</p>
            <p className="text-lg text-gray-500 font-light leading-relaxed">{a.storyP3}</p>
          </div>
          <div className="bg-[#3D4F5C] p-10 rounded-sm">
            <p className="font-serif text-3xl font-semibold text-white mb-6 leading-tight">"{a.quote}"</p>
            <div className="flex items-center gap-4 mt-8 pt-8 border-t border-white/10">
              <div className="w-12 h-12 rounded-full bg-[#C9A84C] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">AS</div>
              <div>
                <p className="text-white font-semibold">{a.quoteAuthor}</p>
                <p className="text-white/50 text-sm">{a.quoteLocation}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── VIDEO DE PRESENTACIÓN ── */}
      <section className="bg-black py-20 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-4">{videoBadge}</p>
              <h2 className="font-serif text-4xl font-semibold text-white mb-6 leading-tight">{videoTitle}</h2>
              <p className="text-lg text-white/60 font-light leading-relaxed mb-8">{videoSubtitle}</p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/>
                    </svg>
                  </div>
                  <p className="text-white/80 text-sm">BBB A+ Accredited · Licensed & Insured</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/>
                    </svg>
                  </div>
                  <p className="text-white/80 text-sm">30+ years · 500+ projects completed</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-sm bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4"/>
                    </svg>
                  </div>
                  <p className="text-white/80 text-sm">Serving IN, IL, OH, MI & KY</p>
                </div>
              </div>
            </div>
            <PresentationVideo />
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#3D4F5C] py-20 px-10">
        <div className="text-center mb-14">
          <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-3">{a.valuesBadge}</p>
          <h2 className="font-serif text-5xl font-semibold text-white mb-5">{a.valuesTitle}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {a.values.map((value, index) => (
            <div key={index} className="bg-black/20 border border-white/10 rounded-sm p-8 hover:border-[#C9A84C] transition-colors">
              <div className="w-12 h-12 rounded-sm bg-[#C9A84C] flex items-center justify-center mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d={valueIcons[index]} />
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
          <h2 className="font-serif text-4xl font-semibold text-white">{a.ctaTitle}</h2>
          <p className="text-base text-white/50 mt-2 font-light">{a.ctaSubtitle}</p>
        </div>
        <div className="flex gap-4 flex-shrink-0">
          <a href="tel:3177392540" className="px-8 py-4 border-2 border-white/20 text-white text-sm font-medium uppercase tracking-wider rounded-sm hover:border-[#C9A84C] hover:text-[#C9A84C] transition-colors">
            {a.ctaPhone}
          </a>
          <a href="/#contact" className="px-8 py-4 bg-[#C9A84C] text-white text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#d4841a] transition-colors">
            {a.ctaButton}
          </a>
        </div>
      </div>

      <Footer />
    </main>
  )
}
