'use client'

import { useState, useRef } from 'react'
import Navbar from '@/components/sections/Navbar'
import Footer from '@/components/sections/Footer'

const projects = [
  {
    title: 'Kitchen Remodel',
    category: 'Remodeling',
    before: '/images/BEFORE_AFTER/Coke_before.jpg',
    after: '/images/BEFORE_AFTER/Coke_after.jpg',
  },
  {
    title: 'Kitchen Transformation',
    category: 'Remodeling',
    before: '/images/BEFORE_AFTER/Coke_before_2.jpg',
    after: '/images/BEFORE_AFTER/Coke_after_2.jpg',
  },
  {
    title: 'Bathroom Remodel',
    category: 'Remodeling',
    before: '/images/BEFORE_AFTER/bath_before.jpg',
    after: '/images/BEFORE_AFTER/bath_after.jpg',
  },
]

function BeforeAfterSlider({ before, after, title }: { before: string; after: string; title: string }) {
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
        {/* AFTER image — full width */}
        <img src={after} alt="After" className="absolute inset-0 w-full h-full object-cover" />

        {/* BEFORE image — clipped */}
        <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
          <img src={before} alt="Before" className="absolute inset-0 w-full h-full object-cover" style={{ width: `${10000 / sliderPos}%` }} />
        </div>

        {/* Divider line */}
        <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10" style={{ left: `${sliderPos}%` }}>
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#E8951A] border-2 border-white flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
              <path d="M9 18l-6-6 6-6M15 6l6 6-6 6"/>
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm">
          Before
        </div>
        <div className="absolute top-3 right-3 bg-[#E8951A] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-sm">
          After
        </div>
      </div>

      {/* Project info */}
      <div className="p-5 bg-[#3D4F5C]">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#E8951A] mb-1">{projects.find(p => p.before === before)?.category}</p>
        <h3 className="font-serif text-lg font-semibold text-white">{title}</h3>
        <p className="text-xs text-white/50 mt-1">Drag the slider to see the transformation</p>
      </div>
    </div>
  )
}

export default function Gallery() {
  return (
    <main>
      <Navbar />
      <section className="bg-black py-20 px-10">
        <div className="text-center mb-14">
          <p className="text-sm font-bold uppercase tracking-widest text-[#E8951A] mb-3">Our work</p>
          <h1 className="font-serif text-5xl font-semibold text-white mb-5">Before & After</h1>
          <p className="text-lg text-white/60 font-light max-w-xl mx-auto">
            Drag the slider on each project to see the full transformation — from start to finish.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {projects.map((project, index) => (
            <BeforeAfterSlider
              key={index}
              before={project.before}
              after={project.after}
              title={project.title}
            />
          ))}
        </div>
      </section>
      <Footer />
    </main>
  )
}