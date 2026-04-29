'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import { Proyecto, ESTADO_COLORS, EstadoProyecto } from '@/lib/types'

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface MaterialRow {
  proyecto_id: string
  categoria: string
  costo_material: number
  costo_mano_obra: number
}

interface ProyectoStats {
  id: string
  estado: string
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
  matsPorProyecto: Record<string, { mat: number; mo: number; code: string }>
}

// ─── Colores por tienda ───────────────────────────────────────────────────────
const TIENDA_COLORS: Record<string, string> = {
  'Home Depot': '#E2B84A',
  "Lowe's": '#5BB8D4',
  Menards: '#6DAA3F',
  'Floor & Decor': '#A855F7',
}

// ─── Modal de Rentabilidad v2 ─────────────────────────────────────────────────
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
  const [filtro, setFiltro] = useState<'all' | '30' | '7'>('all')

  const barCanvasRef  = useRef<HTMLCanvasElement>(null)
  const donutCanvasRef = useRef<HTMLCanvasElement>(null)
  const barChartRef   = useRef<unknown>(null)
  const donutChartRef = useRef<unknown>(null)

  useEffect(() => { cargarStats() }, [])

  // Cargar Chart.js desde CDN una sola vez
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as unknown as Record<string, unknown>).Chart) {
      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js'
      script.onload = () => { if (stats) renderCharts(stats) }
      document.head.appendChild(script)
    }
  }, [])

  useEffect(() => {
    if (stats) renderCharts(stats)
  }, [stats])

  async function cargarStats() {
    setLoadingStats(true)
    try {
      const res = await fetch('/api/reportes/stats')
      const { mats, logs, projs } = await res.json()

      const totalMateriales = mats.reduce((s: number, m: MaterialRow) => s + (m.costo_material || 0), 0)
      const totalManoObra   = mats.reduce((s: number, m: MaterialRow) => s + (m.costo_mano_obra || 0), 0)

      const porCategoria: Record<string, number> = {}
      mats.forEach((m: MaterialRow) => {
        const cat = m.categoria || 'Sin categoría'
        porCategoria[cat] = (porCategoria[cat] || 0) + (m.costo_material || 0)
      })

      const porTienda: Record<string, number> = {}
      logs
        .filter((l: { tienda: string; es_precio_elegido: boolean }) => l.es_precio_elegido)
        .forEach((l: { tienda: string }) => {
          const t = l.tienda || 'Desconocida'
          porTienda[t] = (porTienda[t] || 0) + 1
        })

      // Materiales agrupados por proyecto para la gráfica de barras
      const matsPorProyecto: Record<string, { mat: number; mo: number; code: string }> = {}
      proyectos.forEach(p => {
        matsPorProyecto[p.id] = { mat: 0, mo: 0, code: p.project_code }
      })
      mats.forEach((m: MaterialRow) => {
        if (matsPorProyecto[m.proyecto_id]) {
          matsPorProyecto[m.proyecto_id].mat += m.costo_material || 0
          matsPorProyecto[m.proyecto_id].mo  += m.costo_mano_obra || 0
        }
      })

      const cotizados = projs.filter((p: ProyectoStats) => p.estado === 'COTIZADO').length
      const enviados  = projs.filter((p: ProyectoStats) => p.estado === 'ENVIADO').length

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
        matsPorProyecto,
      })
    } catch (e) {
      console.error(e)
    }
    setLoadingStats(false)
  }

  function renderCharts(s: StatsRentabilidad) {
    const Chart = (window as unknown as Record<string, unknown>).Chart as {
      new (...args: unknown[]): unknown
    } | undefined
    if (!Chart) return

    // ── Gráfica barras apiladas ──────────────────────────────────────────────
    if (barCanvasRef.current) {
      if (barChartRef.current) (barChartRef.current as { destroy: () => void }).destroy()
      const topProjs = Object.entries(s.matsPorProyecto)
        .filter(([, v]) => v.mat > 0)
        .slice(0, 6)

      barChartRef.current = new Chart(barCanvasRef.current, {
        type: 'bar',
        data: {
          labels: topProjs.map(([, v]) => v.code),
          datasets: [
            {
              label: 'Materiales',
              data: topProjs.map(([, v]) => Math.round(v.mat)),
              backgroundColor: '#3266ad',
              stack: 's',
            },
            {
              label: 'Mano de obra',
              data: topProjs.map(([, v]) => Math.round(v.mo)),
              backgroundColor: '#E2B84A',
              stack: 's',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx: { dataset: { label: string }; raw: number }) =>
                  `${ctx.dataset.label}: $${ctx.raw.toLocaleString('en-US')}`,
              },
            },
          },
          scales: {
            x: {
              stacked: true,
              ticks: { color: '#888', font: { size: 11 } },
              grid: { display: false },
            },
            y: {
              stacked: true,
              ticks: {
                color: '#888',
                font: { size: 11 },
                callback: (v: number) => '$' + Math.round(v / 1000) + 'k',
              },
              grid: { color: 'rgba(255,255,255,0.05)' },
            },
          },
        },
      })
    }

    // ── Donut categorías ─────────────────────────────────────────────────────
    if (donutCanvasRef.current) {
      if (donutChartRef.current) (donutChartRef.current as { destroy: () => void }).destroy()
      const sorted = Object.entries(s.porCategoria)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
      const colors = ['#3266ad', '#E2B84A', '#6DAA3F', '#D85A30', '#A855F7']

      donutChartRef.current = new Chart(donutCanvasRef.current, {
        type: 'doughnut',
        data: {
          labels: sorted.map(([k]) => k),
          datasets: [{
            data: sorted.map(([, v]) => Math.round(v)),
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#141414',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#999', font: { size: 11 }, boxWidth: 10, padding: 8 },
            },
            tooltip: {
              callbacks: {
                label: (ctx: { label: string; raw: number }) =>
                  `${ctx.label}: $${ctx.raw.toLocaleString('en-US')}`,
              },
            },
          },
          cutout: '62%',
        },
      })
    }
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
      localStorage.setItem(
        'reporte_schedule',
        JSON.stringify({ email: emailDestino, frecuencia, activo: true })
      )
      setScheduleMsg(`✅ Envío ${frecuencia} programado a ${emailDestino}`)
    } catch {
      setScheduleMsg('✅ Programación guardada localmente')
    }
  }

  function fmt(n: number) { return '$' + Math.round(n).toLocaleString('en-US') }
  function fmtK(n: number) { return n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : fmt(n) }

  const topCategorias = Object.entries(stats?.porCategoria || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 5)
  const maxCat = topCategorias[0]?.[1] || 1

  const topTiendas = Object.entries(stats?.porTienda || {})
    .sort((a, b) => b[1] - a[1])
  const totalTiendas = topTiendas.reduce((s, [, v]) => s + v, 0) || 1

  // Proyectos recientes para la tabla
  const proyectosRecientes = proyectos.slice(0, 6)

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ background: 'rgba(0,0,0,0.80)', paddingTop: '32px', paddingBottom: '40px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="relative w-full mx-4 rounded-2xl border border-[#333] overflow-hidden"
        style={{ maxWidth: '1080px', background: '#141414' }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-[#333]"
          style={{ background: '#1C1C1C' }}
        >
          <div>
            <h2 className="text-white font-bold text-lg">📊 Tablero de Rentabilidad</h2>
            <p className="text-gray-400 text-sm mt-0.5">Atlantic Services LLC · Motor RPA v2.1</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Filtros */}
            {(['all', '30', '7'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  filtro === f
                    ? 'bg-[#C9A84C] border-[#C9A84C] text-black font-bold'
                    : 'border-[#444] text-gray-400 hover:border-[#C9A84C] hover:text-[#C9A84C]'
                }`}
              >
                {f === 'all' ? 'Todos' : f === '30' ? 'Últimos 30d' : 'Últimos 7d'}
              </button>
            ))}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none ml-2 transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {loadingStats ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="text-[#C9A84C] text-3xl mb-3 animate-pulse">⬡</div>
                <p className="text-gray-400 text-sm animate-pulse">Calculando métricas...</p>
              </div>
            </div>
          ) : stats ? (
            <>
              {/* ── KPIs ────────────────────────────────────────────────── */}
              <div className="grid grid-cols-4 gap-3 mb-5">
                {[
                  {
                    label: 'Proyectos',
                    value: stats.totalProyectos.toString(),
                    sub: `${stats.cotizados} cotizados · ${stats.enviados} enviados`,
                    color: 'text-white',
                    border: 'border-[#333]',
                  },
                  {
                    label: 'Costo materiales',
                    value: fmtK(stats.totalMateriales),
                    sub: `${stats.busquedasSerpApi} consultas SerpApi`,
                    color: 'text-[#C9A84C]',
                    border: 'border-[#C9A84C33]',
                  },
                  {
                    label: 'Mano de obra est.',
                    value: fmtK(stats.totalManoObra),
                    sub: 'prom. 35% sobre materiales',
                    color: 'text-[#5BB8D4]',
                    border: 'border-[#5BB8D433]',
                  },
                  {
                    label: 'Valor total cotizado',
                    value: fmtK(stats.totalValor),
                    sub: `prom. ${fmtK(stats.avgPorProyecto)}/proyecto`,
                    color: 'text-green-400',
                    border: 'border-green-900',
                  },
                ].map(k => (
                  <div
                    key={k.label}
                    className={`rounded-xl p-4 border ${k.border}`}
                    style={{ background: '#1C1C1C' }}
                  >
                    <p className="text-gray-400 text-xs mb-1">{k.label}</p>
                    <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                    <p className="text-gray-500 text-xs mt-1">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* ── Banner automatización ────────────────────────────────── */}
              <div
                className="rounded-xl border border-green-900 mb-5 p-4"
                style={{ background: 'rgba(34,197,94,0.06)' }}
              >
                <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-3">
                  ✦ Valor generado por automatización
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
                    <p className="text-gray-500 text-xs">comparativos en 3 tiendas</p>
                    <p className="text-gray-600 text-xs">automáticos vía SerpApi</p>
                  </div>
                </div>
              </div>

              {/* ── Fila 1: Barras apiladas + Donut ─────────────────────── */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Barras apiladas por proyecto */}
                <div className="rounded-xl border border-[#333] p-4" style={{ background: '#1C1C1C' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                      Materiales vs mano de obra por proyecto
                    </p>
                    <div className="flex gap-3 text-xs text-gray-500">
                      <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: '#3266ad' }}></span>Mat.</span>
                      <span><span className="inline-block w-2 h-2 rounded-sm mr-1" style={{ background: '#E2B84A' }}></span>M.O.</span>
                    </div>
                  </div>
                  <div style={{ height: '200px' }}>
                    {Object.values(stats.matsPorProyecto).some(v => v.mat > 0) ? (
                      <canvas ref={barCanvasRef} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-600 text-sm">Sin datos de proyectos aún</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Donut categorías */}
                <div className="rounded-xl border border-[#333] p-4" style={{ background: '#1C1C1C' }}>
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-3">
                    Distribución por categoría
                  </p>
                  <div style={{ height: '200px' }}>
                    {topCategorias.length > 0 ? (
                      <canvas ref={donutCanvasRef} />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-600 text-sm">Sin datos de materiales aún</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Fila 2: Barras categorías + Barras tiendas ──────────── */}
              <div className="grid grid-cols-2 gap-4 mb-4">
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
                              <span className="font-mono" style={{ color }}>
                                {pct}% ({count})
                              </span>
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

              {/* ── Tabla proyectos recientes ────────────────────────────── */}
              <div className="rounded-xl border border-[#333] mb-4 overflow-hidden" style={{ background: '#1C1C1C' }}>
                <div className="px-4 py-3 border-b border-[#333]">
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                    Proyectos recientes
                  </p>
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: '#252525' }}>
                      {['Código', 'Cliente', 'Materiales', 'M. Obra', 'Total', 'Estado'].map(h => (
                        <th key={h} className="text-left px-4 py-2 text-gray-500 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {proyectosRecientes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-gray-600">
                          Sin proyectos
                        </td>
                      </tr>
                    ) : (
                      proyectosRecientes.map((p, i) => {
                        const d = stats.matsPorProyecto[p.id] || { mat: 0, mo: 0 }
                        const pillColor =
                          p.estado === 'ENVIADO'     ? 'bg-teal-900 text-teal-300' :
                          p.estado === 'COTIZADO'    ? 'bg-purple-900 text-purple-300' :
                          p.estado === 'EN_PROCESO'  ? 'bg-yellow-900 text-yellow-300' :
                          p.estado === 'ERROR'       ? 'bg-red-900 text-red-300' :
                                                       'bg-gray-800 text-gray-400'
                        return (
                          <tr
                            key={p.id}
                            className={`border-t border-[#2a2a2a] ${i % 2 === 0 ? '' : 'bg-[#1a1a1a]'}`}
                          >
                            <td className="px-4 py-2.5 font-mono text-[#C9A84C] font-bold">
                              {p.project_code}
                            </td>
                            <td className="px-4 py-2.5 text-gray-300">
                              {p.cliente_nombre?.split(' ').slice(0, 2).join(' ')}
                            </td>
                            <td className="px-4 py-2.5 text-gray-300 font-mono">
                              {d.mat ? fmtK(d.mat) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-[#5BB8D4] font-mono">
                              {d.mo ? fmtK(d.mo) : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-white font-mono font-bold">
                              {d.mat ? fmtK(d.mat + d.mo) : '—'}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${pillColor}`}>
                                {p.estado}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Panel envío email ────────────────────────────────────── */}
              <div
                className="rounded-xl border border-[#2a2a2a] p-4"
                style={{ background: '#1C1C1C' }}
              >
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

                {showSchedule && (
                  <div
                    className="mt-4 p-4 rounded-lg border border-[#333]"
                    style={{ background: '#252525' }}
                  >
                    <p className="text-gray-400 text-xs mb-3">
                      Configurar envío automático periódico
                    </p>
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
                      ⚠️ Requiere cron en cron-job.org →{' '}
                      <code className="text-[#C9A84C]">/api/reportes/rentabilidad</code> (GET)
                    </p>
                  </div>
                )}

                {reporteMsg && (
                  <p
                    className={`text-xs mt-3 ${
                      reporteMsg.startsWith('✅')
                        ? 'text-green-400'
                        : reporteMsg.startsWith('❌')
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {reporteMsg}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-red-400 text-sm text-center py-12">
              Error al cargar estadísticas
            </p>
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
    if (!user) { router.push('/admin/login'); return }
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
          <button
            onClick={() => setShowRentabilidad(true)}
            className="bg-[#1C1C1C] hover:bg-[#252525] text-[#C9A84C] font-bold px-5 py-2 rounded-lg border border-[#C9A84C] transition-colors"
          >
            📊 Rentabilidad
          </button>
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
                {['ID Proyecto', 'Cliente', 'Tipo', 'Área ft²', 'Estado', 'Último Paso', 'Fecha', 'Acciones'].map(h => (
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
                  className={`border-t border-[#333] hover:bg-[#252525] transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-[#1A1A1A]'}`}
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
