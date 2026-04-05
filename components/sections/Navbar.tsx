'use client'

import Image from 'next/image'
import { useState } from 'react'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="bg-black sticky top-0 z-50 border-b border-white/10">
      <div className="flex justify-between items-center px-6 py-2">
        <a href="/">
          <Image
            src="/images/Logo-transparent.png"
            alt="Atlantic Services"
            width={250}
            height={100}
            className="object-contain"
            priority
          />
        </a>

        {/* Desktop menu */}
        <ul className="hidden md:flex gap-8 list-none">
          <li><a href="/#services" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">Services</a></li>
          <li><a href="/gallery" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">Projects</a></li>
          <li><a href="/about" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">About</a></li>
          <li><a href="/#contact" className="text-sm font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">Contact</a></li>
        </ul>

        <div className="flex items-center gap-4">
          <a href="/#contact" className="hidden md:block text-sm font-bold uppercase tracking-wider px-6 py-3 bg-[#E2B84A] text-white rounded-sm hover:bg-[#c49a2e] transition-colors">
            Free Estimate
          </a>

          {/* Hamburger button */}
          <button
            className="md:hidden flex flex-col gap-1.5 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-6 h-0.5 bg-white transition-all duration-300 ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-black border-t border-white/10 px-6 py-6 flex flex-col gap-5">
          <a href="/#services" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">Services</a>
          <a href="/gallery" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">Projects</a>
          <a href="/about" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">About</a>
          <a href="/#contact" onClick={() => setMenuOpen(false)} className="text-base font-semibold text-white/80 uppercase tracking-wider hover:text-[#E2B84A] transition-colors">Contact</a>
          <a href="/#contact" onClick={() => setMenuOpen(false)} className="w-full text-center py-3 bg-[#E2B84A] text-white text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#c49a2e] transition-colors">
            Free Estimate
          </a>
        </div>
      )}
    </nav>
  )
}
