'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

// ── Interfaces ─────────────────────────────────────────────────────────────────
interface CatalogoItem {
  id: string
  material: string
  precio_base: number
  desperdicio_pct: number
  mano_obra_pct: number
  search_query: string | null
  activo: boolean
  categoria_id: string
  tienda_id: string
  unidad_id: string
  // Nombres resueltos via JOIN
  categoria_nombre: string
  tienda_nombre: string
  unidad_codigo: string
}

interface CategoriaRef { id: string; nombre: string }
interface TiendaRef    { id: string; nombre: string }
interface UnidadRef    { id: string; codigo: string; descripcion: string }

const FORM_EMPTY = {
  categoria_id:   '',
  tienda_id:      '',
  unidad_id:      '',
  material:       '',
  precio_base:    0,
  desperdicio_pct: 0.10,
  mano_obra_pct:  0.35,
  search_query:   '',
  activo:         true,
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function CatalogoPage() {
  const router = useRouter()

  const [items,      setItems]      = useState<CatalogoItem[]>([])
  const [categorias, setCategorias] = useState<CategoriaRef[]>([])
  const [tiendas,    setTiendas]    = useState<TiendaRef[]>([])
  const [unidades,   setUnidades]   = useState<UnidadRef[]>([])

  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [msg,           setMsg]           = useState('')
  const [search,        setSearch]        = useState('')
  const [filterCat,     setFilterCat]     = useState('TODAS')
  const [filterTienda,  setFilterTienda]  = useState('TODAS')
  const [filterActivo,  setFilterActivo]  = useState('TODOS')
  const [modal,         setModal]         = useState(false)
  const [editing,       setEditing]       = useState<CatalogoItem | null>(null)
  const [form,          setForm]          = useState({ ...FORM_EMPTY })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [usuario,       setUsuario]       = useState('')

  useEffect(() => { checkAuth(); cargarTodo() }, [])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/admin/login'); return }
    setUsuario(user.email || '')
  }

  // ── Cargar todo ──────────────────────────────────────────────────────────────
  async function cargarTodo() {
    setLoading(true)
    const supabase = createClient()

    const [catRes, tRes, uRes, cRes] = await Promise.all([
      // JOIN para resolver nombres desde FKs
      supabase.from('catalogo')
        .select('*, categorias(nombre), tiendas(nombre), unidades(codigo, descripcion)')
        .order('material'),
      supabase.from('tiendas').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('unidades').select('id, codigo, descripcion').eq('activo', true).order('codigo'),
      supabase.from('categorias').select('id, nombre').eq('activo', true).order('nombre'),
    ])

    if (catRes.data) {
      const normalized: CatalogoItem[] = catRes.data.map((item: any) => ({
        ...item,
        categoria_nombre: item.categorias?.nombre  || '—',
        tienda_nombre:    item.tiendas?.nombre     || '—',
        unidad_codigo:    item.unidades?.codigo    || '—',
      }))
      setItems(normalized)
    }
    if (tRes.data) setTiendas(tRes.data)
    if (uRes.data) setUnidades(uRes.data)
    if (cRes.data) setCategorias(cRes.data)

    setLoading(false)
  }

  // ── Guardar (crear o actualizar) ─────────────────────────────────────────────
  async function guardar() {
    if (!form.categoria_id || !form.tienda_id || !form.unidad_id || !form.material.trim()) {
      setMsg('❌ Categoría, tienda, unidad y material son obligatorios')
      return
    }
    setSaving(true)
    setMsg('')
    const supabase = createClient()

    const payload = {
      categoria_id:    form.categoria_id,
      tienda_id:       form.tienda_id,
      unidad_id:       form.unidad_id,
      material:        form.material.trim(),
      precio_base:     form.precio_base,
      desperdicio_pct: form.desperdicio_pct,
      mano_obra_pct:   form.mano_obra_pct,
      search_query:    form.search_query.trim() || null,
      activo:          form.activo,
      updated_at:      new Date().toISOString(),
    }

    if (editing) {
      const { error } = await supabase.from('catalogo')
        .update(payload).eq('id', editing.id)
      setMsg(error ? `❌ ${error.message}` : '✅ Material actualizado')
    } else {
      const { error } = await supabase.from('catalogo').insert([payload])
      setMsg(error ? `❌ ${error.message}` : '✅ Material agregado al catálogo')
    }

    setSaving(false)
    cerrarModal()
    cargarTodo()
  }

  async function toggleActivo(item: CatalogoItem) {
    const supabase = createClient()
    await supabase.from('catalogo')
      .update({ activo: !item.activo, updated_at: new Date().toISOString() })
      .eq('id', item.id)
    cargarTodo()
  }

  async function eliminar(id: string) {
    const supabase = createClient()
    await supabase.from('catalogo').delete().eq('id', id)
    setDeleteConfirm(null)
    setMsg('✅ Material eliminado')
    cargarTodo()
  }

  // ── Modal ────────────────────────────────────────────────────────────────────
  function abrirNuevo() {
    setEditing(null)
    setForm({
      ...FORM_EMPTY,
      categoria_id: categorias[0]?.id || '',
      tienda_id:    tiendas[0]?.id    || '',
      unidad_id:    unidades[0]?.id   || '',
    })
    setModal(true)
  }

  function abrirEditar(item: CatalogoItem) {
    setEditing(item)
    setForm({
      categoria_id:    item.categoria_id,
      tienda_id:       item.tienda_id,
      unidad_id:       item.unidad_id,
      material:        item.material,
      precio_base:     item.precio_base,
      desperdicio_pct: item.desperdicio_pct,
      mano_obra_pct:   item.mano_obra_pct,
      search_query:    item.search_query || '',
      activo:          item.activo,
    })
    setModal(true)
  }

  function cerrarModal() { setModal(false); setEditing(null) }

  // ── Filtros ──────────────────────────────────────────────────────────────────
  const catsFiltro    = ['TODAS', ...categorias.map(c => c.nombre)]
  const tiendasFiltro = ['TODAS', ...tiendas.map(t => t.nombre)]

  const filtered = items.filter(i => {
    const matchSearch = search === '' ||
      i.material.toLowerCase().includes(search.toLowerCase()) ||
      i.categoria_nombre.toLowerCase().includes(search.toLowerCase()) ||
      (i.search_query || '').toLowerCase().includes(search.toLowerCase())
    const matchCat    = filterCat    === 'TODAS' || i.categoria_nombre === filterCat
    const matchTienda = filterTienda === 'TODAS' || i.tienda_nombre    === filterTienda
    const matchActivo = filterActivo === 'TODOS' ||
      (filterActivo === 'ACTIVO' ? i.activo : !i.activo)
    return matchSearch && matchCat && matchTienda && matchActivo
  })

  const stats = {
    total:   items.length,
    activos: items.filter(i => i.activo).length,
    cats:    new Set(items.map(i => i.categoria_nombre)).size,
    sinQuery: items.filter(i => !i.search_query).length,
  }

  // ── UI ────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#141414]">

      {/* Navbar */}
      <nav className="bg-[#1C1C1C] border-b border-[#333] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#C9A84C] text-xl">⬡</span>
          <span className="text-white font-bold text-sm">ATLANTIC SERVICES — Catálogo</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/catalogo/tiendas')}
            className="text-gray-400 hover:text-[#C9A84C] text-xs transition-colors">🏪 Tiendas</button>
          <button onClick={() => router.push('/admin/catalogo/categorias')}
            className="text-gray-400 hover:text-[#C9A84C] text-xs transition-colors">📂 Categorías</button>
          <button onClick={() => router.push('/admin/catalogo/unidades')}
            className="text-gray-400 hover:text-[#C9A84C] text-xs transition-colors">📐 Unidades</button>
          <button onClick={() => router.push('/admin/dashboard')}
            className="text-gray-400 hover:text-white text-sm transition-colors">← Dashboard</button>
          <span className="text-gray-400 text-sm">👤 {usuario}</span>
        </div>
      </nav>

      <div className="p-6">

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total materiales', value: stats.total,    color: 'text-white' },
            { label: 'Activos',          value: stats.activos,  color: 'text-green-400' },
            { label: 'Categorías',       value: stats.cats,     color: 'text-[#C9A84C]' },
            { label: 'Sin search_query', value: stats.sinQuery, color: stats.sinQuery > 0 ? 'text-yellow-400' : 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
              <p className="text-gray-400 text-sm">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
            msg.startsWith('✅')
              ? 'bg-green-900/30 text-green-400 border border-green-700'
              : 'bg-red-900/30 text-red-400 border border-red-700'
          }`}>{msg}</div>
        )}

        {/* Alerta si hay materiales sin search_query */}
        {stats.sinQuery > 0 && (
          <div className="mb-4 px-4 py-2 rounded-lg text-sm bg-yellow-900/30 text-yellow-400 border border-yellow-700">
            ⚠️ <strong>{stats.sinQuery} material(es)</strong> sin search_query — el RPA usará el nombre del material como búsqueda.
            Edítalos para mejorar la precisión del scraper.
          </div>
        )}

        {/* Acciones y filtros */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button onClick={abrirNuevo}
            className="bg-[#C9A84C] hover:bg-[#C97B10] text-black font-bold px-5 py-2 rounded-lg transition-colors">
            + Nuevo Material
          </button>
          <button onClick={cargarTodo}
            className="bg-[#333] hover:bg-[#444] text-white font-bold px-4 py-2 rounded-lg transition-colors">
            ↻ Actualizar
          </button>
          <input type="text" placeholder="Buscar material, categoría o search query..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-[#252525] text-white border border-[#333] rounded-lg px-4 py-2 text-sm w-72" />
          <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
            className="bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm">
            {catsFiltro.map(c => <option key={c}>{c}</option>)}
          </select>
          <select value={filterTienda} onChange={e => setFilterTienda(e.target.value)}
            className="bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm">
            {tiendasFiltro.map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterActivo} onChange={e => setFilterActivo(e.target.value)}
            className="bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm">
            <option value="TODOS">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="INACTIVO">Inactivos</option>
          </select>
          <span className="text-gray-500 text-sm ml-auto">{filtered.length} registros</span>
        </div>

        {/* Tabla */}
        <div className="bg-[#1C1C1C] rounded-xl border border-[#333] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#C9A84C]">
                {['Categoría','Material','Search Query','Unidad','Tienda','Precio Base','Desperd.','M. Obra','Estado','Acciones'].map(h => (
                  <th key={h} className="text-black font-bold text-xs px-3 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center text-gray-400 py-12">Cargando catálogo...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={10} className="text-center text-gray-400 py-12">No hay materiales</td></tr>
              ) : filtered.map((item, i) => (
                <tr key={item.id}
                  className={`border-t border-[#333] hover:bg-[#252525] transition-colors ${i%2===0?'':'bg-[#1A1A1A]'}`}>
                  <td className="px-3 py-3 text-[#C9A84C] text-xs font-semibold whitespace-nowrap">
                    {item.categoria_nombre}
                  </td>
                  <td className="px-3 py-3 text-white text-sm">{item.material}</td>
                  <td className="px-3 py-3 max-w-[200px]">
                    {item.search_query
                      ? <span className="text-blue-400 text-xs font-mono">{item.search_query}</span>
                      : <span className="text-gray-600 text-xs italic">— sin definir</span>
                    }
                  </td>
                  <td className="px-3 py-3 text-gray-300 text-xs font-mono whitespace-nowrap">
                    {item.unidad_codigo}
                  </td>
                  <td className="px-3 py-3 text-gray-300 text-xs whitespace-nowrap">{item.tienda_nombre}</td>
                  <td className="px-3 py-3 text-green-400 text-sm font-mono whitespace-nowrap">
                    ${Number(item.precio_base).toFixed(2)}
                  </td>
                  <td className="px-3 py-3 text-gray-300 text-xs text-center">
                    {(item.desperdicio_pct * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-3 text-gray-300 text-xs text-center">
                    {(item.mano_obra_pct * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-3">
                    <button onClick={() => toggleActivo(item)}
                      className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${
                        item.activo
                          ? 'bg-green-900/40 text-green-400 hover:bg-red-900/40 hover:text-red-400'
                          : 'bg-red-900/40 text-red-400 hover:bg-green-900/40 hover:text-green-400'
                      }`}>
                      {item.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => abrirEditar(item)}
                        className="bg-[#333] hover:bg-[#C9A84C] hover:text-black text-white text-xs px-3 py-1 rounded transition-colors">
                        ✏️
                      </button>
                      <button onClick={() => setDeleteConfirm(item.id)}
                        className="bg-red-900/40 hover:bg-red-700 text-red-400 hover:text-white text-xs px-3 py-1 rounded transition-colors">
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Nuevo / Editar ───────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={cerrarModal}>
          <div className="bg-[#1C1C1C] border border-[#333] rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}>

            <h2 className="text-white font-bold text-lg mb-5">
              {editing ? '✏️ Editar Material' : '+ Nuevo Material'}
            </h2>

            <div className="grid grid-cols-2 gap-4">

              {/* Categoría */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Categoría *</label>
                <select value={form.categoria_id}
                  onChange={e => setForm({ ...form, categoria_id: e.target.value })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm">
                  <option value="">Seleccionar...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Tienda */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Tienda *</label>
                <select value={form.tienda_id}
                  onChange={e => setForm({ ...form, tienda_id: e.target.value })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm">
                  <option value="">Seleccionar...</option>
                  {tiendas.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              {/* Material */}
              <div className="col-span-2">
                <label className="text-gray-400 text-xs mb-1 block">Material *</label>
                <input value={form.material}
                  onChange={e => setForm({ ...form, material: e.target.value })}
                  placeholder="Ej: Luxury Vinyl Plank, Interior Paint..."
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* Search Query — campo clave para el scraper */}
              <div className="col-span-2">
                <label className="text-gray-400 text-xs mb-1 block">
                  Search Query
                  <span className="text-gray-600 ml-2 font-normal">
                    (texto exacto para buscar en tienda — vacío usa el nombre del material)
                  </span>
                </label>
                <input value={form.search_query}
                  onChange={e => setForm({ ...form, search_query: e.target.value })}
                  placeholder="Ej: luxury vinyl plank flooring waterproof 6x36"
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* Unidad */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Unidad *</label>
                <select value={form.unidad_id}
                  onChange={e => setForm({ ...form, unidad_id: e.target.value })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm">
                  <option value="">Seleccionar...</option>
                  {unidades.map(u => (
                    <option key={u.id} value={u.id}>{u.codigo} — {u.descripcion}</option>
                  ))}
                </select>
              </div>

              {/* Precio Base */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Precio Base (USD)</label>
                <input type="number" step="0.01" min="0"
                  value={form.precio_base}
                  onChange={e => setForm({ ...form, precio_base: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* Desperdicio */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Desperdicio %</label>
                <input type="number" step="1" min="0" max="100"
                  value={Math.round(form.desperdicio_pct * 100)}
                  onChange={e => setForm({ ...form, desperdicio_pct: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* Mano de obra */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Mano de Obra %</label>
                <input type="number" step="1" min="0" max="100"
                  value={Math.round(form.mano_obra_pct * 100)}
                  onChange={e => setForm({ ...form, mano_obra_pct: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* Toggle Activo */}
              <div className="flex items-center gap-3">
                <label className="text-gray-400 text-xs">Activo</label>
                <button onClick={() => setForm({ ...form, activo: !form.activo })}
                  className={`w-12 h-6 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${form.activo ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={guardar}
                disabled={saving || !form.categoria_id || !form.tienda_id || !form.unidad_id || !form.material.trim()}
                className="flex-1 bg-[#C9A84C] hover:bg-[#C97B10] disabled:bg-gray-600 text-black font-bold py-2 rounded-lg transition-colors">
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Agregar'}
              </button>
              <button onClick={cerrarModal}
                className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2 rounded-lg transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirmación eliminar ──────────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] border border-red-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold text-lg mb-2">¿Eliminar material?</h2>
            <p className="text-gray-400 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => eliminar(deleteConfirm)}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded-lg">
                Eliminar
              </button>
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2 rounded-lg">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
