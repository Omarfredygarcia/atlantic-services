'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import {
  Proyecto, Material, CatalogoItem,
  CategoriaRef, TiendaRef, UnidadRef,
  TIPOS_PROYECTO, PRECIO_SOURCE_LABELS, PrecioSource
} from '@/lib/types'

// ── Badge precio_source ────────────────────────────────────────────────────────
function PrecioSourceBadge({ source }: { source?: PrecioSource }) {
  if (!source) return null
  const colors: Record<PrecioSource, string> = {
    fixed:       'bg-blue-900 text-blue-300',
    manual:      'bg-yellow-900 text-yellow-300',
    scrapingbee: 'bg-purple-900 text-purple-300',
    serpapi:     'bg-green-900 text-green-300',
  }
  const labels: Record<PrecioSource, string> = {
    fixed:       '🔒 Fijo',
    manual:      '✏️ Manual',
    scrapingbee: '🐝 Scraping',
    serpapi:     '🌐 Google',
  }
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[source]}`}>
      {labels[source]}
    </span>
  )
}

// ── Componente Material Row ────────────────────────────────────────────────────
function MaterialRow({
  mat,
  catalogo,
  categorias,
  onUpdate,
  onDelete,
}: {
  mat: Partial<Material>
  catalogo: CatalogoItem[]
  categorias: CategoriaRef[]
  onUpdate: (field: string, val: string | number | null) => void
  onDelete: () => void
}) {
  const materialesFiltrados = catalogo.filter(
    c => c.categoria_id === mat.categoria_id
  )
  const itemSeleccionado = catalogo.find(c => c.id === mat.catalogo_id)

  function handleCategoriaChange(categoriaId: string) {
    const cat = categorias.find(c => c.id === categoriaId)
    onUpdate('categoria_id',    categoriaId)
    onUpdate('categoria',       cat?.nombre || '')
    onUpdate('catalogo_id',     null)
    onUpdate('material',        '')
    onUpdate('tienda_id',       null)
    onUpdate('tienda_preferida','')
    onUpdate('unidad_id',       null)
    onUpdate('unidad',          '')
    onUpdate('search_query',    '')
    onUpdate('desperdicio_pct', '')
    onUpdate('mano_obra_pct',   '')
  }

  function handleMaterialChange(catalogoId: string) {
    const item = catalogo.find(c => c.id === catalogoId)
    if (!item) return
    onUpdate('catalogo_id',     item.id)
    onUpdate('material',        item.material)
    onUpdate('tienda_id',       item.tienda_id)
    onUpdate('tienda_preferida',item.tienda_nombre || '')
    onUpdate('unidad_id',       item.unidad_id)
    onUpdate('unidad',          item.unidad_codigo || '')
    onUpdate('search_query',    item.search_query || '')
    onUpdate('desperdicio_pct', item.desperdicio_pct)
    onUpdate('mano_obra_pct',   item.mano_obra_pct)
  }

  const precioBase = itemSeleccionado?.precio_source === 'fixed'
    ? itemSeleccionado?.precio_base_usd || itemSeleccionado?.precio_base
    : itemSeleccionado?.precio_base

  return (
    <tr className="border-t border-[#333]">
      <td className="px-3 py-2 text-gray-400 text-sm text-center">{mat.linea}</td>

      <td className="px-3 py-2">
        <select
          value={mat.categoria_id || ''}
          onChange={e => handleCategoriaChange(e.target.value)}
          className="w-full bg-[#252525] text-white border border-[#333] rounded px-2 py-1 text-sm"
        >
          <option value="">Categoría...</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </td>

      <td className="px-3 py-2">
        <select
          value={mat.catalogo_id || ''}
          onChange={e => handleMaterialChange(e.target.value)}
          disabled={!mat.categoria_id}
          className="w-full bg-[#252525] text-white border border-[#333] rounded px-2 py-1 text-sm disabled:opacity-40"
        >
          <option value="">Material...</option>
          {materialesFiltrados.map(m => (
            <option key={m.id} value={m.id}>{m.material}</option>
          ))}
        </select>
      </td>

      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            value={mat.area_ft2 || ''}
            onChange={e => onUpdate('area_ft2', parseFloat(e.target.value) || 0)}
            className="w-full bg-[#252525] text-white border border-[#333] rounded px-2 py-1 text-sm"
            placeholder="0"
            min="0"
          />
          <span className="text-gray-500 text-xs whitespace-nowrap">
            {mat.unidad || ''}
          </span>
        </div>
      </td>

      <td className="px-3 py-2 text-gray-400 text-xs">{mat.tienda_preferida || '—'}</td>

      <td className="px-3 py-2 text-center">
        <PrecioSourceBadge source={itemSeleccionado?.precio_source} />
      </td>

      <td className="px-3 py-2 text-gray-400 text-sm text-right">
        {precioBase ? `$${Number(precioBase).toFixed(2)}` : '—'}
      </td>

      <td className="px-3 py-2">
        <input
          type="number"
          value={mat.precio_unitario ?? ''}
          onChange={e => onUpdate('precio_unitario', parseFloat(e.target.value) || 0)}
          className="w-24 bg-[#252525] text-green-300 border border-[#333] rounded px-2 py-1 text-sm text-right"
          placeholder="$ override"
          title="Precio para esta cotización (no afecta el default del catálogo)"
          min="0"
          step="0.01"
        />
      </td>

      <td className="px-3 py-2">
        <input
          type="number"
          value={mat.desperdicio_pct ?? ''}
          onChange={e => onUpdate('desperdicio_pct', parseFloat(e.target.value) || 0)}
          className="w-16 bg-[#252525] text-white border border-[#333] rounded px-2 py-1 text-sm text-right"
          placeholder="%"
          title="Desperdicio para esta cotización"
          min="0"
          step="0.1"
        />
      </td>

      <td className="px-3 py-2">
        <input
          type="number"
          value={mat.mano_obra_pct ?? ''}
          onChange={e => onUpdate('mano_obra_pct', parseFloat(e.target.value) || 0)}
          className="w-16 bg-[#252525] text-white border border-[#333] rounded px-2 py-1 text-sm text-right"
          placeholder="%"
          title="Mano de obra para esta cotización"
          min="0"
          step="0.1"
        />
      </td>

      <td className="px-3 py-2 text-gray-400 text-sm text-right">
        {mat.cantidad_total ?? '—'}
      </td>

      <td className="px-3 py-2 text-green-400 text-sm text-right font-medium">
        {mat.costo_material ? `$${mat.costo_material.toFixed(2)}` : '—'}
      </td>

      <td className="px-3 py-2 text-center">
        <button
          onClick={onDelete}
          className="bg-red-800 hover:bg-red-700 text-white text-xs px-2 py-1 rounded"
        >
          ✕
        </button>
      </td>
    </tr>
  )
}


// ── Página principal ───────────────────────────────────────────────────────────
export default function ProyectoFormPage() {
  const router  = useRouter()
  const params  = useParams()
  const isNuevo = !params?.id || params.id === 'nuevo'

  const [proyecto,   setProyecto]   = useState<Partial<Proyecto>>({
    estado: 'PENDIENTE',
    fecha_creacion: new Date().toISOString().split('T')[0],
  })
  const [materiales, setMateriales] = useState<Partial<Material>[]>([])
  const [materialesOriginalIds, setMaterialesOriginalIds] = useState<Set<string>>(new Set())
  const [catalogo,   setCatalogo]   = useState<CatalogoItem[]>([])
  const [categorias, setCategorias] = useState<CategoriaRef[]>([])
  const [loading,    setLoading]    = useState(false)
  const [guardando,  setGuardando]  = useState(false)
  const [regenerando,setRegenerando]= useState(false)
  const [msg,        setMsg]        = useState('')

  useEffect(() => {
    cargarReferencias()
    if (!isNuevo) cargarProyecto()
  }, [])

  async function cargarReferencias() {
    const supabase = createClient()

    // ── FIX: csi_division y csi_nombre ya no existen en categorias
    // El JOIN ahora es: categorias → divisiones (division_id FK)
    // Solo pedimos id y nombre de categorias — sin columnas CSI eliminadas
    const { data: catData, error: catError } = await supabase
      .from('catalogo')
      .select(`
        *,
        categorias(id, nombre),
        tiendas(id, nombre),
        unidades(id, codigo, descripcion)
      `)
      .eq('activo', true)
      .order('material')

    if (catError) {
      console.error('Error cargando catálogo:', catError.message)
    }

    if (catData) {
      const items: CatalogoItem[] = catData.map((item: any) => ({
        ...item,
        categoria_nombre: item.categorias?.nombre     || '',
        tienda_nombre:    item.tiendas?.nombre        || '',
        unidad_codigo:    item.unidades?.codigo       || '',
        unidad_desc:      item.unidades?.descripcion  || '',
      }))
      setCatalogo(items)
    }

    // ── FIX: categorias sin csi_division/csi_nombre — solo id y nombre
    const { data: cats, error: catsError } = await supabase
      .from('categorias')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre')

    if (catsError) {
      console.error('Error cargando categorías:', catsError.message)
    }
    if (cats) setCategorias(cats)
  }

  async function cargarProyecto() {
    setLoading(true)
    const supabase = createClient()
    const { data: proy } = await supabase
      .from('proyectos').select('*').eq('id', params.id).single()
    if (proy) setProyecto(proy)
    const { data: mats } = await supabase
      .from('materiales').select('*').eq('proyecto_id', params.id).order('linea')
    if (mats) {
      setMateriales(mats)
      setMaterialesOriginalIds(new Set(mats.map((m: Material) => m.id)))
    }
    setLoading(false)
  }

  function agregarMaterial() {
    setMateriales(prev => [...prev, {
      linea:    prev.length + 1,
      area_ft2: 0,
      unidad:   '',
    }])
  }

  function actualizarMaterial(idx: number, field: string, val: string | number | null) {
    setMateriales(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m))
  }

  function eliminarMaterial(idx: number) {
    setMateriales(prev =>
      prev.filter((_, i) => i !== idx).map((m, i) => ({ ...m, linea: i + 1 }))
    )
  }

  async function guardar() {
    if (!proyecto.cliente_nombre || !proyecto.cliente_email) {
      setMsg('❌ Nombre y email del cliente son obligatorios')
      return false
    }
    setGuardando(true)
    setMsg('')
    const supabase = createClient()

    try {
      let proyectoId = params?.id as string

      if (isNuevo) {
        const { data, error } = await supabase
          .from('proyectos')
          .insert({
            project_code:     '',
            cliente_nombre:   proyecto.cliente_nombre,
            cliente_email:    proyecto.cliente_email,
            cliente_telefono: proyecto.cliente_telefono,
            direccion:        proyecto.direccion,
            tipo_proyecto:    proyecto.tipo_proyecto,
            descripcion:      proyecto.descripcion,
            area_total_ft2:   proyecto.area_total_ft2,
            estado:           'PENDIENTE',
          })
          .select().single()

        if (error) throw error
        proyectoId = data.id

        const matsValidos = materiales.filter(m => m.catalogo_id && m.categoria_id)
        if (matsValidos.length > 0) {
          const { error: matError } = await supabase.from('materiales').insert(
            matsValidos.map(m => ({
              proyecto_id:      proyectoId,
              linea:            m.linea,
              catalogo_id:      m.catalogo_id,
              categoria_id:     m.categoria_id,
              tienda_id:        m.tienda_id,
              unidad_id:        m.unidad_id,
              categoria:        m.categoria,
              material:         m.material,
              area_ft2:         m.area_ft2 || 0,
              unidad:           m.unidad || '',
              tienda_preferida: m.tienda_preferida,
              search_query:     m.search_query,
              desperdicio_pct:  m.desperdicio_pct,
              mano_obra_pct:    m.mano_obra_pct,
              precio_unitario:  m.precio_unitario || null,
            }))
          )
          if (matError) throw matError
        }

        setMsg('✅ Proyecto creado. Ve al Dashboard y corre el RPA.')
        setTimeout(() => router.push('/admin/dashboard'), 2000)

      } else {
        const { error } = await supabase.from('proyectos').update({
          cliente_nombre:   proyecto.cliente_nombre,
          cliente_email:    proyecto.cliente_email,
          cliente_telefono: proyecto.cliente_telefono,
          direccion:        proyecto.direccion,
          tipo_proyecto:    proyecto.tipo_proyecto,
          descripcion:      proyecto.descripcion,
          area_total_ft2:   proyecto.area_total_ft2,
        }).eq('id', proyectoId)

        if (error) throw error

        // Filas que ya existían y el usuario quitó con ✕ → borrar solo esas
        const idsActuales = new Set(materiales.map(m => m.id).filter(Boolean))
        const idsABorrar  = [...materialesOriginalIds].filter(id => !idsActuales.has(id))
        if (idsABorrar.length > 0) {
          const { error: delError } = await supabase.from('materiales').delete().in('id', idsABorrar)
          if (delError) throw delError
        }

        // Filas existentes → UPDATE puntual (nunca toca campos calculados por el RPA)
        const existentes = materiales.filter(m => m.id && m.catalogo_id && m.categoria_id)
        for (const m of existentes) {
          const { error: updError } = await supabase.from('materiales').update({
            linea:            m.linea,
            catalogo_id:      m.catalogo_id,
            categoria_id:     m.categoria_id,
            tienda_id:        m.tienda_id,
            unidad_id:        m.unidad_id,
            categoria:        m.categoria,
            material:         m.material,
            area_ft2:         m.area_ft2 || 0,
            unidad:           m.unidad || '',
            tienda_preferida: m.tienda_preferida,
            search_query:     m.search_query,
            desperdicio_pct:  m.desperdicio_pct,
            mano_obra_pct:    m.mano_obra_pct,
            precio_unitario:  m.precio_unitario || null,
          }).eq('id', m.id)
          if (updError) throw updError
        }

        // Filas nuevas (agregadas con "+ Agregar") → INSERT
        const nuevos = materiales.filter(m => !m.id && m.catalogo_id && m.categoria_id)
        if (nuevos.length > 0) {
          const { data: insertados, error: insError } = await supabase.from('materiales').insert(
            nuevos.map(m => ({
              proyecto_id:      proyectoId,
              linea:            m.linea,
              catalogo_id:      m.catalogo_id,
              categoria_id:     m.categoria_id,
              tienda_id:        m.tienda_id,
              unidad_id:        m.unidad_id,
              categoria:        m.categoria,
              material:         m.material,
              area_ft2:         m.area_ft2 || 0,
              unidad:           m.unidad || '',
              tienda_preferida: m.tienda_preferida,
              search_query:     m.search_query,
              desperdicio_pct:  m.desperdicio_pct,
              mano_obra_pct:    m.mano_obra_pct,
              precio_unitario:  m.precio_unitario || null,
            }))
          ).select()
          if (insError) throw insError
          if (insertados) {
            // Asignar IDs devueltos al estado para que el siguiente guardado
            // los trate como existentes (UPDATE) y no los reinserte
            setMateriales(prev => {
              let idx = 0
              return prev.map(m => {
                if (!m.id && m.catalogo_id && m.categoria_id && idx < insertados.length) {
                  return { ...m, id: insertados[idx++].id }
                }
                return m
              })
            })
            setMaterialesOriginalIds(prev => new Set([...prev, ...insertados.map((r: Material) => r.id)]))
          }
        }

        setMsg('✅ Proyecto actualizado correctamente.')
      }
      setGuardando(false)
      return true
    } catch (e: any) {
      setMsg(`❌ Error: ${e.message}`)
      setGuardando(false)
      return false
    }
  }

  async function resetear() {
    if (!confirm('¿Resetear a PENDIENTE para que el RPA lo procese de nuevo?')) return
    const supabase = createClient()
    await supabase.from('proyectos').update({
      estado:             'PENDIENTE',
      ultimo_paso:        null,
      error_detalle:      null,
      fecha_hora_proceso: null,
    }).eq('id', params.id)
    setMsg('✅ Proyecto reseteado a PENDIENTE')
    cargarProyecto()
  }

  async function regenerar(skipSave = false) {
    const proyectoId = params?.id as string
    setRegenerando(true)
    setMsg('Guardando cambios...')

    if (!skipSave) {
      const guardadoOk = await guardar()
      if (!guardadoOk) {
        setRegenerando(false)
        return
      }
    }

    setMsg('Regenerando PDF y Excel...')
    try {
      const res = await fetch(`/api/proyectos/${proyectoId}/regenerar`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.ok) {
        setMsg(`✅ ${data.mensaje || 'Cotización regenerada'}`)
        cargarProyecto()
      } else {
        setMsg(`❌ Error: ${data.error || 'No se pudo regenerar la cotización'}`)
      }
    } catch (e: any) {
      setMsg(`❌ Error al conectar con el servidor RPA: ${e.message}`)
    }
    setRegenerando(false)
  }

  async function guardarYPreguntarRegenerar() {
    const ok = await guardar()
    if (ok && !isNuevo && proyecto.estado === 'COTIZADO') {
      if (confirm('Los valores cambiaron. ¿Quieres regenerar la cotización (PDF/Excel) ahora?')) {
        await regenerar(true)  // guardar() ya corrió arriba, no repetir
      } else {
        setMsg('✅ Proyecto actualizado. No olvides regenerar la cotización para que el PDF/Excel reflejen estos cambios.')
      }
    }
  }

  const totalMateriales = materiales.reduce((s, m) => s + (m.costo_material || 0), 0)
  const totalManoObra   = materiales.reduce((s, m) => s + (m.costo_mano_obra || 0), 0)
  const totalProyecto   = totalMateriales + totalManoObra

  if (loading) return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center">
      <p className="text-gray-400">Cargando...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#141414]">
      <nav className="bg-[#1C1C1C] border-b border-[#333] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#C9A84C] text-xl">⬡</span>
          <span className="text-white font-bold text-sm">
            {isNuevo ? 'Nuevo Proyecto' : `Editar — ${proyecto.project_code}`}
          </span>
        </div>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="bg-[#333] hover:bg-[#444] text-white text-sm px-4 py-2 rounded-lg"
        >
          ← Volver
        </button>
      </nav>

      <div className="p-6 max-w-6xl mx-auto">

        {/* Datos del cliente */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[#C9A84C] font-bold text-sm uppercase tracking-wider">
              Datos del Cliente
            </h2>
            <div className="flex-1 h-px bg-[#C9A84C]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Nombre del Cliente *', key: 'cliente_nombre',   type: 'text',   placeholder: 'John Smith' },
              { label: 'Email del Cliente *',  key: 'cliente_email',    type: 'email',  placeholder: 'john@gmail.com' },
              { label: 'Teléfono',             key: 'cliente_telefono', type: 'text',   placeholder: '(317) 555-1234' },
              { label: 'Área Total (ft²)',      key: 'area_total_ft2',  type: 'number', placeholder: '850' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-gray-400 text-xs font-bold mb-2">{f.label}</label>
                <input
                  type={f.type}
                  value={(proyecto as any)[f.key] || ''}
                  onChange={e => setProyecto(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C9A84C] text-sm"
                />
              </div>
            ))}

            <div>
              <label className="block text-gray-400 text-xs font-bold mb-2">Tipo de Proyecto</label>
              <select
                value={proyecto.tipo_proyecto || ''}
                onChange={e => setProyecto(prev => ({ ...prev, tipo_proyecto: e.target.value }))}
                className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C9A84C] text-sm"
              >
                <option value="">Seleccionar...</option>
                {TIPOS_PROYECTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-bold mb-2">Dirección</label>
              <input
                type="text"
                value={proyecto.direccion || ''}
                onChange={e => setProyecto(prev => ({ ...prev, direccion: e.target.value }))}
                placeholder="3360 Pentagon Blvd, Beavercreek, OH 45431"
                className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C9A84C] text-sm"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-gray-400 text-xs font-bold mb-2">Notas / Descripción</label>
            <textarea
              value={proyecto.descripcion || ''}
              onChange={e => setProyecto(prev => ({ ...prev, descripcion: e.target.value }))}
              rows={3}
              className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-4 py-3 focus:outline-none focus:border-[#C9A84C] text-sm resize-none"
              placeholder="Detalles del proyecto..."
            />
          </div>
        </div>

        {/* Materiales */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-[#C9A84C] font-bold text-sm uppercase tracking-wider">
              Materiales & Actividades
            </h2>
            <div className="flex-1 h-px bg-[#C9A84C]" />
            <button
              onClick={agregarMaterial}
              className="bg-[#C9A84C] hover:bg-[#C97B10] text-black font-bold text-sm px-4 py-2 rounded-lg"
            >
              + Agregar
            </button>
          </div>

          {catalogo.length === 0 && (
            <div className="mb-3 px-4 py-2 rounded-lg text-sm bg-yellow-900/30 text-yellow-400 border border-yellow-700">
              ⚠️ El catálogo está vacío. Agrega materiales en{' '}
              <button onClick={() => router.push('/admin/catalogo')} className="underline">
                /admin/catalogo
              </button>
            </div>
          )}

          <div className="bg-[#1C1C1C] rounded-xl border border-[#333] overflow-x-auto">
            <table className="w-full min-w-[1300px]">
              <thead>
                <tr className="bg-[#C9A84C]">
                  {['#', 'Categoría', 'Material', 'Cant / Área', 'Tienda', 'Fuente', 'Precio Cat.', 'Precio (cotización)', 'Desperdicio %', 'M. Obra %', 'Cantidad', 'Costo Total', ''].map(h => (
                    <th key={h} className="text-black font-bold text-xs px-3 py-2 text-left whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materiales.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center text-gray-500 py-8 text-sm">
                      No hay materiales — haz click en "+ Agregar"
                    </td>
                  </tr>
                ) : materiales.map((m, i) => (
                  <MaterialRow
                    key={i}
                    mat={m}
                    catalogo={catalogo}
                    categorias={categorias}
                    onUpdate={(field, val) => actualizarMaterial(i, field, val)}
                    onDelete={() => eliminarMaterial(i)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {totalProyecto > 0 && (
            <div className="mt-4 flex justify-end gap-6 text-sm">
              <span className="text-gray-400">
                Materiales: <span className="text-white">${totalMateriales.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </span>
              <span className="text-gray-400">
                Mano de obra: <span className="text-white">${totalManoObra.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </span>
              <span className="text-[#C9A84C] font-bold">
                TOTAL: ${totalProyecto.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            msg.startsWith('✅')
              ? 'bg-green-900/30 text-green-400 border border-green-700'
              : 'bg-red-900/30 text-red-400 border border-red-700'
          }`}>
            {msg}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={guardarYPreguntarRegenerar}
            disabled={guardando}
            className="bg-[#C9A84C] hover:bg-[#C97B10] disabled:bg-gray-600 text-black font-bold px-8 py-3 rounded-lg"
          >
            {guardando ? 'Guardando...' : '💾 Guardar Proyecto'}
          </button>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-[#333] hover:bg-[#444] text-white font-bold px-6 py-3 rounded-lg"
          >
            ✕ Cancelar
          </button>
          {!isNuevo && proyecto.estado === 'COTIZADO' && (
            <button
              onClick={regenerar}
              disabled={regenerando}
              title="Guarda los ajustes de esta cotización y regenera el PDF/Excel sin volver a buscar precios"
              className="bg-[#5BB8D4] hover:bg-[#4AA0BB] disabled:bg-gray-600 text-black font-bold px-6 py-3 rounded-lg"
            >
              {regenerando ? '⏳ Regenerando...' : '🔄 Regenerar Cotización'}
            </button>
          )}
          {!isNuevo && proyecto.pdf_path && (
            <button
              onClick={() => window.open(`/api/proyectos/${params.id}/pdf`, '_blank')}
              className="bg-red-800 hover:bg-red-700 text-white font-bold px-4 py-3 rounded-lg"
            >
              ↓ PDF
            </button>
          )}
          {!isNuevo && proyecto.excel_path && (
            <button
              onClick={() => window.open(`/api/proyectos/${params.id}/excel`, '_blank')}
              className="bg-green-700 hover:bg-green-600 text-white font-bold px-4 py-3 rounded-lg"
            >
              ↓ Excel
            </button>
          )}
          {!isNuevo && (
            <button
              onClick={resetear}
              className="bg-[#555] hover:bg-[#666] text-white font-bold px-6 py-3 rounded-lg ml-auto"
            >
              ↺ Resetear a PENDIENTE
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
