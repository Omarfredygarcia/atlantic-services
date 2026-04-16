'use client'

import { useState } from 'react'
import { useLang } from '@/lib/LanguageContext'

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const { t } = useLang()
  const c = t.contact
  const f = t.contact.form

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')

    const formData = new FormData(e.currentTarget)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (data.success) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="contact" className="bg-white px-10 py-16 scroll-mt-24">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
        <div>
          <p className="text-base font-bold uppercase tracking-widest text-[#E2B84A] mb-3">
            {c.badge}
          </p>
          <h2 className="font-serif text-5xl font-semibold text-gray-900 mb-6">
            {c.title}
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed font-light mb-10">
            {c.subtitle}
          </p>

          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-[#E2B84A] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.68A2 2 0 012 .18h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{c.phone.label}</p>
                <p className="text-sm text-gray-500">{c.phone.sub}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-[#E2B84A] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{c.email.label}</p>
                <p className="text-sm text-gray-500">{c.email.sub}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-sm bg-[#E2B84A] flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{c.address.label}</p>
                <p className="text-sm text-gray-500">{c.address.sub}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-sm p-8">
          {status === 'success' ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-[#E2B84A] flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-8 h-8">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="font-serif text-2xl font-semibold text-gray-900 mb-2">
                {f.successTitle}
              </h3>
              <p className="text-gray-500">{f.successMsg}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  {f.name}
                </label>
                <input
                  name="name"
                  type="text"
                  placeholder={f.namePlaceholder}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E2B84A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    {f.phone}
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder={f.phonePlaceholder}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E2B84A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                    {f.email}
                  </label>
                  <input
                    name="email"
                    type="email"
                    placeholder={f.emailPlaceholder}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E2B84A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  {f.service}
                </label>
                <select
                  name="service"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm bg-white text-gray-900 focus:outline-none focus:border-[#E2B84A]"
                >
                  <option value="">{f.servicePlaceholder}</option>
                  {f.serviceOptions.map((option: string) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  {f.photos}
                </label>
                <div className="border-2 border-dashed border-gray-200 rounded-sm p-6 text-center cursor-pointer hover:border-[#E2B84A] transition-colors bg-white">
                  <input name="photos" type="file" accept="image/*" multiple className="hidden" id="photos" />
                  <label htmlFor="photos" className="cursor-pointer">
                    <p className="text-sm text-gray-500">
                      <span className="text-[#E2B84A] font-semibold">{f.photosClick}</span> {f.photosDrag}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{f.photosHint}</p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  {f.description}
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder={f.descriptionPlaceholder}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-sm text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#E2B84A] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full py-4 bg-[#E2B84A] text-white text-sm font-bold uppercase tracking-widest rounded-sm hover:bg-[#c49a2e] transition-colors disabled:opacity-50"
              >
                {status === 'sending' ? f.sending : f.submit}
              </button>

              {status === 'error' && (
                <p className="text-xs text-red-500 text-center">{f.errorMsg}</p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}