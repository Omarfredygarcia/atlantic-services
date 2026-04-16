'use client'
import SocialLinks from './SocialLinks'
import { useLang } from '@/lib/LanguageContext'

export default function Footer() {
  const { t } = useLang()
  const f = t.footer
  return (
    <footer className="bg-[#3D4F5C] px-10 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-10">
        <div className="max-w-xs">
          <p className="font-serif text-2xl font-semibold text-white mb-2">ATLANTIC SERVICES</p>
          <p className="text-sm text-white/50 uppercase tracking-widest mb-4">{f.tagline}</p>
          <p className="text-sm text-white/60 leading-relaxed font-light">{f.description}</p>
          <SocialLinks />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#E2B84A] mb-4">{f.nav}</p>
          <div className="flex flex-col gap-3">
            {f.navLinks.map((link, i) => (
              <span key={i} className="text-base text-white/70 cursor-pointer hover:text-[#E2B84A] transition-colors">{link}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#E2B84A] mb-4">{f.contact}</p>
          <div className="flex flex-col gap-3">
            <p className="text-base text-white/70">(317) 991-5878</p>
            <p className="text-base text-white/70">(317) 607-1196</p>
            <p className="text-base text-white/70">info@atlanticser.com</p>
            <p className="text-base text-white/70">5341 W. 86th St.<br/>Indianapolis, IN 46268</p>
          </div>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-[#E2B84A] mb-4">{f.hours}</p>
          <div className="flex flex-col gap-3">
            {f.hoursItems.map((h, i) => (
              <p key={i} className="text-base text-white/70">{h}</p>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
        <p className="text-sm text-white/40">{f.copy}</p>
        <div className="flex gap-6">
          <span className="text-sm text-white/40 cursor-pointer hover:text-white/70 transition-colors">{f.privacy}</span>
          <span className="text-sm text-white/40 cursor-pointer hover:text-white/70 transition-colors">{f.bbb}</span>
        </div>
      </div>
    </footer>
  )
}