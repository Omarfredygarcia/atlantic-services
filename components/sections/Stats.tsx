'use client'
import { useLang } from '@/lib/LanguageContext'

export default function Stats() {
  const { t } = useLang()
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 bg-[#E2B84A]">
      {t.stats.map((stat, index) => (
        <div key={index} className="py-8 px-8 text-center border-r border-white/20 last:border-r-0">
          <p className="font-serif text-4xl font-semibold text-white">{stat.number}</p>
          <p className="text-xs text-white/80 uppercase tracking-wider mt-2 font-medium">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}