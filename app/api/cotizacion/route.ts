import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createServiceClient()

  // Obtener proyectos pendientes
  const { data: proyectos, error } = await supabase
    .from('proyectos')
    .select('*, materiales(*)')
    .in('estado', ['PENDIENTE', 'ERROR', 'EN_PROCESO'])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (!proyectos || proyectos.length === 0) {
    return NextResponse.json({
      ok: true,
      mensaje: 'No hay proyectos pendientes para procesar'
    })
  }

  // Llamar al servicio RPA en Render
  const RPA_URL = process.env.RPA_SERVICE_URL || 'http://localhost:8000'

  try {
    const res = await fetch(`${RPA_URL}/procesar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyectos_ids: proyectos.map((p: { id: string }) => p.id) }),
      signal: AbortSignal.timeout(30000),
    })

    if (!res.ok) throw new Error(`RPA service error: ${res.status}`)
    const result = await res.json()

    return NextResponse.json({
      ok: true,
      mensaje: `Procesando ${proyectos.length} proyecto(s) en background`,
      procesando: proyectos.length,
      detalle: result
    })
  } catch (e: any) {
    return NextResponse.json({
      ok: false,
      error: `Servicio RPA no disponible. URL: ${RPA_URL} — ${e.message}`,
      detalle: e.message
    }, { status: 503 })
  }
}