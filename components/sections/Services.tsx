const services = [
  {
    title: 'Flooring',
    description: 'Hardwood, tile, laminate & carpet installed to last.',
    image: '/images/INTERIOR/IMG_4735.webp',
    icon: 'M3 3h18v4H3zM3 9h18v4H3zM3 15h18v4H3z'
  },
  {
    title: 'Residential',
    description: 'Full home builds and remodels tailored to your vision.',
    image: '/images/COMMERCIAL/tempImage1dHQVG.webp',
    icon: 'M3 12L12 3l9 9M5 10v9h5v-5h4v5h5v-9'
  },
  {
    title: 'Commercial',
    description: 'Office, retail & industrial builds done at scale.',
    image: '/images/COMMERCIAL/tempImageSrA35c.webp',
    icon: 'M3 21V7l9-4 9 4v14M9 21V11h6v10'
  },
  {
    title: 'Restoration',
    description: 'Water, fire & disaster damage restored fast.',
    image: '/images/WATERPROOFING/IMG_3976.webp',
    icon: 'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0v20M2 12h20'
  },
  {
    title: 'Painting',
    description: 'Interior & exterior premium finishes.',
    image: '/images/EXTERIOR/d7fbda8b-3fee-401f-949b-94bc17143fc9.webp',
    icon: 'M2 13.5V20h6.5L20 8.5 14.5 3 2 13.5zM22 6l-3-3-1.5 1.5 3 3L22 6z'
  },
  {
    title: 'Siding & Exterior',
    description: 'Hardie plank, vinyl, custom curb appeal.',
    image: '/images/COMMERCIAL/tempImageLaWE9B.webp',
    icon: 'M2 20h20M4 20V8l8-5 8 5v12M9 20v-6h6v6'
  },
  {
    title: 'Doors & Windows',
    description: 'Energy-efficient, high-quality installations.',
    image: '/images/INTERIOR/PHOTO-2023-05-02-17-56-49+29.webp',
    icon: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z'
  },
  {
    title: 'Carpentry',
    description: 'Custom woodwork, installations & repairs.',
    image: '/images/REMODELING/tempImageMtSaY6.webp',
    icon: 'M15 5l-9 9 2 2 9-9-2-2zM5 14l-2 5 5-2-3-3zM19 3l-3 3 2 2 3-3-2-2z'
  },
]

export default function Services() {
  return (
    <section id="services" className="py-20 bg-gray-50 scroll-mt-24">
      <div className="text-center mb-14 px-10">
        <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-3">What we do</p>
        <h2 className="font-serif text-5xl font-semibold text-gray-900 mb-5">Our Services</h2>
        <p className="text-lg text-gray-500 font-light max-w-xl mx-auto leading-relaxed">
          From small repairs to full-scale construction — we handle every project with the same level of precision and care.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 px-6 md:px-10">
        {services.map((service, index) => (
          <div key={index}
            className="group relative overflow-hidden rounded-sm cursor-pointer border-2 border-transparent hover:border-[#C9A84C] hover:shadow-xl transition-all duration-300">
            
            {/* Image background */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-[#3D4F5C]/40 group-hover:bg-[#3D4F5C]/20 transition-colors duration-300"></div>

              {/* Icon */}
              <div className="absolute top-4 left-4 w-10 h-10 rounded-sm bg-[#C9A84C] flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d={service.icon} />
                </svg>
              </div>

              {/* Arrow */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.5" className="w-4 h-4">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 bg-white">
              <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#C9A84C] transition-colors">{service.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-light">{service.description}</p>
            </div>

          </div>
        ))}
      </div>
    </section>
  )
}
