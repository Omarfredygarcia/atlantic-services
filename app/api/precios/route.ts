import { NextRequest, NextResponse } from 'next/server'

const SERP_API_KEY = process.env.SERP_API_KEY || ''
const SERP_URL = 'https://serpapi.com/search'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const material = searchParams.get('material')
  const tienda   = searchParams.get('tienda') || 'Home Depot'

  if (!material) {
    return NextResponse.json({ error: 'material requerido' }, { status: 400 })
  }

  try {
    let precio: number | null = null
    let descripcion = ''

    if (tienda.toLowerCase().includes('home depot')) {
      const params = new URLSearchParams({
        engine: 'home_depot',
        q: material,
        api_key: SERP_API_KEY,
        ps: '5',
      })
      const res = await fetch(`${SERP_URL}?${params}`)
      const data = await res.json()

      for (const p of data.products || []) {
        const pr = parseFloat(String(p.price).replace(/[^\d.]/g, ''))
        if (pr > 0) {
          precio = pr
          descripcion = p.title?.substring(0, 80) || ''
          break
        }
      }
    } else {
      const params = new URLSearchParams({
        engine: 'google_shopping',
        q: `${material} ${tienda}`,
        api_key: SERP_API_KEY,
        num: '10',
        gl: 'us',
        hl: 'en',
      })
      const res = await fetch(`${SERP_URL}?${params}`)
      const data = await res.json()

      const tiendaKey = tienda.toLowerCase().replace(/['\s]/g, '')
      for (const item of data.shopping_results || []) {
        const source = (item.source || '').toLowerCase().replace(/['\s]/g, '')
        const pr = parseFloat(String(item.price || '').replace(/[^\d.]/g, ''))
        if (source.includes(tiendaKey) && pr > 0) {
          precio = pr
          descripcion = item.title?.substring(0, 80) || ''
          break
        }
      }
    }

    return NextResponse.json({
      ok: true,
      material,
      tienda,
      precio,
      descripcion,
      fuente: precio ? `SerpApi — ${tienda}` : 'Sin precio disponible'
    })

  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
