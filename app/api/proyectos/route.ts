import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)
  const estado = searchParams.get('estado')

  let query = supabase
    .from('proyectos')
    .select('*, materiales(*)')
    .order('created_at', { ascending: false })

  if (estado && estado !== 'TODOS') {
    query = query.eq('estado', estado)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const body = await req.json()

  const { data, error } = await supabase
    .from('proyectos')
    .insert({
      project_code: '',
      cliente_nombre: body.cliente_nombre,
      cliente_email: body.cliente_email,
      cliente_telefono: body.cliente_telefono,
      direccion: body.direccion,
      tipo_proyecto: body.tipo_proyecto,
      descripcion: body.descripcion,
      area_total_ft2: body.area_total_ft2,
      estado: 'PENDIENTE',
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insertar materiales si vienen
  if (body.materiales && body.materiales.length > 0) {
    const matsValidos = body.materiales.filter((m: any) => m.categoria && m.material)
    if (matsValidos.length > 0) {
      await supabase.from('materiales').insert(
        matsValidos.map((m: any, i: number) => ({
          proyecto_id: data.id,
          linea: i + 1,
          categoria: m.categoria,
          material: m.material,
          area_ft2: m.area_ft2 || 0,
          unidad: 'ft2',
          tienda_preferida: m.tienda_preferida,
        }))
      )
    }
  }

  return NextResponse.json({ data, ok: true })
}
