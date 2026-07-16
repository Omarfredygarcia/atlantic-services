import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authClient = await createServerSupabaseClient()
  const { data: { user } } = await authClient.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

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

  if (!proyecto.pdf_path) {
    return NextResponse.json({ error: 'Este proyecto no tiene PDF generado' }, { status: 404 })
  }

  const RPA_URL = process.env.RPA_SERVICE_URL ||
    'https://atlantic-rpa-service-production.up.railway.app'

  try {
    const res = await fetch(`${RPA_URL}/pdf/${id}`)

    if (!res.ok) {
      return NextResponse.json(
        { error: 'No se pudo obtener el PDF del servidor RPA' },
        { status: 502 }
      )
    }

    const buffer = await res.arrayBuffer()
    const filename = `${proyecto.project_code}_estimate.pdf`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}