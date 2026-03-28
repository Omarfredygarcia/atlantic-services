import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServiceClient()

  const { data: proyecto, error } = await supabase
    .from('proyectos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !proyecto) {
    return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })
  }

  if (!proyecto.excel_path) {
    return NextResponse.json({ error: 'Este proyecto no tiene Excel generado' }, { status: 404 })
  }

  const RPA_URL = process.env.RPA_SERVICE_URL ||
    'https://atlantic-rpa-service-production.up.railway.app'

  try {
    const res = await fetch(`${RPA_URL}/excel/${id}`)

    if (!res.ok) {
      return NextResponse.json(
        { error: 'No se pudo obtener el Excel del servidor RPA' },
        { status: 502 }
      )
    }

    const buffer = await res.arrayBuffer()
    const filename = `${proyecto.project_code}_comparativo.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}