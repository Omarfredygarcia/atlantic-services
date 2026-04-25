'use client'

import { useState, useRef } from 'react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'
import { useLang } from '@/lib/LanguageContext'

const galleryImages = [
  // ── COMMERCIAL ──────────────────────────────────────────────────────────────
  { src: '/images/COMMERCIAL/IMG-20260408-WA0025.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260408-WA0035.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260408-WA0053.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260408-WA0058.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260408-WA0074.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260408-WA0076.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0002.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0003.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0005.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0030.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0045.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0046.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0054.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/IMG-20260409-WA0086.jpg',                        category: 'Commercial' },
  { src: '/images/COMMERCIAL/0ee6bdc6-7987-4af3-b6cc-611df374452f.webp',      category: 'Commercial' },
  { src: '/images/COMMERCIAL/12d58aef-6dc7-4e5c-84bf-0a5b3f85c153.webp',      category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImage1dHQVG.webp',                           category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImage25xhxO.webp',                           category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImageJ46ZJ1.webp',                           category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImageLaWE9B.webp',                           category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImageSrA35c.webp',                           category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImageqoAuKg.webp',                           category: 'Commercial' },
  { src: '/images/COMMERCIAL/tempImagevvASAe.webp',                           category: 'Commercial' },

  // ── INTERIOR ────────────────────────────────────────────────────────────────
  { src: '/images/INTERIOR/IMG_4735.webp',                                    category: 'Interior' },
  { src: '/images/INTERIOR/PHOTO-2023-05-02-17-56-49+29.webp',                category: 'Interior' },
  { src: '/images/INTERIOR/PHOTO-2023-05-02-17-56-54.webp',                   category: 'Interior' },
  { src: '/images/INTERIOR/PHOTO-2023-05-02-17-56-54 (1).webp',               category: 'Interior' },
  { src: '/images/INTERIOR/fe8b726d-e64c-410f-9678-6b5b553d282b.webp',        category: 'Interior' },
  { src: '/images/INTERIOR/12d58aef-6dc7-4e5c-84bf-0a5b3f85c153.webp',        category: 'Interior' },
  { src: '/images/INTERIOR/tempImageg5ncA9.webp',                             category: 'Interior' },
  { src: '/images/INTERIOR/interior_01.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_02.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_03.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_04.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_05.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_06.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_07.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_08.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_09.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_10.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_11.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_12.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_13.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_14.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_15.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_16.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_17.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_18.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_19.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_20.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_21.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_22.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_23.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_24.jpg',                                  category: 'Interior' },
  { src: '/images/INTERIOR/interior_25.jpg',                                  category: 'Interior' },

  // ── EXTERIOR ────────────────────────────────────────────────────────────────
  { src: '/images/EXTERIOR/d7fbda8b-3fee-401f-949b-94bc17143fc9.webp',        category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_facade_01.jpg',                           category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_facade_02.jpg',                           category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_window.jpg',                              category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_window_wood.jpg',                         category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_08.jpg',                                  category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_09.jpg',                                  category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_10.jpg',                                  category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_11.jpg',                                  category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_12.jpg',                                  category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_13.jpg',                                  category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_14.jpg',                                  category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_15.jpg',                                  category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_16.jpg',                                  category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_17.jpg',                                  category: 'Exterior' },
  { src: '/images/EXTERIOR/exterior_18.jpg',                                  category: 'Exterior' },

  // ── REMODELING (sin duplicados) ──────────────────────────────────────────────
  { src: '/images/REMODELING/tempImageMtSaY6.webp',                           category: 'Remodeling' },
  { src: '/images/REMODELING/tempImagesDXud9.webp',                           category: 'Remodeling' },
  { src: '/images/REMODELING/tempImagezZmvwQ.webp',                           category: 'Remodeling' },

  // ── WATERPROOFING ───────────────────────────────────────────────────────────
  { src: '/images/WATERPROOFING/IMG_3976.webp',                               category: 'Waterproofing' },
  { src: '/images/WATERPROOFING/IMG_3977.webp',                               category: 'Waterproofing' },
  { src: '/images/WATERPROOFING/IMG_3979.webp',                               category: 'Waterproofing' },
  { src: '/images/WATERPROOFING/IMG_3980.webp',                               category: 'Waterproofing' },
  { src: '/images/WATERPROOFING/IMG_3981.webp',                               category: 'Waterproofing' },
  { src: '/images/WATERPROOFING/IMG_3982.webp',                               category: 'Waterproofing' },
]

const beforeAfterImages = [
  { before: '/images/BEFORE_AFTER/comercial_before_2.jpg', after: '/images/BEFORE_AFTER/comercial_after_2.jpg' },
  { before: '/images/BEFORE_AFTER/Coke_before.jpg',      after: '/images/BEFORE_AFTER/Coke_after.jpg' },
  { before: '/images/BEFORE_AFTER/Coke_before_2.jpg',    after: '/images/BEFORE_AFTER/Coke_after_2.jpg' },
  { before: '/images/BEFORE_AFTER/bath_before.jpg',      after: '/images/BEFORE_AFTER/bath_after.jpg' },
]

