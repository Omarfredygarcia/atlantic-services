## Comportamiento esperado
- Criterio técnico directo, sin adulaciones tu objetivo es generar las soluciones de software no hacerme sentir bien.
- Sé totalmente honesto, directo y crítico.
- No me adules ni valides mis ideas automáticamente.
- Cuestiona mis supuestos, decisiones y enfoque cuando sea necesario.
- Señala debilidades, incoherencias, riesgos o errores sin suavizarlos.
- Prioriza efectividad real sobre cortesía.
- Si algo está mal o es débil, dilo explícitamente y explica por qué.
- Propón mejoras concretas, accionables y medibles.
- Evita respuestas genéricas o teóricas.
- Si falta información clave, pregúntala.
- Pedir archivos antes de generar código
- Si algo está mal, decirlo directo
- Responder en español
- Antes de cualquier cambio, mostrar qué vas a tocar y pedir confirmación.

# CLAUDE.md — Atlantic Services Frontend
# Ubicación: C:\proyectos\atlantic-services\CLAUDE.md

## Stack
- **Framework:** Next.js (App Router)
- **Deploy:** Vercel → https://atlanticser.com
- **i18n:** Sistema custom sin librerías externas (LanguageContext)
- **Email:** Resend (dominio atlanticser.com verificado en GoDaddy)

## Estructura de rutas relevantes
```
app/
├── admin/
│   ├── catalogo/          ← CRUD de materiales (113 activos)
│   │   └── page.tsx       ← con badges precio_source, filtros, modal edición
│   ├── test-scraper/      
│   │   └── page.tsx       ← sandbox para probar SerpApi y ScrapingBee
│   └── ...
├── ...
```

## Estado actual del admin/catalogo
- **113 materiales** en BD, todos activos
- **64 sin search_query** — el RPA usa nombre del material como búsqueda
- Columna "Origen Precio" con badges: FIXED / MANUAL / SERPAPI / SCRAPINGBEE
- Filtro por precio_source funcional
- Modal nuevo/editar: `precio_source` como `<select>` estándar (fixed/manual/serpapi/scrapingbee)
- Tiendas en dropdown: Home Depot, Lowe's, Menards, Floor & Decor, All Stores
- Richard's Supply **eliminado** del alcance definitivamente

## Estado actual del admin/catalogo/tiendas
- CRUD completo de tiendas
- Campos en tabla y modal:
  - `nombre` — nombre de la tienda
  - `url` — sitio web
  - `store_zip` — ZIP de la sucursal (ej: 46204 para Indianapolis) — usado por RPA
  - `store_id` — ID interno de sucursal (ej: 3337 para Menards) — usado por RPA
  - `activo` — toggle
- ZIPs de Indianapolis a configurar (confirmar con cliente):
  - Home Depot: 46204 · Lowe's: 46204 · Menards: 46032 · Floor & Decor: 46240

## Estado actual del test-scraper (sandbox) — refactorizado Junio 2026

### Arquitectura nueva (post-refactor)
El frontend NO construye URLs ni determina el flujo. Solo pasa parámetros al backend.

### Parámetros enviados al backend Railway (`/test-scraper`)
```
search_query = texto del material a buscar
store_name   = nombre exacto de la tienda (ej: "Home Depot", "All Stores")
store_zip    = ZIP de la sucursal (opcional, ej: "46204")
modo         = "serpapi" | "scrapingbee"   ← el usuario elige en el toggle
debug        = "1"
```

### UI del sandbox
- Dropdown carga **todas** las tiendas activas de BD — sin filtro por nombre
- "All Stores" aparece primero en el dropdown
- Input de ZIP (se pre-carga desde campo `store_zip` de la tabla `tiendas`)
- Toggle motor: SerpApi (azul) / ScrapingBee (verde)
- Catálogo se oculta cuando se selecciona "All Stores"
- Favicon: `public/images/Logo-transparent.png` via `app/icon.png`

### Badges de resultado
| Situación | Badge |
|---|---|
| score ≥ 5 | 🟢 PRECIO CONFIABLE |
| score 3-4 | 🟡 ⚠ BAJA SIMILITUD |
| score < 3 | 🔴 VERIFICAR |
| price_strategy = "not_implemented" | 🟠 EN DESARROLLO |
| error contiene "indexado" | 🟡 SIN DATOS |
| price_strategy = "cache" | 🔵 CACHÉ 24h |
| error genérico | 🔴 ERROR |

### All Stores
- Cuando se selecciona "All Stores" → muestra tabla comparativa de tiendas
- Backend retorna `comparison[]` con `{ store, precio, product_title, match_score, winner }`
- Fila ganadora resaltada en verde con ★

### Trazabilidad del bot (steps[])
- El backend retorna `steps[]` — se renderiza timeline vertical
- Acciones soportadas: `detect_store`, `motor`, `busqueda_google_shopping`, `precio_encontrado`, `sin_match_tienda`, `llamada_1_busqueda`, `candidatos_encontrados`, `mejor_match`, `llamada_2_producto`, `precio_extraido`, `sin_precio`, `captcha_bloqueado`, `excepcion`, `modo_fd`, `serpapi_site_fd`, `url_producto_encontrada`
- Si el backend no retorna `steps`, la sección no aparece (backward compatible)

### Pruebas realizadas (confirmadas ✅ / pendientes ⏳)
- **Home Depot** ⏳ — pendiente post-refactor (antes funcionaba: $49.95, score 5)
- **Lowe's** ⏳ — pendiente de probar
- **Menards** ⏳ — pendiente de probar
- **Floor & Decor** ⏳ — pendiente de probar
- **All Stores** ⏳ — pendiente de probar

