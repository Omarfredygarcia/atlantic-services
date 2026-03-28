import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const RPA_URL = process.env.RPA_SERVICE_URL ||
    'https://atlantic-rpa-service-production.up.railway.app'

  try {
    const res = await fetch(`${RPA_URL}/enviar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proyecto_id: body.proyecto_id }),
      signal: AbortSignal.timeout(60000),
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}