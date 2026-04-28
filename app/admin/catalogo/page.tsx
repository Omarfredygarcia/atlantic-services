'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

interface CatalogoItem {
  id: string
  categoria: string
  material: string
  unidad: string
  precio_base: number
  tienda: string
  desperdicio_pct: number
  mano_obra_pct: number
  activo: boolean
}

interface Opcion { id: string; nombre?: string; codigo?: string }

const EMPTY = {
  categoria: '', material: '', unidad: 'ft2',
  precio_base: 0, tienda: 'Home Depot',
  desperdicio_pct: 0.10, mano_obra_pct: 0.35, activo: true,
}

export default function CatalogoPage() {
  const router = useRouter()
  const [items, setItems]         = useState<CatalogoItem[]>([])
  const [tiendas, setTiendas]     = useState<Opcion[]>([])
  const [categorias, setCategorias] = useState<Opcion[]>([])
  const [unidades, setUnidades]   = useState<Opcion[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')
  const [search, setSearch]       = useState('')
  const [filterCat, setFilterCat] = useState('TODAS')
  const [filterTienda, setFilterTienda] = useState('TODAS')
  const [filterActivo, setFilterActivo] = useState('TODOS')
  const [modal, setModal]         = useState(false)
  const [editing, setEditing]     = useState<CatalogoItem | null>(null)
  const [form, setForm]           = useState({ ...EMPTY })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [usuario, setUsuario]     = useState('')

  useEffect(() => { checkAuth(); cargarTodo() }, [])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/admin/login'); return }
    setUsuario(user.email || '')
  }

  async function cargarTodo() {
    setLoading(true)
    const supabase = createClient()
    const [catRes, tRes, uRes, cRes] = await Promise.all([
      supabase.from('catalogo').select('*').order('categoria').order('material'),
      supabase.from('tiendas').select('id, nombre').eq('activo', true).order('nombre'),
      supabase.from('unidades').select('id, codigo, descripcion').eq('activo', true).order('codigo'),
      supabase.from('categorias').select('id, nombre').eq('activo', true).order('nombre'),
    ])
    if (catRes.data) setItems(catRes.data)
    if (tRes.data)   setTiendas(tRes.data)
    if (uRes.data)   setUnidades(uRes.data)
    if (cRes.data)   setCategorias(cRes.data)
    setLoading(false)
  }

  async function guardar() {
    setSaving(true)
    setMsg('')
    const supabase = createClient()
    if (editing) {
      const { error } = await supabase.from('catalogo')
        .update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id)
      setMsg(error ? `❌ ${error.message}` : '✅ Material actualizado')
    } else {
      const { error } = await supabase.from('catalogo').insert([form])
      setMsg(error ? `❌ ${error.message}` : '✅ Material agregado')
    }
    setSaving(false)
    cerrarModal()
    cargarTodo()
  }

  async function toggleActivo(item: CatalogoItem) {
    const supabase = createClient()
    await supabase.from('catalogo').update({ activo: !item.activo }).eq('id', item.id)
    cargarTodo()
  }

  async function eliminar(id: string) {
    const supabase = createClient()
    await supabase.from('catalogo').delete().eq('id', id)
    setDeleteConfirm(null)
    setMsg('✅ Material eliminado')
    cargarTodo()
  }

  function abrirNuevo() {
    setEditing(null)
    setForm({
      ...EMPTY,
      tienda: tiendas[0]?.nombre || 'Home Depot',
      unidad: unidades[0]?.codigo || 'ft2',
      categoria: categorias[0]?.nombre || '',
    })
    setModal(true)
  }

  function abrirEditar(item: CatalogoItem) {
    setEditing(item)
    setForm({
      categoria: item.categoria, material: item.material,
      unidad: item.unidad, precio_base: item.precio_base,
      tienda: item.tienda, desperdicio_pct: item.desperdicio_pct,
      mano_obra_pct: item.mano_obra_pct, activo: item.activo,
    })
    setModal(true)
  }

  function cerrarModal() { setModal(false); setEditing(null) }

  const catsFiltro = ['TODAS', ...Array.from(new Set(items.map(i => i.categoria))).sort()]
  const tiendasFiltro = ['TODAS', ...tiendas.map(t => t.nombre || '')]

  const filtered = items.filter(i => {
    const matchSearch = search === '' ||
      i.material.toLowerCase().includes(search.toLowerCase()) ||
      i.categoria.toLowerCase().includes(search.toLowerCase())
    const matchCat    = filterCat === 'TODAS' || i.categoria === filterCat
    const matchTienda = filterTienda === 'TODAS' || i.tienda === filterTienda
    const matchActivo = filterActivo === 'TODOS' ||
      (filterActivo === 'ACTIVO' ? i.activo : !i.activo)
    return matchSearch && matchCat && matchTienda && matchActivo
  })

  const stats = {
    total:   items.length,
    activos: items.filter(i => i.activo).length,
    cats:    new Set(items.map(i => i.categoria)).size,
  }

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
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total materiales', value: stats.total,   color: 'text-white' },
            { label: 'Activos',          value: stats.activos, color: 'text-green-400' },
            { label: 'Categorías',       value: stats.cats,    color: 'text-[#C9A84C]' },
          ].map(s => (
            <div key={s.label} className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
              <p className="text-gray-400 text-sm">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
            msg.startsWith('✅') ? 'bg-green-900/30 text-green-400 border border-green-700'
                                 : 'bg-red-900/30 text-red-400 border border-red-700'
          }`}>{msg}</div>
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
          <input type="text" placeholder="Buscar material o categoría..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="bg-[#252525] text-white border border-[#333] rounded-lg px-4 py-2 text-sm w-56" />
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
        <div className="bg-[#1C1C1C] rounded-xl border border-[#333] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#C9A84C]">
                {['Categoría','Material','Unidad','Tienda','Precio Base','Desperdicio','Mano Obra','Estado','Acciones'].map(h => (
                  <th key={h} className="text-black font-bold text-xs px-3 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center text-gray-400 py-12">Cargando catálogo...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center text-gray-400 py-12">No hay materiales</td></tr>
              ) : filtered.map((item, i) => (
                <tr key={item.id}
                  className={`border-t border-[#333] hover:bg-[#252525] transition-colors ${i%2===0?'':'bg-[#1A1A1A]'}`}>
                  <td className="px-3 py-3 text-[#C9A84C] text-xs font-semibold">{item.categoria}</td>
                  <td className="px-3 py-3 text-white text-sm">{item.material}</td>
                  <td className="px-3 py-3 text-gray-300 text-xs font-mono">{item.unidad}</td>
                  <td className="px-3 py-3 text-gray-300 text-xs">{item.tienda}</td>
                  <td className="px-3 py-3 text-green-400 text-sm font-mono">${Number(item.precio_base).toFixed(2)}</td>
                  <td className="px-3 py-3 text-gray-300 text-xs">{(item.desperdicio_pct * 100).toFixed(0)}%</td>
                  <td className="px-3 py-3 text-gray-300 text-xs">{(item.mano_obra_pct * 100).toFixed(0)}%</td>
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

      {/* Modal Nuevo/Editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={cerrarModal}>
          <div className="bg-[#1C1C1C] border border-[#333] rounded-xl p-6 w-full max-w-lg"
            onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg mb-5">
              {editing ? '✏️ Editar Material' : '+ Nuevo Material'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Categoría *</label>
                <select value={form.categoria}
                  onChange={e => setForm({ ...form, categoria: e.target.value })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm">
                  <option value="">Seleccionar...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Tienda *</label>
                <select value={form.tienda}
                  onChange={e => setForm({ ...form, tienda: e.target.value })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm">
                  {tiendas.map(t => (
                    <option key={t.id} value={t.nombre}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-gray-400 text-xs mb-1 block">Material *</label>
                <input value={form.material}
                  onChange={e => setForm({ ...form, material: e.target.value })}
                  placeholder="Ej: Luxury Vinyl Plank, Interior Paint..."
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Unidad *</label>
                <select value={form.unidad}
                  onChange={e => setForm({ ...form, unidad: e.target.value })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm">
                  {unidades.map(u => (
                    <option key={u.id} value={u.codigo}>{u.codigo} — {(u as any).descripcion}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Precio Base (USD)</label>
                <input type="number" step="0.01" min="0"
                  value={form.precio_base}
                  onChange={e => setForm({ ...form, precio_base: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Desperdicio %</label>
                <input type="number" step="1" min="0" max="100"
                  value={Math.round(form.desperdicio_pct * 100)}
                  onChange={e => setForm({ ...form, desperdicio_pct: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="text-gray-400 text-xs mb-1 block">Mano de Obra %</label>
                <input type="number" step="1" min="0" max="100"
                  value={Math.round(form.mano_obra_pct * 100)}
                  onChange={e => setForm({ ...form, mano_obra_pct: (parseFloat(e.target.value) || 0) / 100 })}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="flex items-center gap-3">
                <label className="text-gray-400 text-xs">Activo</label>
                <button onClick={() => setForm({ ...form, activo: !form.activo })}
                  className={`w-12 h-6 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${form.activo ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={guardar} disabled={saving || !form.categoria || !form.material}
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

      {/* Confirmación eliminar */}
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
