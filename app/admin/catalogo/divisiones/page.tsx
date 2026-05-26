'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

interface Division {
  id: string
  codigo: string
  nombre: string
  activo: boolean
}

const EMPTY = { codigo: '', nombre: '', activo: true }

export default function DivisionesPage() {
  const router = useRouter()
  const [items, setItems]           = useState<Division[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [msg, setMsg]               = useState('')
  const [modal, setModal]           = useState(false)
  const [editing, setEditing]       = useState<Division | null>(null)
  const [form, setForm]             = useState({ ...EMPTY })
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
    const { data, error } = await supabase
      .from('divisiones')
      .select('*')
      .order('codigo')
    if (!error && data) setItems(data)
    setLoading(false)
  }

  async function guardar() {
    if (!form.codigo.trim() || !form.nombre.trim()) {
      setMsg('❌ Código y nombre son obligatorios')
      return
    }
    setSaving(true)
    setMsg('')
    const supabase = createClient()

    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim().toUpperCase(),
      activo: form.activo,
    }

    if (editing) {
      const { error } = await supabase.from('divisiones').update(payload).eq('id', editing.id)
      setMsg(error ? `❌ ${error.message}` : '✅ División actualizada')
    } else {
      const { error } = await supabase.from('divisiones').insert([payload])
      setMsg(error ? `❌ ${error.message}` : '✅ División agregada')
    }

    setSaving(false)
    cerrarModal()
    cargar()
  }

  async function toggleActivo(item: Division) {
    const supabase = createClient()
    await supabase.from('divisiones').update({ activo: !item.activo }).eq('id', item.id)
    cargar()
  }

  async function eliminar(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('divisiones').delete().eq('id', id)
    if (error) {
      setMsg(`❌ No se puede eliminar — puede tener categorías asociadas`)
    } else {
      setMsg('✅ División eliminada')
    }
    setDeleteConfirm(null)
    cargar()
  }

  function abrirNuevo() {
    setEditing(null)
    setForm({ ...EMPTY })
    setModal(true)
  }

  function abrirEditar(item: Division) {
    setEditing(item)
    setForm({ codigo: item.codigo, nombre: item.nombre, activo: item.activo })
    setModal(true)
  }

  function cerrarModal() { setModal(false); setEditing(null) }

  // Badge visual por número de división
  function DivBadge({ codigo }: { codigo: string }) {
    const num = parseInt(codigo.replace('DIV.', '').trim())
    const colors: Record<number, string> = {
      0:  'bg-gray-800 text-gray-400 border-gray-600',
      1:  'bg-blue-900/50 text-blue-300 border-blue-700',
      2:  'bg-orange-900/50 text-orange-300 border-orange-700',
      3:  'bg-stone-900/50 text-stone-300 border-stone-700',
      5:  'bg-slate-900/50 text-slate-300 border-slate-700',
      6:  'bg-amber-900/50 text-amber-300 border-amber-700',
      7:  'bg-cyan-900/50 text-cyan-300 border-cyan-700',
      8:  'bg-indigo-900/50 text-indigo-300 border-indigo-700',
      9:  'bg-pink-900/50 text-pink-300 border-pink-700',
      12: 'bg-purple-900/50 text-purple-300 border-purple-700',
      22: 'bg-teal-900/50 text-teal-300 border-teal-700',
      23: 'bg-red-900/50 text-red-300 border-red-700',
      26: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
    }
    const cls = colors[num] || 'bg-gray-800 text-gray-400 border-gray-600'
    return (
      <span className={`text-xs font-bold px-2 py-0.5 rounded-full border font-mono ${cls}`}>
        {codigo}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-[#141414]">

      {/* Navbar */}
      <nav className="bg-[#1C1C1C] border-b border-[#333] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#C9A84C] text-xl">⬡</span>
          <span className="text-white font-bold text-sm">ATLANTIC SERVICES — Divisiones CSI</span>
        </div>
        <button onClick={() => router.push('/admin/catalogo')}
          className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Catálogo
        </button>
      </nav>

      <div className="p-6">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total divisiones', value: items.length,                          color: 'text-white' },
            { label: 'Activas',          value: items.filter(i => i.activo).length,    color: 'text-green-400' },
            { label: 'Inactivas',        value: items.filter(i => !i.activo).length,   color: 'text-red-400' },
          ].map(s => (
            <div key={s.label} className="bg-[#1C1C1C] rounded-xl p-4 border border-[#333]">
              <p className="text-gray-400 text-sm">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-4">
          <button onClick={abrirNuevo}
            className="bg-[#C9A84C] hover:bg-[#C97B10] text-black font-bold px-5 py-2 rounded-lg transition-colors">
            + Nueva División
          </button>
          <button onClick={cargar}
            className="bg-[#333] hover:bg-[#444] text-white font-bold px-4 py-2 rounded-lg transition-colors">
            ↻ Actualizar
          </button>
          <div className="ml-auto text-gray-600 text-xs">
            Las divisiones se asignan a las categorías y el RPA las usa para ordenar el bid por CSI
          </div>
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
                {['División', 'Código', 'Nombre', 'Estado', 'Acciones'].map(h => (
                  <th key={h} className="text-black font-bold text-xs px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-12">Cargando...</td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={5} className="text-center text-gray-400 py-12">No hay divisiones</td></tr>
              ) : items.map((item, i) => (
                <tr key={item.id}
                  className={`border-t border-[#333] hover:bg-[#252525] transition-colors ${i%2===0?'':'bg-[#1A1A1A]'}`}>
                  <td className="px-4 py-3">
                    <DivBadge codigo={item.codigo} />
                  </td>
                  <td className="px-4 py-3 text-[#C9A84C] font-mono font-bold text-sm">
                    {item.codigo}
                  </td>
                  <td className="px-4 py-3 text-white text-sm">{item.nombre}</td>
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
              {editing ? '✏️ Editar División' : '+ Nueva División CSI'}
            </h2>

            <div className="flex flex-col gap-4">

              {/* Código */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">
                  Código *
                  <span className="text-gray-600 ml-2 font-normal">Ej: DIV. 09, DIV. 15</span>
                </label>
                <input
                  value={form.codigo}
                  onChange={e => setForm({ ...form, codigo: e.target.value })}
                  placeholder="DIV. 00"
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm font-mono"
                />
                {form.codigo && (
                  <div className="mt-2">
                    <DivBadge codigo={form.codigo.toUpperCase()} />
                  </div>
                )}
              </div>

              {/* Nombre */}
              <div>
                <label className="text-gray-400 text-xs mb-1 block">
                  Nombre *
                  <span className="text-gray-600 ml-2 font-normal">Ej: FINISHES, PLUMBING</span>
                </label>
                <input
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="GENERAL CONDITIONS"
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm"
                />
              </div>

              {/* Toggle Activo */}
              <div className="flex items-center gap-3">
                <label className="text-gray-400 text-xs">Activa</label>
                <button
                  onClick={() => setForm({ ...form, activo: !form.activo })}
                  className={`w-12 h-6 rounded-full transition-colors ${form.activo ? 'bg-green-500' : 'bg-gray-600'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full mx-0.5 transition-transform ${form.activo ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* Preview */}
              {form.codigo && form.nombre && (
                <div className="bg-[#252525] border border-[#333] rounded-lg px-4 py-3">
                  <p className="text-gray-500 text-xs mb-2">Vista previa en bid:</p>
                  <div className="flex items-center gap-3">
                    <DivBadge codigo={form.codigo.toUpperCase()} />
                    <span className="text-white text-sm font-bold">{form.nombre.toUpperCase()}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={guardar}
                disabled={saving || !form.codigo.trim() || !form.nombre.trim()}
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
            <h2 className="text-white font-bold text-lg mb-2">¿Eliminar división?</h2>
            <p className="text-gray-400 text-sm mb-1">Esta acción no se puede deshacer.</p>
            <p className="text-yellow-400 text-xs mb-5">
              ⚠️ Fallará si hay categorías usando esta división.
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