// ── VIDEOS ────────────────────────────────────────────────────────────────────
// isShort: true  → video vertical grabado con celular (aspect 9/16)
// isShort: false → video horizontal normal (aspect 16/9)
const galleryVideos = [
  // aqui apunta a la cuenta temporal de nicolas
  //{ youtubeId: 'iCu2qpi_L34', category: 'Commercial', title: 'Commercial 1',  isShort: false },
  //{ youtubeId: '8ycSKcCSWq0', category: 'Commercial', title: 'Commercial 2',  isShort: false },
  //{ youtubeId: 'HzbPy-Jncd0', category: 'Exterior',   title: 'Exterior 1',    isShort: true  },
  //{ youtubeId: 'nfitUDjR7uI', category: 'Exterior',   title: 'Exterior 2',    isShort: true  },
  //{ youtubeId: 'Wcmf8CT_TXI', category: 'Exterior',   title: 'Exterior 3',    isShort: true  },  
  //{ youtubeId: 'SfaWbBjVx-s', category: 'Interior',   title: 'Interior 1',    isShort: true  },
  //{ youtubeId: '3kaIsM4OAjg', category: 'Remodeling', title: 'Remodeling 1',  isShort: true  },
  // apuntar a la cuanta de youtube de atlantic despues de desbloqueo de la cuanta 
  { youtubeId: 'Xq-s0MNspp8', category: 'Commercial', title: 'Commercial 1',  isShort: false },
  { youtubeId: '1t4n4ov3qO4', category: 'Commercial', title: 'Commercial 2',  isShort: false },
  { youtubeId: 'VS7qmFyzY5E', category: 'Exterior',   title: 'Exterior 1',    isShort: true  },
  { youtubeId: 'R71PHswyFD4', category: 'Exterior',   title: 'Exterior 2',    isShort: true  },
  { youtubeId: 'r99qxHj4hHs', category: 'Exterior',   title: 'Exterior 3',    isShort: true  },  
  { youtubeId: 'j-1in0iLLVY', category: 'Interior',   title: 'Interior 1',    isShort: true  },
  { youtubeId: 'SLGiR2pVHBQ', category: 'Remodeling', title: 'Remodeling 1',  isShort: true  },

]

const categoryKeys = ['All', 'Commercial', 'Interior', 'Exterior', 'Remodeling', 'Waterproofing']
const videoCategoryKeys = ['All', 'Commercial', 'Exterior', 'Interior', 'Remodeling']

// ── BEFORE/AFTER SLIDER ───────────────────────────────────────────────────────
function BeforeAfterSlider({
  before, after, title, category, sliderHint, sliderBefore, sliderAfter
}: {
  before: string; after: string; title: string; category: string
  sliderHint: string; sliderBefore: string; sliderAfter: string
}) {
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

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
        onMouseDown={() => { isDragging.current = true }}
        onMouseUp={() => { isDragging.current = false }}
        onMouseLeave={() => { isDragging.current = false }}
        onMouseMove={(e) => { if (isDragging.current) handleMove(e.clientX) }}
        onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      >
        <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
          <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" />
        </div>
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10" style={{ left: `${sliderPos}%` }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#E2B84A] border-2 border-white flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
              <path d="M9 18l-6-6 6-6M15 6l6 6-6 6"/>
            </svg>
          </div>
        </div>
        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm">{sliderBefore}</div>
        <div className="absolute top-3 right-3 bg-[#E2B84A] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm">{sliderAfter}</div>
      </div>
      <div className="p-5 bg-[#3D4F5C]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#E2B84A] mb-1">{category}</p>
        <h3 className="font-serif text-lg font-semibold text-white">{title}</h3>
        <p className="text-xs text-white/50 mt-1">{sliderHint}</p>
      </div>
    </div>
  )
}

