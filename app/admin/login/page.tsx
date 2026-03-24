'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">⬡</div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            ATLANTIC SERVICES LLC
          </h1>
          <p className="text-[#E8951A] text-sm mt-1">Sistema RPA de Cotizaciones</p>
        </div>

        {/* Card */}
        <div className="bg-[#1C1C1C] rounded-xl p-8 shadow-2xl">
          <h2 className="text-[#E8951A] font-bold text-lg mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#E8951A] transition-colors"
                placeholder="operador@atlanticser.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#E8951A] transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-500 text-red-400 rounded-lg px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E8951A] hover:bg-[#C97B10] disabled:bg-gray-600 text-black font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Ingresando...' : 'INGRESAR'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          Atlantic Services LLC — Panel Administrativo
        </p>
      </div>
    </div>
  )
}
