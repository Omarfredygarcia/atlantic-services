'use client'

import { useState } from 'react'
import { useLang } from '@/lib/LanguageContext'

export default function AIVisualizer() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeVideo, setActiveVideo] = useState(0)
  const { t, lang } = useLang()

  const v = t.aiVisualizer
  const video = v.videos[activeVideo]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-56 right-6 z-40 flex items-center gap-2 bg-[#1a1a1a] border-2 border-[#E2B84A] text-white px-4 py-3 rounded-full shadow-2xl hover:bg-[#E2B84A] transition-all duration-300 hover:scale-105 md:bottom-8"
      >
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
            <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
          </svg>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
        </div>
        <span className="text-sm font-bold uppercase tracking-wider">{v.button}</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-end p-0 md:p-6">
          <div className="absolute inset-0 bg-black/60" onClick={() => setIsOpen(false)}></div>

          <div className="relative bg-[#1a1a1a] w-full md:w-[420px] h-[90vh] md:h-[600px] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E2B84A] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{v.title}</p>
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>
                    {v.poweredBy}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="text-white/50 hover:text-white transition-colors text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="relative bg-black overflow-hidden" style={{ height: '420px' }}>
              <video
                key={activeVideo}
                src={video.src}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                <p className="text-[#E2B84A] text-xs font-bold uppercase tracking-wider mb-1">
                  {video.title}
                </p>
                <p className="text-white/80 text-sm font-light">{video.description}</p>
              </div>
            </div>

            <div className="flex justify-center gap-2 py-4 bg-[#1a1a1a]">
              {v.videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveVideo(index)}
                  className={`rounded-full transition-all duration-300 ${
                    activeVideo === index
                      ? 'w-6 h-2.5 bg-[#E2B84A]'
                      : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            <div className="px-5 pb-5 bg-[#1a1a1a]">
              <p className="text-white/50 text-xs text-center mb-4">{v.footerText}</p>

              <a
                href="/#contact"
                className="block w-full py-3 bg-[#E2B84A] text-white text-sm font-bold uppercase tracking-widest text-center rounded-sm hover:bg-[#c49a2e] transition-colors"
              >
                {v.cta}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}