// ── VIDEO CARD ────────────────────────────────────────────────────────────────
function VideoCard({ youtubeId, title, category, isShort }: {
  youtubeId: string; title: string; category: string; isShort: boolean
}) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="overflow-hidden rounded-sm bg-gray-900 group flex flex-col">
      <div className={isShort ? 'flex justify-center bg-black' : ''}>
        <div
          className="relative overflow-hidden"
          style={isShort
            ? { aspectRatio: '9/16', width: '100%', maxWidth: '320px' }
            : { aspectRatio: '16/9', width: '100%' }
          }
        >
          {playing ? (
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`}
              title={title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 cursor-pointer" onClick={() => setPlaying(true)}>
              <img
                src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                alt={title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#E2B84A] flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <svg viewBox="0 0 24 24" fill="white" className="w-7 h-7 ml-1">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              {isShort && (
                <div className="absolute top-3 right-3 bg-black/70 text-white text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
                  Short
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="p-4 bg-[#3D4F5C] flex-1">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#E2B84A] mb-1">{category}</p>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Gallery() {
  const { t } = useLang()
  const g = t.gallery

  const [activeTab, setActiveTab] = useState<'photos' | 'videos'>('photos')
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0)
  const [activeVideoCategory, setActiveVideoCategory] = useState('All')
  const [lightbox, setLightbox] = useState<string | null>(null)

  const activeKeyword = categoryKeys[activeCategoryIndex]
  const filtered = activeKeyword === 'All'
    ? galleryImages
    : galleryImages.filter(img => img.category === activeKeyword)

  const filteredVideos = activeVideoCategory === 'All'
    ? galleryVideos
    : galleryVideos.filter(v => v.category === activeVideoCategory)

  const projects = g.projects.map((p: { title: string; category: string }, i: number) => ({ ...p, ...beforeAfterImages[i] }))

  return (
    <main>
      <Navbar />

      {/* Hero */}
      <section className="bg-black py-16 px-6 md:px-10 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-3">{g.badge}</p>
        <h1 className="font-serif text-5xl font-semibold text-white mb-5">{g.title}</h1>
        <p className="text-lg text-white/60 font-light max-w-xl mx-auto">{g.subtitle}</p>
      </section>

      {/* Before & After */}
      <section className="bg-[#3D4F5C] py-16 px-6 md:px-10">
        <div className="text-center mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-2">{g.transformationsBadge}</p>
          <h2 className="font-serif text-4xl font-semibold text-white">{g.transformationsTitle}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {projects.map((project: { before: string; after: string; title: string; category: string }, index: number) => (
            <BeforeAfterSlider
              key={index}
              before={project.before}
              after={project.after}
              title={project.title}
              category={project.category}
              sliderHint={g.sliderHint}
              sliderBefore={g.sliderBefore}
              sliderAfter={g.sliderAfter}
            />
          ))}
        </div>
      </section>

      {/* Portfolio: Fotos + Videos */}
      <section className="bg-gray-50 py-16 px-6 md:px-10">
        <div className="text-center mb-10">
          <p className="text-sm font-bold uppercase tracking-widest text-[#C9A84C] mb-2">{g.portfolioBadge}</p>
          <h2 className="font-serif text-4xl font-semibold text-gray-900 mb-8">{g.portfolioTitle}</h2>

          {/* Pestañas Photos | Videos */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-sm border border-gray-200 overflow-hidden">
              <button
                onClick={() => setActiveTab('photos')}
                className={`px-8 py-2.5 text-sm font-semibold uppercase tracking-wider transition-colors ${
                  activeTab === 'photos'
                    ? 'bg-[#C9A84C] text-white'
                    : 'bg-white text-gray-600 hover:text-[#C9A84C]'
                }`}
              >
                {g.tabPhotos ?? 'Photos'}
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`px-8 py-2.5 text-sm font-semibold uppercase tracking-wider border-l border-gray-200 transition-colors ${
                  activeTab === 'videos'
                    ? 'bg-[#C9A84C] text-white'
                    : 'bg-white text-gray-600 hover:text-[#C9A84C]'
                }`}
              >
                {g.tabVideos ?? 'Videos'}
              </button>
            </div>
          </div>

          {/* ── FOTOS ── */}
          {activeTab === 'photos' && (
            <>
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {g.categories.map((cat: string, index: number) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategoryIndex(index)}
                    className={`px-5 py-2 text-sm font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                      activeCategoryIndex === index
                        ? 'bg-[#C9A84C] text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#C9A84C] hover:text-[#C9A84C]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
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
            </>
          )}

          {/* ── VIDEOS ── */}
          {activeTab === 'videos' && (
            <>
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {videoCategoryKeys.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveVideoCategory(cat)}
                    className={`px-5 py-2 text-sm font-semibold uppercase tracking-wider rounded-sm transition-colors ${
                      activeVideoCategory === cat
                        ? 'bg-[#C9A84C] text-white'
                        : 'bg-white border border-gray-200 text-gray-600 hover:border-[#C9A84C] hover:text-[#C9A84C]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 max-w-7xl mx-auto">
                {filteredVideos.map((video, index) => (
                  <VideoCard
                    key={index}
                    youtubeId={video.youtubeId}
                    title={video.title}
                    category={video.category}
                    isShort={video.isShort}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-6 right-6 text-white text-4xl font-light hover:text-[#C9A84C] transition-colors" onClick={() => setLightbox(null)}>×</button>
          <img src={lightbox} alt="Project" className="max-w-full max-h-full object-contain rounded-sm" onClick={(e) => e.stopPropagation()} />
        </div>
      )}

      <Footer />
    </main>
  )
}
