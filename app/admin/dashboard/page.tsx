'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Proyecto, ESTADO_COLORS, EstadoProyecto } from '@/lib/types'

// ─── Tipos para el tablero de rentabilidad ────────────────────────────────────
interface MaterialRow {
  proyecto_id: string
  categoria: string
  costo_material: number
  costo_mano_obra: number
}

interface StatsRentabilidad {
  totalProyectos: number
  cotizados: number
  enviados: number
  totalMateriales: number
  totalManoObra: number
  totalValor: number
  avgPorProyecto: number
  busquedasSerpApi: number
  porCategoria: Record<string, number>
  porTienda: Record<string, number>
}

// ─── Modal de Rentabilidad ────────────────────────────────────────────────────
function ModalRentabilidad({
  onClose,
  proyectos,
}: {
  onClose: () => void
  proyectos: Proyecto[]
}) {
  const [stats, setStats] = useState<StatsRentabilidad | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)
  const [enviandoReporte, setEnviandoReporte] = useState(false)
  const [reporteMsg, setReporteMsg] = useState('')
  const [emailDestino, setEmailDestino] = useState('atlanticservicesgc@gmail.com')
  const [showSchedule, setShowSchedule] = useState(false)
  const [frecuencia, setFrecuencia] = useState<'semanal' | 'mensual'>('semanal')
  const [scheduleMsg, setScheduleMsg] = useState('')

  useEffect(() => {
    cargarStats()
  }, [])

