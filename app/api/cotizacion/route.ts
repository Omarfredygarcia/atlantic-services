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

  // Llamar al servicio RPA en Render
  const RPA_URL = process.env.RPA_SERVICE_URL || 'http://localhost:8000'

  try {
    const res = await fetch(`${RPA_URL}/procesar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyectos_ids: proyectos.map((p: { id: string }) => p.id) }),
      signal: AbortSignal.timeout(150000), // 2.5 minutos
    })

    if (!res.ok) throw new Error(`RPA service error: ${res.status}`)
    const result = await res.json()

    return NextResponse.json({
      ok: true,
      mensaje: `${result.completados || 0} proyectos procesados`,
      detalle: result
    })
  } catch (e: any) {
    // Si el servicio RPA no está disponible, retornar instrucción manual
    return NextResponse.json({
      ok: false,
      error: 'Servicio RPA no disponible. Ejecuta python main.py en el PC de oficina.',
      detalle: e.message
    }, { status: 503 })
  }
}
