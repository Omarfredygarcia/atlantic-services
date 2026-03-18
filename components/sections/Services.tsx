const services = [
  { title: 'Flooring', description: 'Hardwood, tile, laminate & carpet installed to last.', svg: 'M3 3h18v4H3zM3 9h18v4H3zM3 15h18v4H3z' },
  { title: 'Residential', description: 'Full home builds and remodels tailored to your vision.', svg: 'M3 12L12 3l9 9M5 10v9h5v-5h4v5h5v-9' },
  { title: 'Commercial', description: 'Office, retail & industrial builds done at scale.', svg: 'M3 21V7l9-4 9 4v14M9 21V11h6v10' },
  { title: 'Restoration', description: 'Water, fire & disaster damage restored fast.', svg: 'M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3-3a1 1 0 000-1.4l-1.6-1.6a1 1 0 00-1.4 0zM5 20L3 21l1-2 9.5-9.5 1 1zM19 11l-8 8' },
  { title: 'Painting', description: 'Interior & exterior premium finishes.', svg: 'M2 13.5V20h6.5L20 8.5 14.5 3 2 13.5zM22 6l-3-3-1.5 1.5 3 3L22 6z' },
  { title: 'Siding & Exterior', description: 'Hardie plank, vinyl, custom curb appeal.', svg: 'M2 20h20M4 20V8l8-5 8 5v12M9 20v-6h6v6' },
  { title: 'Doors & Windows', description: 'Energy-efficient, high-quality installations.', svg: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z' },
  { title: 'Carpentry', description: 'Custom woodwork, installations & repairs.', svg: 'M15 5l-9 9 2 2 9-9-2-2zM5 14l-2 5 5-2-3-3zM19 3l-3 3 2 2 3-3-2-2z' },
]

export default function Services() {
  return (
    <section className="py-20 bg-[#2E3D47]">
      <div className="text-center mb-14 px-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-[#E8951A] mb-3">What we do</p>
        <h2 className="font-serif text-5xl font-semibold text-white mb-5">Our Services</h2>
        <p className="text-lg text-white/60 font-light max-w-xl mx-auto leading-relaxed">
          From small repairs to full-scale construction — we handle every project with the same level of precision and care.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4">
        {services.map((service, index) => (
          <div key={index}
            className="p-8 border border-white/10 cursor-pointer group transition-all duration-300 hover:bg-[#E8951A] relative overflow-hidden bg-[#3D4F5C]">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#E8951A] group-hover:bg-white transition-colors"></div>
            <div className="w-12 h-12 rounded-sm bg-[#E8951A]/20 flex items-center justify-center mb-5 group-hover:bg-white/20 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="#E8951A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 group-hover:stroke-white transition-colors">
                <path d={service.svg} />
              </svg>
            </div>
            <h3 className="font-serif text-xl font-semibold text-white mb-3">{service.title}</h3>
            <p className="text-sm text-white/60 group-hover:text-white/90 leading-relaxed font-light transition-colors">{service.description}</p>
            <p className="text-[#E8951A] group-hover:text-white text-sm font-semibold mt-5 opacity-0 group-hover:opacity-100 transition-all">Learn more →</p>
          </div>
        ))}
      </div>
    </section>
  )
}