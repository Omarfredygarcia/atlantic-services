'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useLang } from '@/lib/LanguageContext'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t, lang, toggleLang } = useLang()
  const n = t.nav

  return (
    <nav className="bg-black sticky top-0 z-50 border-b border-white/10">
      <div className="flex justify-between items-center px-6 py-2">
        <a href="/">
          <Image src="/images/Logo-transparent.png" alt="Atlantic Services" width={200} height={80} className="object-contain" priority />
        </a>

        <ul className="hidden md:flex gap-8 list-none">
          <li><a href="/#services" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">{n.services}</a></li>
          <li><a href="/gallery" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">{n.projects}</a></li>
          <li><a href="/about" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">{n.about}</a></li>
          <li><a href="/#contact" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">{n.contact}</a></li>
        </ul>

        <div className="flex items-center gap-3">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className="hidden md:flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-3 py-1.5 border border-white/20 text-white/70 rounded-sm hover:border-[#E2B84A] hover:text-[#E2B84A] transition-colors"
          >
            {lang === 'en' ? '🇪🇸 ES' : '🇺🇸 EN'}
          </button>

          <a href="/#contact" className="hidden md:block text-sm font-bold uppercase tracking-wider px-6 py-3 bg-[#E2B84A] text-white rounded-sm hover:bg-[#c49a2e] transition-colors">
            {n.cta}
          </a>

          <button className="md:hidden flex flex-col gap-1.5 p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden bg-black border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          <a href="/#services" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">{n.services}</a>
          <a href="/gallery" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">{n.projects}</a>
          <a href="/about" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">{n.about}</a>
          <a href="/#contact" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">{n.contact}</a>
          {/* Language toggle mobile */}
          <button onClick={toggleLang} className="text-left text-base font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">
            {lang === 'en' ? '🇪🇸 Español' : '🇺🇸 English'}
          </button>
          <a href="/#contact" onClick={() => setMenuOpen(false)} className="w-full text-center py-3 bg-[#E2B84A] text-white text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#c49a2e] transition-colors">
            {n.cta}
          </a>
        </div>
      )}
    </nav>
  )
}