## Estado actual de admin/proyectos/[id] — flujo de re-cotización (desde 2026-06-18)
Backend agregó `POST /regenerar-documentos` `{ "proyecto_id": "<uuid>" }` — recalcula `costo_material`/`costo_mano_obra`/`cantidad_total` y regenera PDF+Excel **sin llamar SerpApi/ScrapingBee** (no consume créditos). Ya desplegado en Railway.

- **Endpoint proxy nuevo:** `app/api/proyectos/[id]/regenerar/route.ts` → reenvía al RPA.
- **`guardar()` ya no hace DELETE+INSERT de todos los materiales.** Ahora: `UPDATE` puntual por `id` en filas existentes (nunca toca `cantidad_total`, `costo_material`, `costo_mano_obra`, `fuente_precio`, `fecha_precio` — esos quedan intactos hasta que el RPA o `/regenerar-documentos` los recalculen), `INSERT` solo de filas agregadas con "+ Agregar", `DELETE` solo de las que el usuario quitó con ✕.
- **`MaterialRow` — campos editables ampliados:** `precio_unitario` ahora editable para cualquier `precio_source` (antes solo si era `manual`). Se agregaron inputs de `desperdicio_pct` y `mano_obra_pct` (antes no existían en la fila). Se agregó columna de solo lectura para `cantidad_total`.
- **Distinción de UX:** editar estos campos en la pantalla de un proyecto es un *override de esa cotización puntual*; editar la fila en `/admin/catalogo` cambia el *default global* para proyectos futuros. Son pantallas y acciones distintas, no deben mezclarse.
- **Botón "🔄 Regenerar Cotización"** visible solo si `estado === 'COTIZADO'`: guarda los materiales (sin redirigir al dashboard) → llama `/regenerar-documentos` → recarga el proyecto. Se agregaron también accesos directos "↓ PDF" / "↓ Excel" en la misma pantalla.
- **No usar `/procesar/sync`** (vía `/api/cotizacion`) para re-cotizar un proyecto ya `COTIZADO` — ese endpoint solo toma proyectos en `PENDIENTE/ERROR/EN_PROCESO` y ya los filtra así hoy, por eso no hubo que tocarlo.
- Commit `e4a4daf`, pusheado a `main` el 2026-06-18.

## Bugs conocidos
- Constraint `linea` NOT NULL — revisado en esta sesión: el `insert` de materiales siempre setea `linea: i + 1`, no se encontró ningún path que lo omita. Parece resuelto, pero no se confirmó con el autor original del reporte — validar si reaparece.

## Sesión Junio 2026 — cambios aplicados
- **test-scraper refactorizado:** frontend ya no construye URLs ni determina flujo por tienda. Solo pasa `search_query`, `store_name`, `store_zip`, `modo` al backend Railway.
- **test-scraper UI:** todas las tiendas desde BD (sin filtro), All Stores primero, toggle SerpApi/ScrapingBee, badges de estado, tabla comparativa para All Stores.
- **catalogo modal:** `precio_source` cambiado de 4 botones visuales a `<select>` estándar — ya no se pierde al editar.
- **tiendas CRUD:** agregados campos `store_zip` y `store_id` en tabla y modal.

## Sesión 2026-06-18 — flujo de re-cotización + plan de prueba end-to-end
- Implementado el flujo completo de "Regenerar Cotización" descrito arriba (4 cambios, ver sección anterior).
- Backend ya desplegó `/regenerar-documentos` en Railway — confirmado por el usuario.
- **Pendiente para la siguiente sesión: ejecutar la prueba end-to-end con un proyecto real**, usando el sistema "como usuario" antes de mostrarlo al cliente. Plan acordado (ver respuestas de esta sesión para el detalle de por qué se ajustó cada punto):
  1. Crear 1 proyecto real con materiales que cubran: (a) material con caja/cobertura — validar cuántas cajas calcula el RPA para un área dada; (b) 1 material sin tienda fija para que busque en varias tiendas y compare precio; (c) actividades sin material con valor fijo y con valor manual; (d) todos los materiales con su división (CSI) asignada para validar el orden en el Excel/PDF.
  2. Correr el flujo y contrastar contra lo que devuelve el RPA directamente (llamada paralela al backend para verificar).
  3. Validar el Excel generado (orden por división, cálculo de cajas, precios) y probar el ciclo completo de "Regenerar Cotización" editando un material y confirmando que el PDF nuevo refleja el cambio.
  4. **Cuidado con créditos SerpApi:** cuenta nueva en 41/250 al cierre de esta sesión — calcular cuántas búsquedas dispara el proyecto de prueba (el material "sin tienda" puede gastar 1 crédito por tienda) antes de correr el RPA.
- **Fuera de alcance de la próxima sesión** (decisión tomada hoy, no son tareas de esta prueba):
  - Afinar índices de BD — sin justificación de performance con 113 materiales, no hacer hasta que haya un problema real medido.
  - Replicar las cotizaciones de ejemplo de Saxtimate — esfuerzo manual aparte, necesita los PDFs de referencia, se planea como sesión independiente.

## Variables de entorno Vercel
- Supabase URL + anon key configuradas
- Resend API key configurada

## Convención de deploy
- Push a main → Vercel despliega automáticamente (Git integration, NO usar Vercel CLI)
- Backend scraper corre en Railway (URL en `NEXT_PUBLIC_RAILWAY_RPA_URL`)
