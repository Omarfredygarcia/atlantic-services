'use client'

import { useState } from 'react'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    const formData = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/contact', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.success) { setStatus('success') } else { setStatus('error') }
    } catch { setStatus('error') }
  }

  return (
    <section id="contact" className="bg-white px-10 py-16 scroll-mt-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">

        <div>
          <p className="text-base font-bold uppercase tracking-widest text-[#C9A84C] mb-3">Get started</p>
          <h2 className="font-serif text-5xl font-semibold text-gray-900 mb-6">Request a Free Estimate</h2>
          <p className="text-lg text-gray-500 leading-relaxed font-light mb-10">
            Tell us about your project and upload photos for a faster, more accurate quote. We'll get back to you within 24 hours.
          </p>
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">(317) 991-5878</p>
                <p className="text-sm text-gray-500">Mon–Fri 8am–5pm · Sat 9am–12pm</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">info@atlanticser.com</p>
                <p className="text-sm text-gray-500">Response within 24 hours</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-[#C9A84C] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">5341 W. 86th St.</p>
                <p className="text-sm text-gray-500">Indianapolis, IN 46268</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-sm p-8">
          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#C9A84C] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-8 h-8">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 className="font-serif text-2xl font-semibold text-gray-900 mb-2">Request Sent!</h3>
              <p className="text-gray-500">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Full name</label>
                <input name="name" type="text" placeholder="John Smith" required
                  className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C9A84C]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Phone</label>
                  <input name="phone" type="tel" placeholder="(317) 000-0000" required
                    className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C9A84C]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email</label>
                  <input name="email" type="email" placeholder="you@email.com" required
                    className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C9A84C]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Type of work</label>
                <select name="service" required
                  className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm bg-white text-gray-900 focus:outline-none focus:border-[#C9A84C]">
                  <option value="">Select a service...</option>
                  <option>Flooring</option>
                  <option>Residential Construction</option>
                  <option>Commercial Construction</option>
                  <option>Restoration</option>
                  <option>Painting</option>
                  <option>Siding & Exterior</option>
                  <option>Doors & Windows</option>
                  <option>Carpentry</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Project photos</label>
                <div className="border-2 border-dashed border-gray-200 rounded-sm p-6 text-center cursor-pointer hover:border-[#C9A84C] transition-colors bg-white">
                  <input name="photos" type="file" accept="image/*" multiple className="hidden" id="photos" />
                  <label htmlFor="photos" className="cursor-pointer">
                    <p className="text-sm text-gray-500">
                      <span className="text-[#C9A84C] font-semibold">Click to upload</span> or drag & drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, HEIC up to 20MB each</p>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Project description</label>
                <textarea name="description" rows={3} placeholder="Describe the work needed, approximate area size, timeline..." required
                  className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C9A84C] resize-none" />
              </div>
              <button type="submit" disabled={status === 'sending'}
                className="w-full py-4 bg-[#C9A84C] text-white text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#d4841a] transition-colors disabled:opacity-50">
                {status === 'sending' ? 'Sending...' : 'Send Estimate Request →'}
              </button>
              {status === 'error' && (
                <p className="text-xs text-red-500 text-center">Something went wrong. Please try again or call us directly.</p>
              )}
            </form>
          )}
        </div>

      </div>
    </section>
  )
}
