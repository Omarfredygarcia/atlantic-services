const testimonials = [
  {
    text: 'Atlantic Services transformed our kitchen completely. The team was professional, on time, and the quality exceeded our expectations.',
    name: 'Michael R.',
    role: 'Homeowner · Indianapolis',
    initials: 'MR',
  },
  {
    text: 'We hired them for our office renovation and they delivered everything on budget. Communication was clear throughout the entire project.',
    name: 'Sarah L.',
    role: 'Business Owner · Carmel, IN',
    initials: 'SL',
  },
  {
    text: 'After water damage destroyed our basement, Atlantic had it fully restored in under two weeks. Incredibly reliable and trustworthy team.',
    name: 'James T.',
    role: 'Homeowner · Fishers, IN',
    initials: 'JT',
  },
]

export default function Testimonials() {
  return (
    <section className="bg-white px-10 py-16">
      <div className="text-center mb-12">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#E2B84A] mb-3">Client reviews</p>
        <h2 className="font-serif text-5xl font-semibold text-gray-900 mb-5">What our clients say</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {testimonials.map((t, index) => (
          <div key={index} className="bg-white border-2 border-gray-100 rounded-sm p-7 hover:border-[#E2B84A] transition-colors group">
            <p className="text-[#E2B84A] tracking-widest mb-4 text-lg">★★★★★</p>
            <p className="text-base text-gray-600 leading-relaxed italic mb-6 font-light">"{t.text}"</p>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <div className="w-10 h-10 rounded-full bg-[#E2B84A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {t.initials}
              </div>
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