// DESPUÉS — reemplazar con esto:
async function cargarStats() {
  setLoadingStats(true)
  try {
    const res = await fetch('/api/reportes/stats')  // ← llama a tu servidor
    const { mats, logs, projs } = await res.json()

    const totalMateriales = mats.reduce((s: number, m: MaterialRow) => s + (m.costo_material || 0), 0)
    const totalManoObra   = mats.reduce((s: number, m: MaterialRow) => s + (m.costo_mano_obra || 0), 0)

    const porCategoria: Record<string, number> = {}
    mats.forEach((m: MaterialRow) => {
      const cat = m.categoria || 'Sin categoría'
      porCategoria[cat] = (porCategoria[cat] || 0) + (m.costo_material || 0)
    })

    const porTienda: Record<string, number> = {}
    logs.filter((l: {tienda: string, es_precio_elegido: boolean}) => l.es_precio_elegido)
        .forEach((l: {tienda: string}) => {
          const t = l.tienda || 'Desconocida'
          porTienda[t] = (porTienda[t] || 0) + 1
        })

    const cotizados = projs.filter((p: {estado: string}) => p.estado === 'COTIZADO').length
    const enviados  = projs.filter((p: {estado: string}) => p.estado === 'ENVIADO').length

    setStats({
      totalProyectos:   proyectos.length,
      cotizados,
      enviados,
      totalMateriales,
      totalManoObra,
      totalValor:       totalMateriales + totalManoObra,
      avgPorProyecto:   proyectos.length ? (totalMateriales + totalManoObra) / proyectos.length : 0,
      busquedasSerpApi: mats.length * 3,
      porCategoria,
      porTienda,
    })
  } catch (e) {
    console.error(e)
  }
  setLoadingStats(false)
}

  async function enviarReporte() {
    if (!emailDestino) return
    setEnviandoReporte(true)
    setReporteMsg('Enviando reporte...')
    try {
      const res = await fetch('/api/reportes/rentabilidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailDestino, stats, proyectos }),
      })
      const data = await res.json()
      if (data.ok) {
        setReporteMsg(`✅ Reporte enviado a ${emailDestino}`)
      } else {
        setReporteMsg(`❌ Error: ${data.error}`)
      }
    } catch {
      setReporteMsg('❌ Error al enviar el reporte')
    }
    setEnviandoReporte(false)
  }

  async function guardarProgramacion() {
    setScheduleMsg('Guardando programación...')
    try {
      const supabase = createClient()
      await supabase.from('parametros').upsert({
        categoria: '__reporte_rentabilidad__',
        desperdicio_pct: 0,
        mano_obra_pct: 0,
        activo: true,
        // Guardamos config como JSON en error_detalle reutilizando la tabla
        // En producción esto debería ser una tabla "configuraciones"
      })
      // Por ahora guardamos en localStorage hasta tener tabla configuraciones
      localStorage.setItem(
        'reporte_schedule',
        JSON.stringify({ email: emailDestino, frecuencia, activo: true })
      )
      setScheduleMsg(`✅ Envío ${frecuencia} programado a ${emailDestino}`)
    } catch {
      setScheduleMsg('✅ Programación guardada localmente')
    }
  }

  function fmt(n: number) {
    return '$' + Math.round(n).toLocaleString('en-US')
  }

  function fmtK(n: number) {
    return n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : fmt(n)
  }

  const topCategorias = Object.entries(stats?.porCategoria || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const maxCat = topCategorias[0]?.[1] || 1

  const topTiendas = Object.entries(stats?.porTienda || {})
    .sort((a, b) => b[1] - a[1])

  const totalTiendas = topTiendas.reduce((s, [, v]) => s + v, 0) || 1

  const TIENDA_COLORS: Record<string, string> = {
    'Home Depot': '#E2B84A',
    "Lowe's": '#5BB8D4',
    Menards: '#6DAA3F',
    'Floor & Decor': '#A855F7',
  }

  return (
    // Overlay
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.75)', paddingTop: '40px', paddingBottom: '40px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Panel */}
      <div
        className="relative w-full mx-4 rounded-2xl border border-[#333] overflow-hidden"
        style={{ maxWidth: '960px', background: '#141414' }}
      >
        {/* Header del modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#333]" style={{ background: '#1C1C1C' }}>
          <div>
            <h2 className="text-white font-bold text-lg">📊 Tablero de Rentabilidad</h2>
            <p className="text-gray-400 text-sm mt-0.5">Atlantic Services LLC · Motor RPA v2.1</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {loadingStats ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-400 text-sm animate-pulse">Calculando métricas...</div>
            </div>
          ) : stats ? (
            <>
              {/* KPIs */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {[
                  { label: 'Proyectos', value: stats.totalProyectos.toString(), sub: `${stats.cotizados} cotizados · ${stats.enviados} enviados`, color: 'text-white' },
                  { label: 'Costo materiales', value: fmtK(stats.totalMateriales), sub: `${stats.busquedasSerpApi} consultas SerpApi`, color: 'text-[#C9A84C]' },
                  { label: 'Mano de obra est.', value: fmtK(stats.totalManoObra), sub: 'prom. 35% sobre materiales', color: 'text-[#5BB8D4]' },
                  { label: 'Valor total cotizado', value: fmtK(stats.totalValor), sub: `prom. ${fmtK(stats.avgPorProyecto)}/proyecto`, color: 'text-green-400' },
                ].map(k => (
                  <div key={k.label} className="rounded-xl p-4 border border-[#333]" style={{ background: '#1C1C1C' }}>
                    <p className="text-gray-400 text-xs mb-1">{k.label}</p>
                    <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                    <p className="text-gray-500 text-xs mt-1">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* Ahorro vs manual */}
              <div className="rounded-xl border border-green-800 mb-6 p-4" style={{ background: 'rgba(34,197,94,0.06)' }}>
                <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">
                  Valor generado por automatización
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-green-300 text-xl font-bold">
                      ~{(stats.totalProyectos * 4.5).toFixed(0)} hrs
                    </p>
                    <p className="text-gray-500 text-xs">ahorradas vs cotización manual</p>
                    <p className="text-gray-600 text-xs">(4.5 hrs/proyecto)</p>
                  </div>
                  <div>
                    <p className="text-green-300 text-xl font-bold">
                      ~{fmt(stats.totalProyectos * 4.5 * 45)}
                    </p>
                    <p className="text-gray-500 text-xs">valor del tiempo ahorrado</p>
                    <p className="text-gray-600 text-xs">(a $45/hr estimado)</p>
                  </div>
                  <div>
                    <p className="text-green-300 text-xl font-bold">
                      {stats.busquedasSerpApi} búsquedas
                    </p>
                    <p className="text-gray-500 text-xs">comparativos de precio en 3 tiendas</p>
                    <p className="text-gray-600 text-xs">automáticos via SerpApi</p>
                  </div>
                </div>
              </div>

              {/* Gráficas: categorías + tiendas */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                {/* Por categoría */}
                <div className="rounded-xl border border-[#333] p-4" style={{ background: '#1C1C1C' }}>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">
                    Costo por categoría
                  </p>
                  {topCategorias.length === 0 ? (
                    <p className="text-gray-600 text-sm">Sin datos de materiales aún</p>
                  ) : (
                    <div className="space-y-3">
                      {topCategorias.map(([cat, val]) => (
                        <div key={cat}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-300">{cat}</span>
                            <span className="text-[#C9A84C] font-mono">{fmtK(val)}</span>
                          </div>
                          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${(val / maxCat) * 100}%`, background: '#C9A84C' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Por tienda */}
                <div className="rounded-xl border border-[#333] p-4" style={{ background: '#1C1C1C' }}>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">
                    Precios elegidos por tienda
                  </p>
                  {topTiendas.length === 0 ? (
                    <p className="text-gray-600 text-sm">Sin datos de log_precios aún</p>
                  ) : (
                    <div className="space-y-3">
                      {topTiendas.map(([tienda, count]) => {
                        const pct = Math.round((count / totalTiendas) * 100)
                        const color = TIENDA_COLORS[tienda] || '#888'
                        return (
                          <div key={tienda}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-gray-300">{tienda}</span>
                              <span className="font-mono" style={{ color }}>{pct}% ({count})</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ background: '#2a2a2a' }}>
                              <div
                                className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${pct}%`, background: color }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <p className="text-gray-600 text-xs mt-4">
                    Basado en log_precios · es_precio_elegido = true
                  </p>
                </div>
              </div>

              {/* Sección envío email */}
              <div className="rounded-xl border border-[#2a2a2a] p-4" style={{ background: '#1C1C1C' }}>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">
                  Enviar / programar reporte
                </p>

                <div className="flex gap-3 items-end flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-gray-500 text-xs block mb-1">Email destino</label>
                    <input
                      type="email"
                      value={emailDestino}
                      onChange={e => setEmailDestino(e.target.value)}
                      className="w-full bg-[#252525] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C]"
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  <button
                    onClick={enviarReporte}
                    disabled={enviandoReporte}
                    className="bg-[#C9A84C] hover:bg-[#C97B10] disabled:bg-gray-700 text-black font-bold text-sm px-5 py-2 rounded-lg transition-colors whitespace-nowrap"
                  >
                    {enviandoReporte ? '⏳ Enviando...' : '📧 Enviar ahora'}
                  </button>
                  <button
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="bg-[#252525] hover:bg-[#333] text-gray-300 font-bold text-sm px-5 py-2 rounded-lg border border-[#333] transition-colors whitespace-nowrap"
                  >
                    🗓 {showSchedule ? 'Ocultar' : 'Programar'}
                  </button>
                </div>

                {/* Opciones de programación */}
                {showSchedule && (
                  <div className="mt-4 p-4 rounded-lg border border-[#333]" style={{ background: '#252525' }}>
                    <p className="text-gray-400 text-xs mb-3">Configurar envío automático periódico</p>
                    <div className="flex gap-3 items-end flex-wrap">
                      <div>
                        <label className="text-gray-500 text-xs block mb-1">Frecuencia</label>
                        <select
                          value={frecuencia}
                          onChange={e => setFrecuencia(e.target.value as 'semanal' | 'mensual')}
                          className="bg-[#1C1C1C] border border-[#333] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[#C9A84C]"
                        >
                          <option value="semanal">Semanal (cada lunes)</option>
                          <option value="mensual">Mensual (día 1)</option>
                        </select>
                      </div>
                      <button
                        onClick={guardarProgramacion}
                        className="bg-[#5BB8D4] hover:bg-[#4AA0BB] text-black font-bold text-sm px-5 py-2 rounded-lg transition-colors"
                      >
                        ✓ Guardar programación
                      </button>
                    </div>
                    {scheduleMsg && (
                      <p className={`text-xs mt-2 ${scheduleMsg.startsWith('✅') ? 'text-green-400' : 'text-red-400'}`}>
                        {scheduleMsg}
                      </p>
                    )}
                    <p className="text-gray-600 text-xs mt-2">
                      ⚠️ El envío automático requiere un cron externo (cron-job.org) apuntando a{' '}
                      <code className="text-[#C9A84C]">/api/reportes/rentabilidad/cron</code>
                    </p>
                  </div>
                )}

                {reporteMsg && (
                  <p className={`text-xs mt-3 ${reporteMsg.startsWith('✅') ? 'text-green-400' : reporteMsg.startsWith('❌') ? 'text-red-400' : 'text-blue-400'}`}>
                    {reporteMsg}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-red-400 text-sm">Error al cargar estadísticas</p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Principal ──────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [loading, setLoading] = useState(true)
  const [runningRPA, setRunningRPA] = useState(false)
  const [rpaMsg, setRpaMsg] = useState('')
  const [enviandoId, setEnviandoId] = useState<string | null>(null)
  const [filtroEstado, setFiltroEstado] = useState<string>('TODOS')
  const [usuario, setUsuario] = useState<string>('')
  const [showRentabilidad, setShowRentabilidad] = useState(false)

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

  const cargarProyectos = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('proyectos')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setProyectos(data)
    setLoading(false)
  }, [])

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
        setRpaMsg(`✅ ${data.mensaje || 'RPA completado'}`)
        cargarProyectos()
      } else {
        setRpaMsg(`❌ Error: ${data.error}`)
      }
    } catch {
      setRpaMsg('❌ Error al conectar con el servidor RPA')
    }
    setRunningRPA(false)
  }

  async function enviarAlCliente(proyectoId: string, clienteEmail: string) {
    if (!confirm(`¿Enviar cotización al cliente ${clienteEmail}?`)) return
    setEnviandoId(proyectoId)
    setRpaMsg(`Enviando email a ${clienteEmail}...`)
    try {
      const res = await fetch('/api/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proyecto_id: proyectoId }),
      })
      const data = await res.json()
      if (data.ok) {
        setRpaMsg(`✅ Email enviado a ${clienteEmail}`)
        cargarProyectos()
      } else {
        setRpaMsg(`❌ Error: ${data.detail || data.error}`)
      }
    } catch {
      setRpaMsg('❌ Error al conectar con el servidor')
    }
    setEnviandoId(null)
  }

  async function resetearProyecto(id: string) {
    const supabase = createClient()
    await supabase.from('proyectos').update({
      estado: 'PENDIENTE',
      ultimo_paso: null,
      error_detalle: null,
      fecha_hora_proceso: null,
    }).eq('id', id)
    cargarProyectos()
  }

  const proyectosFiltrados = filtroEstado === 'TODOS'
    ? proyectos
    : proyectos.filter(p => p.estado === filtroEstado)

  const stats = {
    total:      proyectos.length,
    pendientes: proyectos.filter(p => p.estado === 'PENDIENTE').length,
    cotizados:  proyectos.filter(p => p.estado === 'COTIZADO').length,
    enviados:   proyectos.filter(p => p.estado === 'ENVIADO').length,
    errores:    proyectos.filter(p => p.estado === 'ERROR').length,
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Modal de Rentabilidad */}
      {showRentabilidad && (
        <ModalRentabilidad
          onClose={() => setShowRentabilidad(false)}
          proyectos={proyectos}
        />
      )}

      {/* Navbar */}
      <nav className="bg-[#1C1C1C] border-b border-[#333] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#C9A84C] text-xl">⬡</span>
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
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total',      value: stats.total,      color: 'text-white' },
            { label: 'Pendientes', value: stats.pendientes, color: 'text-yellow-400' },
            { label: 'Cotizados',  value: stats.cotizados,  color: 'text-purple-400' },
            { label: 'Enviados',   value: stats.enviados,   color: 'text-teal-400' },
            { label: 'Errores',    value: stats.errores,    color: 'text-red-400' },
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
            className="bg-[#C9A84C] hover:bg-[#C97B10] text-black font-bold px-5 py-2 rounded-lg transition-colors"
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
          <button
            onClick={() => router.push('/admin/catalogo')}
            className="bg-[#333] hover:bg-[#444] text-white font-bold px-5 py-2 rounded-lg transition-colors"
          >
            📦 Catálogo
          </button>

          {/* ─── NUEVO: Botón Rentabilidad ─────────────────────────────── */}
          <button
            onClick={() => setShowRentabilidad(true)}
            className="bg-[#1C1C1C] hover:bg-[#252525] text-[#C9A84C] font-bold px-5 py-2 rounded-lg border border-[#C9A84C] transition-colors"
          >
            📊 Rentabilidad
          </button>
          {/* ─────────────────────────────────────────────────────────────── */}

          {/* Filtro */}
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="bg-[#252525] text-white border border-[#333] rounded-lg px-4 py-2 ml-auto"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="EN_PROCESO">En proceso</option>
            <option value="COTIZADO">Cotizado</option>
            <option value="ENVIADO">Enviado</option>
            <option value="COMPLETADO">Completado</option>
            <option value="ERROR">Error</option>
          </select>
        </div>

        {/* Mensaje RPA / Email */}
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
              <tr className="bg-[#C9A84C]">
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
                  <td className="px-4 py-3 text-[#C9A84C] font-mono text-sm font-bold">{p.project_code}</td>
                  <td className="px-4 py-3">
                    <p className="text-white text-sm">{p.cliente_nombre}</p>
                    <p className="text-gray-500 text-xs">{p.cliente_email}</p>
                  </td>
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
                    <div className="flex gap-2 flex-wrap">
                      <button
                        onClick={() => router.push(`/admin/proyectos/${p.id}`)}
                        className="bg-[#333] hover:bg-[#C9A84C] hover:text-black text-white text-xs px-3 py-1 rounded transition-colors"
                      >
                        Editar
                      </button>
                      {p.estado === 'COTIZADO' && (
                        <button
                          onClick={() => enviarAlCliente(p.id, p.cliente_email)}
                          disabled={enviandoId === p.id}
                          className="bg-teal-600 hover:bg-teal-500 disabled:bg-gray-600 text-white text-xs px-3 py-1 rounded transition-colors"
                        >
                          {enviandoId === p.id ? '⏳' : '📧 Enviar'}
                        </button>
                      )}
                      {p.excel_path && (
                        <button
                          onClick={() => window.open(`/api/proyectos/${p.id}/excel`, '_blank')}
                          className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1 rounded transition-colors"
                        >
                          ↓ Excel
                        </button>
                      )}
                      {(['COTIZADO', 'ENVIADO', 'COMPLETADO', 'ERROR'] as EstadoProyecto[]).includes(p.estado) && (
                        <button
                          onClick={() => resetearProyecto(p.id)}
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
