'use client'

import { useState } from 'react'

const videos = [
  {
    src: '/videos/Before_after_kitchen.mp4',
    title: 'Kitchen Transformation',
    description: 'See how AI visualizes a complete kitchen remodel before any work begins.',
  },
  {
    src: '/videos/Before_after_interior.mp4',
    title: 'Interior Renovation',
    description: 'Explore flooring and wall options in your actual space using AR technology.',
  },
  {
    src: '/videos/Before_after_external.mp4',
    title: 'Exterior & Siding',
    description: 'Visualize siding, paint colors and exterior finishes on your home instantly.',
  },
]

export default function AIVisualizer() {
  const [isOpen, setIsOpen] = useState(false)
  const [activeVideo, setActiveVideo] = useState(0)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3 bg-[#E8951A] text-white px-5 py-3 rounded-full shadow-2xl hover:bg-[#d4841a] transition-all duration-300 hover:scale-105 group"
      >
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
            <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
          </svg>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
        </div>
        <span className="text-sm font-bold uppercase tracking-wider">AI Visualizer</span>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-end md:justify-end p-0 md:p-6">
          
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Panel */}
          <div className="relative bg-[#1a1a1a] w-full md:w-[420px] h-[90vh] md:h-[600px] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden z-10">
            
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-black">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#E8951A] flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">AI Visualizer</p>
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>
                    Powered by Floori AI
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

            {/* Video */}
            <div className="relative flex-1 bg-black">
              <video
                key={activeVideo}
                src={videos[activeVideo].src}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Video overlay info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-5">
                <p className="text-[#E8951A] text-xs font-bold uppercase tracking-wider mb-1">
                  {videos[activeVideo].title}
                </p>
                <p className="text-white/80 text-sm font-light">
                  {videos[activeVideo].description}
                </p>
              </div>
            </div>

            {/* Dots navigation */}
            <div className="flex justify-center gap-2 py-4 bg-[#1a1a1a]">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveVideo(index)}
                  className={`rounded-full transition-all duration-300 ${
                    activeVideo === index
                      ? 'w-6 h-2.5 bg-[#E8951A]'
                      : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 bg-[#1a1a1a]">
              <p className="text-white/50 text-xs text-center mb-4">
                Want to visualize your own space? Try our AI tool — it's free!
              </p>
              
<a href="https://floori.io" target="_blank" className="block w-full py-3 bg-[#E8951A] text-white text-sm font-bold uppercase tracking-widest text-center rounded-sm hover:bg-[#d4841a] transition-colors">Try it yourself</a>
            </div>

          </div>
        </div>
      )}
    </>
  )
}