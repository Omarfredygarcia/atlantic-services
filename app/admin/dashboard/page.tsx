'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Proyecto, ESTADO_COLORS, EstadoProyecto } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [runningRPA, setRunningRPA] = useState(false)
  const [rpaMsg, setRpaMsg] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [usuario, setUsuario] = useState<string>('')

  useEffect(() => {
    checkAuth()
    cargarProyectos()
  }, [])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/admin/login')
      return
    }
    setUsuario(user.email || '')
  }

  async function cargarProyectos() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) setProyectos(data)
    setLoading(false)
  }

  async function logout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  async function correrRPA() {
    setRunningRPA(true)
    setRpaMsg('Ejecutando RPA, por favor espera...')
    try {
      const res = await fetch('/api/cotizacion', { method: 'POST' })
      const data = await res.json()
      if (data.ok) {
        setRpaMsg(`✅ ${data.mensaje}`)
        cargarProyectos()
      } else {
        setRpaMsg(`❌ Error: ${data.error}`)
      }
    } catch (e) {
      setRpaMsg('❌ Error al conectar con el servidor RPA')
    }
    setRunningRPA(false)
  }

  const proyectosFiltrados = filtroEstado === 'TODOS'
    ? proyectos
    : proyectos.filter(p => p.estado === filtroEstado)

  const stats = {
    total:      proyectos.length,
    pendientes: proyectos.filter(p => p.estado === 'PENDIENTE').length,
    completados:proyectos.filter(p => p.estado === 'COMPLETADO').length,
    errores:    proyectos.filter(p => p.estado === 'ERROR').length,
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Navbar */}
      <nav className="bg-[#1C1C1C] border-b border-[#333] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#E8951A] text-xl">⬡</span>
          <span className="text-white font-bold text-sm">ATLANTIC SERVICES — RPA</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">👤 {usuario}</span>
          <button
            onClick={logout}
            className="bg-[#333] hover:bg-[#444] text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </nav>

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Pendientes', value: stats.pendientes, color: 'text-yellow-400' },
            { label: 'Completados', value: stats.completados, color: 'text-green-400' },
            { label: 'Errores', value: stats.errores, color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
              <p className="text-gray-400 text-sm">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <button
            onClick={() => router.push('/admin/proyectos/nuevo')}
            className="bg-[#E8951A] hover:bg-[#C97B10] text-black font-bold px-5 py-2 rounded-lg transition-colors"
          >
            + Nuevo Proyecto
          </button>
          <button
            onClick={cargarProyectos}
            className="bg-[#5BB8D4] hover:bg-[#4AA0BB] text-black font-bold px-5 py-2 rounded-lg transition-colors"
          >
            ↻ Actualizar
          </button>
          <button
            onClick={correrRPA}
            disabled={runningRPA}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold px-5 py-2 rounded-lg transition-colors"
          >
            {runningRPA ? '⏳ Procesando...' : '▶ Correr RPA'}
          </button>

          {/* Filtro */}
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="bg-[#252525] text-white border border-[#333] rounded-lg px-4 py-2 ml-auto"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COMPLETADO">Completado</option>
            <option value="ERROR">Error</option>
          </select>
        </div>

        {/* Mensaje RPA */}
        {rpaMsg && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
            rpaMsg.startsWith('✅') ? 'bg-green-900/30 text-green-400 border border-green-700' :
            rpaMsg.startsWith('❌') ? 'bg-red-900/30 text-red-400 border border-red-700' :
            'bg-blue-900/30 text-blue-400 border border-blue-700'
          }`}>
            {rpaMsg}
          </div>
        )}

        {/* Tabla */}
        <div className="bg-[#1C1C1C] rounded-xl border border-[#333] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#E8951A]">
                {['ID Proyecto','Cliente','Tipo','Área ft²','Estado','Último Paso','Fecha','Acciones'].map(h => (
                  <th key={h} className="text-black font-bold text-sm px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center text-gray-400 py-12">Cargando proyectos...</td></tr>
              ) : proyectosFiltrados.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-gray-400 py-12">No hay proyectos</td></tr>
              ) : proyectosFiltrados.map((p, i) => (
                <tr
                  key={p.id}
                  className={`border-t border-[#333] hover:bg-[#252525] transition-colors cursor-pointer ${i%2===0?'':'bg-[#1A1A1A]'}`}
                  onClick={() => router.push(`/admin/proyectos/${p.id}`)}
                >
                  <td className="px-4 py-3 text-[#E8951A] font-mono text-sm font-bold">{p.project_code}</td>
                  <td className="px-4 py-3 text-white text-sm">{p.cliente_nombre}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{p.tipo_proyecto || '—'}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm text-center">{p.area_total_ft2 || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${ESTADO_COLORS[p.estado as EstadoProyecto]}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{p.ultimo_paso || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {p.fecha_hora_proceso ? new Date(p.fecha_hora_proceso).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/admin/proyectos/${p.id}`)}
                        className="bg-[#333] hover:bg-[#E8951A] hover:text-black text-white text-xs px-3 py-1 rounded transition-colors"
                      >
                        Editar
                      </button>
                      {(p.estado === 'COMPLETADO' || p.estado === 'ERROR') && (
                        <button
                          onClick={async () => {
                            const supabase = createClient()
                            await supabase.from('proyectos').update({
                              estado: 'PENDIENTE', ultimo_paso: null,
                              error_detalle: null, fecha_hora_proceso: null
                            }).eq('id', p.id)
                            cargarProyectos()
                          }}
                          className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded transition-colors"
                        >
                          ↺ Reset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-gray-600 text-xs mt-3 text-center">
          Click en una fila para editar el proyecto
        </p>
      </div>
    </div>
  )
}
