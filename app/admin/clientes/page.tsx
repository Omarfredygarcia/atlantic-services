'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-client'

interface Cliente {
  id: string
  nombre: string
  email: string | null
  telefono: string | null
  empresa: string | null
  direccion: string | null
  identificacion: string | null
  notas: string | null
  created_at?: string
}

const EMPTY = { nombre: '', email: '', telefono: '', empresa: '', direccion: '', identificacion: '', notas: '' }

export default function ClientesPage() {
  const router = useRouter()
  const [items, setItems]     = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
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
    const { data, error } = await supabase.from('clientes').select('*').order('nombre')
    if (!error && data) setItems(data)
    setLoading(false)
  }

  async function guardar() {
    setSaving(true)
    setMsg('')
    const supabase = createClient()
    const payload = {
      nombre: form.nombre,
      email: form.email || null,
      telefono: form.telefono || null,
      empresa: form.empresa || null,
      direccion: form.direccion || null,
      identificacion: form.identificacion || null,
      notas: form.notas || null,
    }
    if (editing) {
      const { error } = await supabase.from('clientes').update(payload).eq('id', editing.id)
      setMsg(error ? `❌ ${error.message}` : '✅ Cliente actualizado')
    } else {
      const { error } = await supabase.from('clientes').insert([payload])
      setMsg(error ? `❌ ${error.message}` : '✅ Cliente agregado')
    }
    setSaving(false)
    cerrarModal()
    cargar()
  }

  async function eliminar(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('clientes').delete().eq('id', id)
    setDeleteConfirm(null)
    setMsg(error ? `❌ ${error.message}` : '✅ Cliente eliminado')
    cargar()
  }

  function abrirNuevo() { setEditing(null); setForm({ ...EMPTY }); setModal(true) }
  function abrirEditar(item: Cliente) {
    setEditing(item)
    setForm({
      nombre: item.nombre,
      email: item.email || '',
      telefono: item.telefono || '',
      empresa: item.empresa || '',
      direccion: item.direccion || '',
      identificacion: item.identificacion || '',
      notas: item.notas || '',
    })
    setModal(true)
  }
  function cerrarModal() { setModal(false); setEditing(null) }

  const filtrados = items.filter(c => {
    const q = busqueda.toLowerCase()
    if (!q) return true
    return c.nombre.toLowerCase().includes(q)
      || (c.email || '').toLowerCase().includes(q)
      || (c.empresa || '').toLowerCase().includes(q)
  })

  return (
    <div className="min-h-screen bg-[#141414]">
      <nav className="bg-[#1C1C1C] border-b border-[#333] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#C9A84C] text-xl">⬡</span>
          <span className="text-white font-bold text-sm">ATLANTIC SERVICES — Clientes</span>
        </div>
        <button onClick={() => router.push('/admin/dashboard')}
          className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Dashboard
        </button>
      </nav>

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button onClick={abrirNuevo}
            className="bg-[#C9A84C] hover:bg-[#C97B10] text-black font-bold px-5 py-2 rounded-lg transition-colors">
            + Nuevo Cliente
          </button>
          <button onClick={cargar}
            className="bg-[#333] hover:bg-[#444] text-white font-bold px-4 py-2 rounded-lg transition-colors">
            ↻ Actualizar
          </button>
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, email o empresa..."
            className="bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm w-72"
          />
          <span className="text-gray-500 text-sm ml-auto">{filtrados.length} cliente(s)</span>
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
                {['Nombre', 'Email', 'Teléfono', 'Empresa', 'ID (EIN/SSN)', 'Dirección', 'Acciones'].map(h => (
                  <th key={h} className="text-black font-bold text-xs px-4 py-3 text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center text-gray-400 py-12">Cargando...</td></tr>
              ) : filtrados.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-500 py-12">Sin clientes todavía</td></tr>
              ) : filtrados.map((item, i) => (
                <tr key={item.id} className={`border-t border-[#333] hover:bg-[#252525] ${i%2===0?'':'bg-[#1A1A1A]'}`}>
                  <td className="px-4 py-3 text-white font-semibold text-sm">{item.nombre}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{item.email || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs font-mono">{item.telefono || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{item.empresa || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs font-mono">{item.identificacion || <span className="text-gray-600">—</span>}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{item.direccion || <span className="text-gray-600">—</span>}</td>
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
            <h2 className="text-white font-bold text-lg mb-5">{editing ? '✏️ Editar Cliente' : '+ Nuevo Cliente'}</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej: John Smith"
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Email</label>
                <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="cliente@email.com"
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Teléfono</label>
                <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                  placeholder="(317) 000-0000"
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Empresa</label>
                <input value={form.empresa} onChange={e => setForm({ ...form, empresa: e.target.value })}
                  placeholder="Opcional"
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Dirección</label>
                <input value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })}
                  placeholder="Opcional"
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">
                  Identificación
                  <span className="text-gray-600 ml-2 font-normal">(EIN si es negocio, SSN si es individuo)</span>
                </label>
                <input value={form.identificacion} onChange={e => setForm({ ...form, identificacion: e.target.value })}
                  placeholder="Ej: 12-3456789"
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm font-mono" />
              </div>
              <div>
                <label className="text-gray-400 text-xs mb-1 block">Notas</label>
                <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
                  placeholder="Opcional"
                  rows={3}
                  className="w-full bg-[#252525] text-white border border-[#333] rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={guardar} disabled={saving || !form.nombre}
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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1C1C1C] border border-red-700 rounded-xl p-6 w-full max-w-sm">
            <h2 className="text-white font-bold text-lg mb-2">¿Eliminar cliente?</h2>
            <p className="text-gray-400 text-sm mb-5">
              Esta acción no se puede deshacer. Si este cliente ya está vinculado a algún proyecto (<code>cliente_id</code>), la base de datos rechazará el borrado por la restricción de llave foránea.
            </p>
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
