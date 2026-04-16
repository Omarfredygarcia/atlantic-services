'use client'

import { useState, useRef } from 'react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { useLang } from '@/lib/LanguageContext'

const galleryImages = [
  { src: '/images/COMMERCIAL/IMG-20260408-WA0025.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260408-WA0035.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260408-WA0053.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260408-WA0058.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260408-WA0074.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260408-WA0076.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0002.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0003.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0005.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0030.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0045.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0046.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0054.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0086.jpg', category: 'Commercial' },
  { src: '/images/COMMERCIAL/0ee6bdc6-7987-4af3-b6cc-611df374452f.webp', category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImage1dHQVG.webp', category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImage25xhxO.webp', category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImageJ46ZJ1.webp', category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImageLaWE9B.webp', category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImageSrA35c.webp', category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImageqoAuKg.webp', category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImagevvASAe.webp', category: 'Commercial' },
  { src: '/images/INTERIOR/IMG_4735.webp', category: 'Interior' },
  { src: '/images/INTERIOR/PHOTO-2023-05-02-17-56-49+29.webp', category: 'Interior' },
  { src: '/images/INTERIOR/PHOTO-2023-05-02-17-56-54.webp', category: 'Interior' },
  { src: '/images/INTERIOR/fe8b726d-e64c-410f-9678-6b5b553d282b.webp', category: 'Interior' },
  { src: '/images/INTERIOR/tempImageg5ncA9.webp', category: 'Interior' },
  { src: '/images/EXTERIOR/d7fbda8b-3fee-401f-949b-94bc17143fc9.webp', category: 'Exterior' },
  { src: '/images/REMODELING/tempImageMtSaY6.webp', category: 'Remodeling' },
  { src: '/images/REMODELING/tempImagesDXud9.webp', category: 'Remodeling' },
  { src: '/images/REMODELING/tempImagezZmvwQ.webp', category: 'Remodeling' },
  { src: '/images/WATERPROOFING/IMG_3976.webp', category: 'Waterproofing' },
  { src: '/images/WATERPROOFING/IMG_3977.webp', category: 'Waterproofing' },
  { src: '/images/WATERPROOFING/IMG_3979.webp', category: 'Waterproofing' },
  { src: '/images/WATERPROOFING/IMG_3980.webp', category: 'Waterproofing' },
  { src: '/images/WATERPROOFING/IMG_3981.webp', category: 'Waterproofing' },
  { src: '/images/WATERPROOFING/IMG_3982.webp', category: 'Waterproofing' },
]

const projects = [
  {
    title: { en: 'Commercial Build', es: 'Construcción Comercial' },
    category: { en: 'Commercial', es: 'Comercial' },
    before: '/images/BEFORE_AFTER/Comercial_Before.jpg',
    after: '/images/BEFORE_AFTER/comercial_after.jpg',
  },
  {
    title: { en: 'Kitchen Remodel', es: 'Remodelación de Cocina' },
    category: { en: 'Remodeling', es: 'Remodelación' },
    before: '/images/BEFORE_AFTER/Coke_before.jpg',
    after: '/images/BEFORE_AFTER/Coke_after.jpg',
  },
  {
    title: { en: 'Kitchen Transformation', es: 'Transformación de Cocina' },
    category: { en: 'Remodeling', es: 'Remodelación' },
    before: '/images/BEFORE_AFTER/Coke_before_2.jpg',
    after: '/images/BEFORE_AFTER/Coke_after_2.jpg',
  },
  {
    title: { en: 'Bathroom Remodel', es: 'Remodelación de Baño' },
    category: { en: 'Remodeling', es: 'Remodelación' },
    before: '/images/BEFORE_AFTER/bath_before.jpg',
    after: '/images/BEFORE_AFTER/bath_after.jpg',
  },
]

function BeforeAfterSlider({
  before,
  after,
  title,
  category,
}: {
  before: string
  after: string
  title: string
  category: { en: string; es: string }
}) {
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const { t, lang } = useLang()

  function handleMove(clientX: number) {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const pos = ((clientX - rect.left) / rect.width) * 100
    setSliderPos(Math.min(Math.max(pos, 0), 100))
  }

  return (
    <div className="group relative overflow-hidden rounded-sm bg-gray-900">
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] cursor-ew-resize select-none"
        onMouseDown={() => {
          isDragging.current = true
        }}
        onMouseUp={() => {
          isDragging.current = false
        }}
        onMouseLeave={() => {
          isDragging.current = false
        }}
        onMouseMove={(e) => {
          if (isDragging.current) handleMove(e.clientX)
        }}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      >
        <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
          <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10" style={{ left: `${sliderPos}%` }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#E2B84A] border-2 border-white flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
              <path d="M9 18l-6-6 6-6M15 6l6 6-6 6" />
            </svg>
          </div>
        </div>
        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm">
          {lang === 'es' ? 'Antes' : 'Before'}
        </div>
        <div className="absolute top-3 right-3 bg-[#E2B84A] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm">
          {lang === 'es' ? 'Después' : 'After'}
        </div>
      </div>

      <div className="p-5 bg-[#3D4F5C]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#E2B84A] mb-1">
          {category[lang]}
        </p>
        <h3 className="font-serif text-lg font-semibold text-white">{title[lang]}</h3>
        <p className="text-xs text-white/50 mt-1">
          {t.gallery.sliderHint}
        </p>
      </div>
    </div>
  )
}

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [lightbox, setLightbox] = useState<string | null>(null)
  const { t, lang } = useLang()

  const filtered =
    activeCategory === 'All'
      ? galleryImages
      : galleryImages.filter((img) => img.category === activeCategory)

  const categoryMap: Record<string, string> = {
    All: 'All',
    Todos: 'All',
    Commercial: 'Commercial',
    Comercial: 'Commercial',
    Interior: 'Interior',
    Exterior: 'Exterior',
    Remodeling: 'Remodeling',
    Remodelación: 'Remodeling',
    Waterproofing: 'Waterproofing',
    Impermeabilización: 'Waterproofing',
  }

  return (
    <main>
      <Navbar />

      <section className="bg-black py-16 px-6 md:px-10 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-3">{t.gallery.badge}</p>
        <h1 className="font-serif text-5xl font-semibold text-white mb-5">{t.gallery.title}</h1>
        <p className="text-lg text-white/60 font-light max-w-xl mx-auto">{t.gallery.subtitle}</p>
      </section>

      <section className="bg-[#3D4F5C] py-16 px-6 md:px-10">
        <div className="text-center mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-2">
            {t.gallery.transformationsBadge}
          </p>
          <h2 className="font-serif text-4xl font-semibold text-white">{t.gallery.transformationsTitle}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {projects.map((project, index) => (
            <BeforeAfterSlider key={index} {...project} />
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-16 px-6 md:px-10">
        <div className="text-center mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-2">
            {t.gallery.portfolioBadge}
          </p>
          <h2 className="font-serif text-4xl font-semibold text-gray-900 mb-8">{t.gallery.portfolioTitle}</h2>

          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {(t.gallery.categories || ['All', 'Commercial', 'Interior', 'Exterior', 'Remodeling', 'Waterproofing']).map(
              (cat: string) => {
                const actual = categoryMap[cat] || cat
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(actual)}
                    className={`px-5 py-2 text-sm font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                      activeCategory === actual
                        ? 'bg-[#C9A84C] text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#C9A84C] hover:text-[#C9A84C]'
                    }`}
                  >
                    {cat}
                  </button>
                )
              }
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-7xl mx-auto">
          {filtered.map((img, index) => (
            <div
              key={index}
              className="relative aspect-square overflow-hidden rounded-sm cursor-pointer group"
              onClick={() => setLightbox(img.src)}
            >
              <img src={img.src} alt={img.category} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[#C9A84C] text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-sm">
                  {img.category}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-6 right-6 text-white text-4xl font-light hover:text-[#C9A84C] transition-colors"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          <img
            src={lightbox}
            alt="Project"
            className="max-w-full max-h-full object-contain rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Footer />
    </main>
  )
}