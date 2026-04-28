/**
 * POST /api/reportes/rentabilidad
 *   Recibe stats + proyectos desde el front, genera HTML del reporte y envía por Resend.
 *
 * GET /api/reportes/rentabilidad/cron
 *   Endpoint para cron-job.org — calcula stats fresco desde Supabase y envía.
 *   Configura en cron-job.org: GET cada lunes 07:00 AM ET.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const RESEND_API_KEY = process.env.RESEND_API_KEY!
const FROM_EMAIL     = process.env.EMAIL_FROM || 'info@atlanticser.com'
const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!

function fmtUSD(n: number) {
  return '$' + Math.round(n).toLocaleString('en-US')
}

function fmtK(n: number) {
  return n >= 1000 ? '$' + (n / 1000).toFixed(1) + 'k' : fmtUSD(n)
}

// ── Genera HTML del reporte ───────────────────────────────────────────────────
function generarHTMLReporte(stats: Record<string, unknown>, proyectos: unknown[], fechaCorte: string): string {
  const s = stats as {
    totalProyectos: number
    cotizados: number
    enviados: number
    totalMateriales: number
    totalManoObra: number
    totalValor: number
    avgPorProyecto: number
    busquedasSerpApi: number
    porCategoria: Record<string, number>
    porTienda: Record<string, number>
  }

  const topCats = Object.entries(s.porCategoria || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  const topTiendas = Object.entries(s.porTienda || {})
    .sort((a, b) => b[1] - a[1])

  const totalTiendas = topTiendas.reduce((acc, [, v]) => acc + v, 0) || 1

  const catsRows = topCats.map(([cat, val]) =>
    `<tr><td style="padding:6px 12px;color:#ccc;">${cat}</td><td style="padding:6px 12px;color:#C9A84C;font-family:monospace;">${fmtK(val)}</td></tr>`
  ).join('')

  const tiendasRows = topTiendas.map(([t, count]) =>
    `<tr><td style="padding:6px 12px;color:#ccc;">${t}</td><td style="padding:6px 12px;color:#5BB8D4;font-family:monospace;">${Math.round((count / totalTiendas) * 100)}% (${count})</td></tr>`
  ).join('')

  const tiempoAhorrado = (s.totalProyectos * 4.5).toFixed(0)
  const valorTiempo    = fmtUSD(s.totalProyectos * 4.5 * 45)

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Reporte de Rentabilidad — Atlantic Services</title></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
<tr><td align="center">
<table width="620" cellpadding="0" cellspacing="0" style="background:#141414;border-radius:16px;overflow:hidden;border:1px solid #2a2a2a;">

  <!-- Header -->
  <tr><td style="background:#1C1C1C;padding:28px 32px;border-bottom:1px solid #2a2a2a;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><span style="color:#C9A84C;font-size:20px;">⬡</span>
        <span style="color:#fff;font-weight:700;font-size:15px;margin-left:10px;vertical-align:middle;">
          ATLANTIC SERVICES — RPA
        </span>
      </td>
      <td align="right"><span style="background:#C9A84C20;color:#C9A84C;font-size:11px;padding:4px 10px;border-radius:20px;border:1px solid #C9A84C44;">
        📊 REPORTE DE RENTABILIDAD
      </span></td>
    </tr></table>
    <p style="color:#666;font-size:12px;margin:8px 0 0;">Corte al ${fechaCorte} · Motor RPA v2.1</p>
  </td></tr>

  <!-- KPIs -->
  <tr><td style="padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="25%" style="padding:0 6px 0 0;">
          <div style="background:#1C1C1C;border:1px solid #2a2a2a;border-radius:10px;padding:14px;">
            <p style="margin:0 0 4px;color:#666;font-size:11px;">Proyectos</p>
            <p style="margin:0;color:#fff;font-size:22px;font-weight:700;">${s.totalProyectos}</p>
            <p style="margin:4px 0 0;color:#555;font-size:10px;">${s.cotizados} cotizados · ${s.enviados} enviados</p>
          </div>
        </td>
        <td width="25%" style="padding:0 6px;">
          <div style="background:#1C1C1C;border:1px solid #2a2a2a;border-radius:10px;padding:14px;">
            <p style="margin:0 0 4px;color:#666;font-size:11px;">Materiales</p>
            <p style="margin:0;color:#C9A84C;font-size:22px;font-weight:700;">${fmtK(s.totalMateriales)}</p>
            <p style="margin:4px 0 0;color:#555;font-size:10px;">${s.busquedasSerpApi} consultas SerpApi</p>
          </div>
        </td>
        <td width="25%" style="padding:0 6px;">
          <div style="background:#1C1C1C;border:1px solid #2a2a2a;border-radius:10px;padding:14px;">
            <p style="margin:0 0 4px;color:#666;font-size:11px;">Mano de obra</p>
            <p style="margin:0;color:#5BB8D4;font-size:22px;font-weight:700;">${fmtK(s.totalManoObra)}</p>
            <p style="margin:4px 0 0;color:#555;font-size:10px;">prom. 35% materiales</p>
          </div>
        </td>
        <td width="25%" style="padding:0 0 0 6px;">
          <div style="background:#1C1C1C;border:1px solid #2a2a2a;border-radius:10px;padding:14px;">
            <p style="margin:0 0 4px;color:#666;font-size:11px;">Total cotizado</p>
            <p style="margin:0;color:#4ade80;font-size:22px;font-weight:700;">${fmtK(s.totalValor)}</p>
            <p style="margin:4px 0 0;color:#555;font-size:10px;">prom. ${fmtK(s.avgPorProyecto)}/proyecto</p>
          </div>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- Valor automatización -->
  <tr><td style="padding:0 32px 24px;">
    <div style="background:#0d2e1a;border:1px solid #166534;border-radius:10px;padding:16px 20px;">
      <p style="margin:0 0 10px;color:#4ade80;font-size:11px;font-weight:700;letter-spacing:.06em;">
        VALOR GENERADO POR AUTOMATIZACIÓN
      </p>
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td width="33%"><p style="margin:0;color:#86efac;font-size:18px;font-weight:700;">~${tiempoAhorrado} hrs</p>
          <p style="margin:4px 0 0;color:#555;font-size:11px;">ahorradas vs manual</p></td>
        <td width="33%"><p style="margin:0;color:#86efac;font-size:18px;font-weight:700;">${valorTiempo}</p>
          <p style="margin:4px 0 0;color:#555;font-size:11px;">valor del tiempo ($45/hr)</p></td>
        <td width="33%"><p style="margin:0;color:#86efac;font-size:18px;font-weight:700;">${s.busquedasSerpApi}</p>
          <p style="margin:4px 0 0;color:#555;font-size:11px;">comparativos automáticos</p></td>
      </tr></table>
    </div>
  </td></tr>

  <!-- Categorías + Tiendas -->
  <tr><td style="padding:0 32px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td width="50%" style="padding-right:8px;vertical-align:top;">
        <div style="background:#1C1C1C;border:1px solid #2a2a2a;border-radius:10px;padding:16px;">
          <p style="margin:0 0 12px;color:#666;font-size:11px;font-weight:700;letter-spacing:.06em;">COSTO POR CATEGORÍA</p>
          <table width="100%" cellpadding="0" cellspacing="0">${catsRows}</table>
        </div>
      </td>
      <td width="50%" style="padding-left:8px;vertical-align:top;">
        <div style="background:#1C1C1C;border:1px solid #2a2a2a;border-radius:10px;padding:16px;">
          <p style="margin:0 0 12px;color:#666;font-size:11px;font-weight:700;letter-spacing:.06em;">PRECIOS POR TIENDA</p>
          <table width="100%" cellpadding="0" cellspacing="0">${tiendasRows}</table>
        </div>
      </td>
    </tr></table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#1C1C1C;padding:16px 32px;border-top:1px solid #2a2a2a;text-align:center;">
    <p style="margin:0;color:#555;font-size:11px;">
      Atlantic Services LLC · info@atlanticser.com · (317) 739-2540<br>
      5341 W. 86th St. Indianapolis, IN 46268
    </p>
    <p style="margin:8px 0 0;color:#333;font-size:10px;">
      Generado automáticamente por Motor RPA v2.1 · atlantic-rpa-service-production-2e39.up.railway.app
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

// ── POST: envío manual desde el panel ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, stats, proyectos } = body

    if (!email) {
      return NextResponse.json({ ok: false, error: 'Email requerido' }, { status: 400 })
    }

    const fechaCorte = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    })

    const html = generarHTMLReporte(stats, proyectos, fechaCorte)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [email],
        subject: `📊 Reporte de Rentabilidad — Atlantic Services · ${fechaCorte}`,
        html,
      }),
    })

    const resendData = await resendRes.json()

    if (!resendRes.ok) {
      return NextResponse.json({ ok: false, error: resendData.message || 'Error Resend' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, email_id: resendData.id, enviado_a: email })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

// ── GET: endpoint cron (cron-job.org lo llama periódicamente) ─────────────────
export async function GET(req: NextRequest) {
  // Seguridad mínima: verificar header secret
  const secret = req.headers.get('x-cron-secret')
  if (secret !== process.env.CRON_SECRET && process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

    const [{ data: proyectos }, { data: materiales }, { data: logs }] = await Promise.all([
      supabase.from('proyectos').select('id, estado, created_at'),
      supabase.from('materiales').select('proyecto_id, categoria, costo_material, costo_mano_obra'),
      supabase.from('log_precios').select('tienda, es_precio_elegido'),
    ])

    const mats = materiales || []
    const logsList = logs || []
    const projs = proyectos || []

    const totalMateriales = mats.reduce((s, m) => s + (m.costo_material || 0), 0)
    const totalManoObra   = mats.reduce((s, m) => s + (m.costo_mano_obra || 0), 0)

    const porCategoria: Record<string, number> = {}
    mats.forEach(m => { porCategoria[m.categoria || 'Sin cat'] = (porCategoria[m.categoria || 'Sin cat'] || 0) + (m.costo_material || 0) })

    const porTienda: Record<string, number> = {}
    logsList.filter(l => l.es_precio_elegido).forEach(l => { porTienda[l.tienda || '—'] = (porTienda[l.tienda || '—'] || 0) + 1 })

    const stats = {
      totalProyectos:   projs.length,
      cotizados:        projs.filter(p => p.estado === 'COTIZADO').length,
      enviados:         projs.filter(p => p.estado === 'ENVIADO').length,
      totalMateriales,
      totalManoObra,
      totalValor:       totalMateriales + totalManoObra,
      avgPorProyecto:   projs.length ? (totalMateriales + totalManoObra) / projs.length : 0,
      busquedasSerpApi: mats.length * 3,
      porCategoria,
      porTienda,
    }

    // Obtener email destino desde env o fallback
    const emailDestino = process.env.REPORTE_EMAIL || 'atlanticservicesgc@gmail.com'

    const fechaCorte = new Date().toLocaleDateString('es-CO', {
      year: 'numeric', month: 'long', day: 'numeric'
    })

    const html = generarHTMLReporte(stats as Record<string, unknown>, projs, fechaCorte)

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from:    FROM_EMAIL,
        to:      [emailDestino],
        subject: `📊 Reporte Semanal de Rentabilidad — Atlantic Services · ${fechaCorte}`,
        html,
      }),
    })

    const resendData = await resendRes.json()
    if (!resendRes.ok) throw new Error(resendData.message)

    return NextResponse.json({ ok: true, email_id: resendData.id, enviado_a: emailDestino })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error interno'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
