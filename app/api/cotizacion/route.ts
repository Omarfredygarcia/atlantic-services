import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
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

  // Llamar al servicio RPA en Render — fire and forget
  const RPA_URL = process.env.RPA_SERVICE_URL || 'http://localhost:8000'

  try {
    // No await — lanzar sin esperar respuesta
    fetch(`${RPA_URL}/procesar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyectos_ids: proyectos.map((p: { id: string }) => p.id) }),
    }).catch(() => {}) // ignorar errores de conexión

    return NextResponse.json({
      ok: true,
      mensaje: `${proyectos.length} proyecto(s) enviados a procesar. Actualiza en 1-2 minutos.`,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}