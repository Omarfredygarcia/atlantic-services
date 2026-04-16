'use client'
import { useLang } from '@/lib/LanguageContext'

export default function Testimonials() {
  const { t } = useLang()
  const tr = t.testimonials
  return (
    <section className="bg-white px-10 py-16">
      <div className="text-center mb-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#E2B84A] mb-3">{tr.badge}</p>
        <h2 className="font-serif text-5xl font-semibold text-gray-900 mb-5">{tr.title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tr.items.map((t, index) => (
          <div key={index} className="bg-white border-2 border-gray-100 rounded-sm p-7 hover:border-[#E2B84A] transition-colors group">
            <p className="text-[#E2B84A] tracking-widest mb-4 text-lg">★★★★★</p>
            <p className="text-base text-gray-600 leading-relaxed italic mb-6 font-light">"{t.text}"</p>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#E2B84A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{t.initials}</div>
              <div>
                <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                <p className="text-xs text-gray-500">{t.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}