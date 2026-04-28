'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'
import {
  Proyecto, Material, CatalogoItem,
  CategoriaRef, TiendaRef, UnidadRef,
  TIPOS_PROYECTO
} from '@/lib/types'

// ── Componente Material Row ────────────────────────────────────────────────────
function MaterialRow({
  mat,
  catalogo,
  categorias,
  tiendas,
  onUpdate,
  onDelete,
}: {
  mat: Partial<Material>
  catalogo: CatalogoItem[]
  categorias: CategoriaRef[]
  tiendas: TiendaRef[]
  onUpdate: (field: string, val: string | number) => void
  onDelete: () => void
}) {
  // Materiales disponibles según la categoría seleccionada
  const materialesFiltrados = catalogo
    .filter(c => c.categoria_nombre === mat.categoria)
    .map(c => c.material)

  // Cuando cambia la categoría, limpiar el material seleccionado
  function handleCategoriaChange(nuevaCategoria: string) {
    onUpdate('categoria', nuevaCategoria)
    onUpdate('material', '')   // reset material
    onUpdate('unidad', 'ft2') // reset unidad al default
  }

  // Cuando cambia el material, auto-completar la unidad desde el catálogo
  function handleMaterialChange(nuevoMaterial: string) {
    onUpdate('material', nuevoMaterial)
    const item = catalogo.find(
      c => c.categoria_nombre === mat.categoria && c.material === nuevoMaterial
    )
    if (item?.unidad_nombre) {
      onUpdate('unidad', item.unidad_nombre)
    }
  }

  return (
    <tr className="border-t border-[#333]">
      <td className="px-3 py-2 text-gray-400 text-sm text-center">{mat.linea}</td>

      {/* Categoría — viene de BD */}
      <td className="px-3 py-2">
        <select
          value={mat.categoria || ''}
          onChange={e => handleCategoriaChange(e.target.value)}
          className="w-full bg-[#252525] text-white border border-[#333] rounded px-2 py-1 text-sm"
        >
          <option value="">Seleccionar...</option>
          {categorias.map(c => (
            <option key={c.id} value={c.nombre}>{c.nombre}</option>
          ))}
        </select>
      </td>

      {/* Material — filtrado por categoría seleccionada */}
      <td className="px-3 py-2">
        <select
          value={mat.material || ''}
          onChange={e => handleMaterialChange(e.target.value)}
          disabled={!mat.categoria}
          className="w-full bg-[#252525] text-white border border-[#333] rounded px-2 py-1 text-sm disabled:opacity-40"
        >
          <option value="">Seleccionar...</option>
          {materialesFiltrados.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </td>

      {/* Área ft² */}
      <td className="px-3 py-2">
        <input
          type="number"
          value={mat.area_ft2 || ''}
          onChange={e => onUpdate('area_ft2', parseFloat(e.target.value))}
          className="w-full bg-[#252525] text-white border border-[#333] rounded px-2 py-1 text-sm"
          placeholder="0"
          min="0"
        />
      </td>

      {/* Tienda preferida — viene de BD */}
      <td className="px-3 py-2">
        <select
          value={mat.tienda_preferida || ''}
          onChange={e => onUpdate('tienda_preferida', e.target.value)}
          className="w-full bg-[#252525] text-white border border-[#333] rounded px-2 py-1 text-sm"
        >
          <option value="">Seleccionar...</option>
          {tiendas.map(t => (
            <option key={t.id} value={t.nombre}>{t.nombre}</option>
          ))}
        </select>
      </td>

      {/* Precio y costo — calculados por el RPA */}
      <td className="px-3 py-2 text-green-400 text-sm text-center">
        {mat.precio_unitario ? `$${mat.precio_unitario.toFixed(2)}` : '—'}
      </td>
      <td className="px-3 py-2 text-green-400 text-sm text-center">
        {mat.costo_material ? `$${mat.costo_material.toFixed(2)}` : '—'}
      </td>

      {/* Eliminar */}
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
  const router   = useRouter()
  const params   = useParams()
  const isNuevo  = !params?.id || params.id === 'nuevo'

  const [proyecto,   setProyecto]   = useState<Partial<Proyecto>>({
    estado: 'PENDIENTE',
    fecha_creacion: new Date().toISOString().split('T')[0],
  })
  const [materiales, setMateriales] = useState<Partial<Material>[]>([])

  // Datos de referencia desde BD
  const [catalogo,   setCatalogo]   = useState<CatalogoItem[]>([])
  const [categorias, setCategorias] = useState<CategoriaRef[]>([])
  const [tiendas,    setTiendas]    = useState<TiendaRef[]>([])

  const [loading,    setLoading]    = useState(false)
  const [guardando,  setGuardando]  = useState(false)
  const [msg,        setMsg]        = useState('')

  useEffect(() => {
    cargarReferencias()
    if (!isNuevo) cargarProyecto()
  }, [])

  // ── Cargar catálogo + tablas de referencia desde BD ───────────────────────
  async function cargarReferencias() {
    const supabase = createClient()

    // Catálogo con JOIN para obtener nombres de categoría, tienda y unidad
    const { data: catData } = await supabase
      .from('catalogo')
      .select('*, categorias(nombre), tiendas(nombre), unidades(nombre)')
      .eq('activo', true)
      .order('material')

    if (catData) {
      const itemsNormalizados: CatalogoItem[] = catData.map((item: any) => ({
        ...item,
        categoria_nombre: item.categorias?.nombre || '',
        tienda_nombre:    item.tiendas?.nombre    || '',
        unidad_nombre:    item.unidades?.nombre   || '',
      }))
      setCatalogo(itemsNormalizados)
    }

    // Categorías activas para el dropdown
    const { data: catRefs } = await supabase
      .from('categorias')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre')
    if (catRefs) setCategorias(catRefs)

    // Tiendas activas para el dropdown
    const { data: tiendaRefs } = await supabase
      .from('tiendas')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre')
    if (tiendaRefs) setTiendas(tiendaRefs)
  }

  async function cargarProyecto() {
    setLoading(true)
    const supabase = createClient()

    const { data: proy } = await supabase
      .from('proyectos').select('*').eq('id', params.id).single()
    if (proy) setProyecto(proy)

    const { data: mats } = await supabase
      .from('materiales').select('*').eq('proyecto_id', params.id).order('linea')
    if (mats) setMateriales(mats)

    setLoading(false)
  }

  function agregarMaterial() {
    const linea = materiales.length + 1
    setMateriales(prev => [...prev, { linea, area_ft2: 0, unidad: 'ft2' }])
  }

  function actualizarMaterial(idx: number, field: string, val: string | number) {
    setMateriales(prev => prev.map((m, i) => i === idx ? { ...m, [field]: val } : m))
  }

  function eliminarMaterial(idx: number) {
    setMateriales(prev => {
      const filtered = prev.filter((_, i) => i !== idx)
      return filtered.map((m, i) => ({ ...m, linea: i + 1 }))
    })
  }

  async function guardar() {
    if (!proyecto.cliente_nombre || !proyecto.cliente_email) {
      setMsg('❌ Nombre y email del cliente son obligatorios')
      return
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

        // Insertar materiales válidos (con categoría y material seleccionados)
        const matsValidos = materiales.filter(m => m.categoria && m.material)
        if (matsValidos.length > 0) {
          const { error: matError } = await supabase.from('materiales').insert(
            matsValidos.map(m => ({
              proyecto_id:      proyectoId,
              linea:            m.linea,
              categoria:        m.categoria,
              material:         m.material,
              area_ft2:         m.area_ft2 || 0,
              unidad:           m.unidad || 'ft2',  // unidad auto-completada desde catálogo
              tienda_preferida: m.tienda_preferida,
            }))
          )
          if (matError) throw matError
        }

        setMsg('✅ Proyecto creado. Ve al Dashboard y corre el RPA.')
        setTimeout(() => router.push('/admin/dashboard'), 2000)

      } else {
        // Actualizar proyecto existente
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
        setMsg('✅ Proyecto actualizado correctamente.')
        setTimeout(() => router.push('/admin/dashboard'), 1500)
      }
    } catch (e: any) {
      setMsg(`❌ Error: ${e.message}`)
    }
    setGuardando(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <p className="text-gray-400">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Navbar */}
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

      <div className="p-6 max-w-5xl mx-auto">

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
              { label: 'Nombre del Cliente *', key: 'cliente_nombre', type: 'text',   placeholder: 'John Smith' },
              { label: 'Email del Cliente *',  key: 'cliente_email',  type: 'email',  placeholder: 'john@gmail.com' },
              { label: 'Teléfono',             key: 'cliente_telefono', type: 'text', placeholder: '(317) 555-1234' },
              { label: 'Área Total (ft²)',      key: 'area_total_ft2', type: 'number', placeholder: '850' },
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
                placeholder="123 Main St, Indianapolis, IN 46268"
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
            <h2 className="text-[#C9A84C] font-bold text-sm uppercase tracking-wider">Materiales</h2>
            <div className="flex-1 h-px bg-[#C9A84C]" />
            <button
              onClick={agregarMaterial}
              className="bg-[#C9A84C] hover:bg-[#C97B10] text-black font-bold text-sm px-4 py-2 rounded-lg"
            >
              + Agregar Material
            </button>
          </div>

          {/* Indicador si el catálogo está vacío */}
          {catalogo.length === 0 && (
            <div className="mb-3 px-4 py-2 rounded-lg text-sm bg-yellow-900/30 text-yellow-400 border border-yellow-700">
              ⚠️ El catálogo está vacío. Agrega materiales en{' '}
              <button
                onClick={() => router.push('/admin/catalogo')}
                className="underline hover:text-yellow-300"
              >
                /admin/catalogo
              </button>{' '}
              antes de crear materiales.
            </div>
          )}

          <div className="bg-[#1C1C1C] rounded-xl border border-[#333] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-[#C9A84C]">
                  {['#', 'Categoría', 'Material', 'Área ft²', 'Tienda', 'Precio Unit.', 'Costo Total', ''].map(h => (
                    <th key={h} className="text-black font-bold text-xs px-3 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {materiales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-gray-500 py-8 text-sm">
                      No hay materiales — haz click en "+ Agregar Material"
                    </td>
                  </tr>
                ) : materiales.map((m, i) => (
                  <MaterialRow
                    key={i}
                    mat={m}
                    catalogo={catalogo}
                    categorias={categorias}
                    tiendas={tiendas}
                    onUpdate={(field, val) => actualizarMaterial(i, field, val)}
                    onDelete={() => eliminarMaterial(i)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mensaje */}
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
            msg.startsWith('✅')
              ? 'bg-green-900/30 text-green-400 border border-green-700'
              : 'bg-red-900/30 text-red-400 border border-red-700'
          }`}>
            {msg}
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3">
          <button
            onClick={guardar}
            disabled={guardando}
            className="bg-[#C9A84C] hover:bg-[#C97B10] disabled:bg-gray-600 text-black font-bold px-8 py-3 rounded-lg transition-colors"
          >
            {guardando ? 'Guardando...' : '💾 Guardar Proyecto'}
          </button>
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="bg-[#333] hover:bg-[#444] text-white font-bold px-6 py-3 rounded-lg"
          >
            ✕ Cancelar
          </button>
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
