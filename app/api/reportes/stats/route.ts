import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY! // ← service key, no anon
  )
  const [{ data: mats }, { data: logs }, { data: projs }] = await Promise.all([
    supabase.from('materiales').select('proyecto_id, categoria, costo_material, costo_mano_obra'),
    supabase.from('log_precios').select('tienda, es_precio_elegido'),
    supabase.from('proyectos').select('id, estado'),
  ])
  // calcular stats y retornar
  return NextResponse.json({ mats, logs, projs })
}