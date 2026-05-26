'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

interface Division {
  id: string
  codigo: string
  nombre: string
}

interface Categoria {
  id: string
  nombre: string
  descripcion: string
  activo: boolean
  division_id: string
  // Resuelto via JOIN
  division_codigo: string
  division_nombre: string
}

const EMPTY = { nombre: '', descripcion: '', activo: true, division_id: '' }

export default function CategoriasPage() {
  const router = useRouter()
  const [items, setItems]           = useState<Categoria[]>([])
  const [divisiones, setDivisiones] = useState<Division[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [msg, setMsg]               = useState('')
  const [modal, setModal]           = useState(false)
  const [editing, setEditing]       = useState<Categoria | null>(null)
  const [form, setForm]             = useState({ ...EMPTY })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [filterDiv, setFilterDiv]   = useState('TODAS')

  useEffect(() => { checkAuth(); cargar() }, [])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/admin/login')
  }

  async function cargar() {
    setLoading(true)
    const supabase = createClient()

    const [catRes, divRes] = await Promise.all([
      supabase.from('categorias')
        .select('*, divisiones(codigo, nombre)')
        .order('nombre'),
      supabase.from('divisiones')
        .select('id, codigo, nombre')
        .eq('activo', true)
        .order('codigo'),
    ])

    if (catRes.data) {
      const normalized: Categoria[] = catRes.data.map((item: any) => ({
        ...item,
        division_codigo: item.divisiones?.codigo || '—',
        division_nombre: item.divisiones?.nombre || '—',
      }))
      setItems(normalized)
    }
    if (divRes.data) setDivisiones(divRes.data)

    setLoading(false)
  }

  async function guardar() {
    if (!form.nombre.trim()) {
      setMsg('❌ El nombre es obligatorio')
      return
    }
    if (!form.division_id) {
      setMsg('❌ Debes asignar una división CSI')
      return
    }
    setSaving(true)
    setMsg('')
    const supabase = createClient()

    const payload = {
      nombre:      form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      activo:      form.activo,
      division_id: form.division_id,
    }

    if (editing) {
      const { error } = await supabase.from('categorias').update(payload).eq('id', editing.id)
      setMsg(error ? `❌ ${error.message}` : '✅ Categoría actualizada')
    } else {
      const { error } = await supabase.from('categorias').insert([payload])
      setMsg(error ? `❌ ${error.message}` : '✅ Categoría agregada')
    }

    setSaving(false)
    cerrarModal()
    cargar()
  }

  async function toggleActivo(item: Categoria) {
    const supabase = createClient()
    await supabase.from('categorias').update({ activo: !item.activo }).eq('id', item.id)
    cargar()
  }

  async function eliminar(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('categorias').delete().eq('id', id)
    if (error) {
      setMsg('❌ No se puede eliminar — puede tener materiales asociados')
    } else {
      setMsg('✅ Categoría eliminada')
    }
    setDeleteConfirm(null)
    cargar()
  }

  function abrirNuevo() {
    setEditing(null)
    setForm({ ...EMPTY, division_id: divisiones[0]?.id || '' })
    setModal(true)
  }

  function abrirEditar(item: Categoria) {
    setEditing(item)
    setForm({
      nombre:      item.nombre,
      descripcion: item.descripcion || '',
      activo:      item.activo,
      division_id: item.division_id || '',
    })
    setModal(true)
  }

  function cerrarModal() { setModal(false); setEditing(null) }

  // División seleccionada en el form (para preview)
  const divSeleccionada = divisiones.find(d => d.id === form.division_id)

  // Filtro
  const divsFiltro = ['TODAS', ...divisiones.map(d => d.codigo)]
  const filtered = filterDiv === 'TODAS'
    ? items
    : items.filter(i => i.division_codigo === filterDiv)

  return (
    <div className="min-h-screen bg-[#141414]">

      {/* Navbar */}
      <nav className="bg-[#1C1C1C] border-b border-[#333] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#C9A84C] text-xl">⬡</span>
          <span className="text-white font-bold text-sm">ATLANTIC SERVICES — Categorías</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/catalogo/divisiones')}
            className="text-gray-400 hover:text-[#C9A84C] text-xs transition-colors">
            🏗 Divisiones
          </button>
          <button onClick={() => router.push('/admin/catalogo')}
            className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Catálogo
          </button>
        </div>
      </nav>

      <div className="p-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total categorías', value: items.length,                        color: 'text-white' },
            { label: 'Activas',          value: items.filter(i => i.activo).length,  color: 'text-green-400' },
            { label: 'Sin división',     value: items.filter(i => !i.division_id).length, color: items.filter(i => !i.division_id).length > 0 ? 'text-yellow-400' : 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
              <p className="text-gray-400 text-sm">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {items.filter(i => !i.division_id).length > 0 && (
          <div className="mb-4 px-4 py-2 rounded-lg text-sm bg-yellow-900/30 text-yellow-400 border border-yellow-700">
            ⚠️ <strong>{items.filter(i => !i.division_id).length} categoría(s)</strong> sin división CSI asignada — el RPA usará DIV. 00 por defecto.
          </div>
        )}

        <div className="flex items-center gap-3 mb-4">
          <button onClick={abrirNuevo}
            className="bg-[#C9A84C] hover:bg-[#C97B10] text-black font-bold px-5 py-2 rounded-lg transition-colors">
            + Nueva Categoría
          </button>
          <button onClick={cargar}
            className="bg-[#333] hover:bg-[#444] text-white font-bold px-4 py-2 rounded-lg transition-colors">
            ↻ Actualizar
          </button>
          {/* Filtro por división */}
          <select value={filterDiv} onChange={e => setFilterDiv(e.target.value)}
            className="bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm">
            {divsFiltro.map(d => <option key={d}>{d}</option>)}
          </select>
          <span className="text-gray-500 text-sm ml-auto">{filtered.length} categorías</span>
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
            msg.startsWith('✅')
              ? 'bg-green-900/30 text-green-400 border border-green-700'
              : 'bg-red-900/30 text-red-400 border border-red-700'
          }`}>{msg}</div>
        )}

        <div className="bg-[#1C1C1C] rounded-xl border border-[#333] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#C9A84C]">
                {['Nombre', 'División CSI', 'Descripción', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-black font-bold text-xs px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-12">Cargando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-12">No hay categorías</td></tr>
              ) : filtered.map((item, i) => (
                <tr key={item.id}
                  className={`border-t border-[#333] hover:bg-[#252525] transition-colors ${i%2===0?'':'bg-[#1A1A1A]'}`}>
                  <td className="px-4 py-3 text-[#C9A84C] font-semibold text-sm">{item.nombre}</td>
                  <td className="px-4 py-3">
                    {item.division_codigo !== '—' ? (
                      <div>
                        <span className="text-xs font-bold font-mono text-white bg-[#333] px-2 py-0.5 rounded">
                          {item.division_codigo}
                        </span>
                        <span className="text-gray-400 text-xs ml-2">{item.division_nombre}</span>
                      </div>
                    ) : (
                      <span className="text-yellow-500 text-xs">⚠️ Sin división</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{item.descripcion || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActivo(item)}
                      className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${
                        item.activo
                          ? 'bg-green-900/40 text-green-400 hover:bg-red-900/40 hover:text-red-400'
                          : 'bg-red-900/40 text-red-400 hover:bg-green-900/40 hover:text-green-400'
                      }`}>
                      {item.activo ? 'Activa' : 'Inactiva'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => abrirEditar(item)}
                        className="bg-[#333] hover:bg-[#C9A84C] hover:text-black text-white text-xs px-3 py-1 rounded transition-colors">
                        ✏️ Editar
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

      {/* ── Modal Nuevo / Editar ─────────────────────────────────────────────── */}
      {modal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={cerrarModal}>
          <div className="bg-[#1C1C1C] border border-[#333] rounded-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}>

            <h2 className="text-white font-bold text-lg mb-5">
              {editing ? '✏️ Editar Categoría' : '+ Nueva Categoría'}
            </h2>

            <div className="flex flex-col gap-4">

              {/* Nombre */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Nombre *</label>
                <input value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: Flooring, Painting..."
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* División CSI */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">
                  División CSI *
                  <span className="text-gray-600 ml-2 font-normal">
                    define el orden en PDF y Excel
                  </span>
                </label>
                <select value={form.division_id}
                  onChange={e => setForm({ ...form, division_id: e.target.value })}
                  className={`w-full bg-[#252525] text-white border rounded-lg px-3 py-2 text-sm ${
                    !form.division_id ? 'border-yellow-600' : 'border-[#333]'
                  }`}>
                  <option value="">Seleccionar división...</option>
                  {divisiones.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.codigo} — {d.nombre}
                    </option>
                  ))}
                </select>
                {/* Preview división seleccionada */}
                {divSeleccionada && (
                  <div className="mt-2 flex items-center gap-2 bg-[#252525] px-3 py-2 rounded-lg">
                    <span className="text-xs font-bold font-mono text-[#C9A84C]">
                      {divSeleccionada.codigo}
                    </span>
                    <span className="text-gray-300 text-xs">{divSeleccionada.nombre}</span>
                  </div>
                )}
                {!form.division_id && (
                  <p className="text-yellow-500 text-[11px] mt-1">
                    ⚠️ Sin división el RPA usará DIV. 00 — UNCLASSIFIED
                  </p>
                )}
              </div>

              {/* Descripción */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Descripción</label>
                <input value={form.descripcion}
                  onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Descripción opcional"
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>

              {/* Toggle Activo */}
              <div className="flex items-center gap-3">
                <label className="text-gray-400 text-xs">Activa</label>
                <button onClick={() => setForm({ ...form, activo: !form.activo })}
                  className={`w-12 h-6 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${form.activo ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={guardar}
                disabled={saving || !form.nombre.trim() || !form.division_id}
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

      {/* ── Confirmación eliminar ──────────────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] border border-red-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold text-lg mb-2">¿Eliminar categoría?</h2>
            <p className="text-gray-400 text-sm mb-1">Esta acción no se puede deshacer.</p>
            <p className="text-yellow-400 text-xs mb-5">
              ⚠️ Fallará si hay materiales del catálogo usando esta categoría.
            </p>
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
