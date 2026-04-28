'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

interface Unidad {
  id: string
  codigo: string
  descripcion: string
  activo: boolean
}

const EMPTY = { codigo: '', descripcion: '', activo: true }

export default function UnidadesPage() {
  const router = useRouter()
  const [items, setItems]     = useState<Unidad[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState<Unidad | null>(null)
  const [form, setForm]       = useState({ ...EMPTY })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  useEffect(() => { checkAuth(); cargar() }, [])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) router.push('/admin/login')
  }

  async function cargar() {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('unidades').select('*').order('codigo')
    if (!error && data) setItems(data)
    setLoading(false)
  }

  async function guardar() {
    setSaving(true)
    setMsg('')
    const supabase = createClient()
    if (editing) {
      const { error } = await supabase.from('unidades').update(form).eq('id', editing.id)
      setMsg(error ? `❌ ${error.message}` : '✅ Unidad actualizada')
    } else {
      const { error } = await supabase.from('unidades').insert([form])
      setMsg(error ? `❌ ${error.message}` : '✅ Unidad agregada')
    }
    setSaving(false)
    cerrarModal()
    cargar()
  }

  async function toggleActivo(item: Unidad) {
    const supabase = createClient()
    await supabase.from('unidades').update({ activo: !item.activo }).eq('id', item.id)
    cargar()
  }

  async function eliminar(id: string) {
    const supabase = createClient()
    await supabase.from('unidades').delete().eq('id', id)
    setDeleteConfirm(null)
    setMsg('✅ Unidad eliminada')
    cargar()
  }

  function abrirNuevo() { setEditing(null); setForm({ ...EMPTY }); setModal(true) }
  function abrirEditar(item: Unidad) {
    setEditing(item)
    setForm({ codigo: item.codigo, descripcion: item.descripcion || '', activo: item.activo })
    setModal(true)
  }
  function cerrarModal() { setModal(false); setEditing(null) }

  return (
    <div className="min-h-screen bg-[#141414]">
      <nav className="bg-[#1C1C1C] border-b border-[#333] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#C9A84C] text-xl">⬡</span>
          <span className="text-white font-bold text-sm">ATLANTIC SERVICES — Unidades</span>
        </div>
        <button onClick={() => router.push('/admin/catalogo')}
          className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Catálogo
        </button>
      </nav>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={abrirNuevo}
            className="bg-[#C9A84C] hover:bg-[#C97B10] text-black font-bold px-5 py-2 rounded-lg transition-colors">
            + Nueva Unidad
          </button>
          <button onClick={cargar}
            className="bg-[#333] hover:bg-[#444] text-white font-bold px-4 py-2 rounded-lg transition-colors">
            ↻ Actualizar
          </button>
          <span className="text-gray-500 text-sm ml-auto">{items.length} unidades</span>
        </div>

        {msg && (
          <div className={`mb-4 px-4 py-2 rounded-lg text-sm font-medium ${
            msg.startsWith('✅') ? 'bg-green-900/30 text-green-400 border border-green-700'
                                 : 'bg-red-900/30 text-red-400 border border-red-700'
          }`}>{msg}</div>
        )}

        <div className="bg-[#1C1C1C] rounded-xl border border-[#333] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#C9A84C]">
                {['Código', 'Descripción', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-black font-bold text-xs px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="text-center text-gray-400 py-12">Cargando...</td></tr>
              ) : items.map((item, i) => (
                <tr key={item.id} className={`border-t border-[#333] hover:bg-[#252525] ${i%2===0?'':'bg-[#1A1A1A]'}`}>
                  <td className="px-4 py-3 text-[#C9A84C] font-mono font-bold text-sm">{item.codigo}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{item.descripcion || '—'}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActivo(item)}
                      className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${
                        item.activo ? 'bg-green-900/40 text-green-400 hover:bg-red-900/40 hover:text-red-400'
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

      {modal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={cerrarModal}>
          <div className="bg-[#1C1C1C] border border-[#333] rounded-xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg mb-5">{editing ? '✏️ Editar Unidad' : '+ Nueva Unidad'}</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Código *</label>
                <input value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })}
                  placeholder="Ej: ft2, gallon, sheet..."
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Descripción</label>
                <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
                  placeholder="Ej: Square feet, Gallon (~350 sqft)..."
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-gray-400 text-xs">Activa</label>
                <button onClick={() => setForm({ ...form, activo: !form.activo })}
                  className={`w-12 h-6 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${form.activo ? 'translate-x-6' : ''}`} />
                </button>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardar} disabled={saving || !form.codigo}
                className="flex-1 bg-[#C9A84C] hover:bg-[#C97B10] disabled:bg-gray-600 text-black font-bold py-2 rounded-lg">
                {saving ? 'Guardando...' : editing ? 'Actualizar' : 'Agregar'}
              </button>
              <button onClick={cerrarModal}
                className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] border border-red-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold text-lg mb-2">¿Eliminar unidad?</h2>
            <p className="text-gray-400 text-sm mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => eliminar(deleteConfirm)}
                className="flex-1 bg-red-700 hover:bg-red-600 text-white font-bold py-2 rounded-lg">Eliminar</button>
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-[#333] hover:bg-[#444] text-white py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
