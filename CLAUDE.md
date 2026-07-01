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

## Modelo de datos del catálogo — jerarquía completa

```
Divisiones (CSI)  →  Categorías  →  Catálogo (materiales)  →  [Tienda] + [Unidad] + [precio_source] + [search_query]
```

Cada nivel tiene su propia pantalla CRUD bajo `/admin/catalogo/*`, accesible desde la barra superior de `/admin/catalogo`:

### 1. Divisiones — `/admin/catalogo/divisiones`
- Tabla `divisiones`: `codigo` (ej. `DIV. 06`), `nombre` (ej. `WOOD, PLASTICS & COMPOSITES`), `activo`.
- `codigo` y `nombre` se guardan siempre en MAYÚSCULAS (forzado en el `guardar()` del frontend, no en la BD).
- Es el nivel más alto — determina el orden y agrupación del PDF/Excel final (ver "Orden del documento final" en el manual de usuario).
- No tiene relación directa con tiendas, unidades ni precio — solo agrupa categorías.

### 2. Categorías — `/admin/catalogo/categorias`
- Tabla `categorias`: `nombre`, `descripcion`, `activo`, `division_id` (FK obligatoria a `divisiones`).
- Cada categoría pertenece a **exactamente una** división CSI. Por eso en `/admin/proyectos/[id]` cuando se elige "Categoría" en una línea de material, ya queda implícita la división CSI de esa línea para el documento final.
- Filtro por división disponible en la pantalla.
- *Nota histórica:* hubo columnas `csi_division`/`csi_nombre` directas en `categorias` que se eliminaron a favor del FK `division_id` — si encuentras código viejo referenciando esas columnas, está desactualizado (ver el comentario "FIX" en `app/admin/proyectos/[id]/page.tsx`).

### 3. Unidades — `/admin/catalogo/unidades`
- Tabla `unidades`: `codigo` (ej. `EA`, `LF`, `SF`, `CY`, `Sheet`, `GAL`, `SQ`, `Bag`, `Tube`, `HM`), `descripcion`, `activo`.
- Es solo de visualización/unidad de medida — el cálculo de "cuántas unidades comprar" (ej. sheets de drywall por ft²) lo hace el backend RPA, no hay un campo de "cobertura por unidad" visible en esta tabla ni en `catalogo`. Confirmado en pruebas: 100 ft² de drywall (unidad `Sheet`) calculó correctamente 4 sheets — la lógica de cobertura vive en el backend Railway, no en este frontend.

### 4. Tiendas — `/admin/catalogo/tiendas`
- Tabla `tiendas`: `nombre`, `url`, `store_zip`, `store_id`, `activo`.
- **No define el motor de búsqueda ni el tipo de búsqueda** — la tienda es solo "dónde buscar". El motor (SerpApi/ScrapingBee) y el tipo de búsqueda se configuran a nivel de **cada material del catálogo**, no a nivel de tienda.
- `store_zip`: ZIP de la sucursal usado por el RPA para precios locales (ej. `46204` Indianapolis para Home Depot/Lowe's, `46032` para Menards).
- `store_id`: ID interno de sucursal que algunas tiendas requieren (ej. Menards `3337`). Vacío si no aplica.
- La tienda especial **"All Stores"** (id fijo `0be94ea7-54e4-4420-b611-333c1fe2c13d` en esta BD) le dice al RPA que busque en todas las tiendas activas y elija la mejor — no es una tienda real, es un valor de control. Ver limitación de `comparison[]` documentada abajo.
- Richard's Supply **eliminado** del alcance definitivamente.

### 5. Catálogo (materiales) — `/admin/catalogo` — donde se configura el motor y tipo de búsqueda
Cada fila de `catalogo` es la unidad de configuración real para precios. Campos clave:
- `categoria_id`, `tienda_id`, `unidad_id` — FKs a los 3 niveles anteriores.
- **`precio_source`** — esto ES el "motor": `fixed` (precio fijo en BD, no busca nada), `manual` (lo escribe el revisor en cada cotización), `serpapi` (Google Shopping), `scrapingbee` (scraping directo a la página de la tienda — usado cuando Google Shopping no indexa bien esa tienda, ej. Floor & Decor; si falla, el sistema cae automáticamente a SerpApi).
- **`search_query`** — el "tipo de búsqueda": texto exacto que se envía al motor elegido. Si está vacío, el RPA usa el `material` como búsqueda (menos preciso). De 113 materiales activos, 64 no tienen `search_query` definido.
- `desperdicio_pct` / `mano_obra_pct` — defaults globales para nuevos proyectos; se pueden sobreescribir por proyecto en `/admin/proyectos/[id]` sin afectar este default.
- `precio_base` / `precio_base_usd` — solo se usa de verdad cuando `precio_source = fixed`; para los demás casos es un valor de referencia que se muestra en pantalla pero no es el precio final.

**Resumen para configurar un material nuevo:** elegir división→categoría primero, luego decidir el motor (`precio_source`): si es un commodity buscable en tienda, usar `serpapi` con `search_query` específico y tienda fija (o "All Stores" si no hay tienda preferida); si es un concepto fijo (permisos, mobilización), usar `fixed` con `precio_base`; si requiere criterio humano por proyecto, usar `manual`.

## Estado actual del admin/catalogo
- **113 materiales** en BD, todos activos
- **64 sin search_query** — el RPA usa nombre del material como búsqueda
- Columna "Origen Precio" con badges: FIXED / MANUAL / SERPAPI / SCRAPINGBEE
- Filtro por precio_source funcional
- Modal nuevo/editar: `precio_source` como `<select>` estándar (fixed/manual/serpapi/scrapingbee)
- Tiendas en dropdown: Home Depot, Lowe's, Menards, Floor & Decor, All Stores
- Richard's Supply **eliminado** del alcance definitivamente

## Estado actual del admin/catalogo/tiendas
CRUD completo — campos y comportamiento documentados arriba en "4. Tiendas". Pendiente de confirmar con el cliente:
- ZIPs de Indianapolis: Home Depot: 46204 · Lowe's: 46204 · Menards: 46032 · Floor & Decor: 46240

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
- Cuando se selecciona "All Stores" → la UI está preparada para mostrar tabla comparativa de tiendas (`comparison[]` con `{ store, precio, product_title, match_score, winner }`, fila ganadora resaltada en verde con ★)
- **⚠ Verificado 2026-06-23: el backend v2.8 ya NO devuelve `comparison[]`.** Probado contra Railway en producción con varias queries (cacheadas y sin caché) — la respuesta solo trae el ganador final (`fuente: "SerpApi — All Stores → <tienda>"`) y un único step `ganador_all_stores` en `steps[]`, sin el detalle por tienda. La tabla comparativa de la UI nunca se renderiza con la versión actual del backend porque `result.comparison` siempre llega vacío/ausente. **Pendiente: confirmar con el desarrollador del backend si se descontinuó a propósito o es una regresión** — si se quiere recuperar la función, hay que tocar el backend (Railway/Python), no el frontend.

### Trazabilidad del bot (steps[])
- El backend retorna `steps[]` — se renderiza timeline vertical
- Acciones soportadas: `detect_store`, `motor`, `busqueda_google_shopping`, `precio_encontrado`, `sin_match_tienda`, `llamada_1_busqueda`, `candidatos_encontrados`, `mejor_match`, `llamada_2_producto`, `precio_extraido`, `sin_precio`, `captcha_bloqueado`, `excepcion`, `modo_fd`, `serpapi_site_fd`, `url_producto_encontrada`
- Si el backend no retorna `steps`, la sección no aparece (backward compatible)

### Pruebas realizadas (confirmadas ✅ / pendientes ⏳)
- **Home Depot** ✅ — confirmado 2026-06-23 vía RPA real y vía sandbox (ej. drywall $17.98–$22.48 según query, badges VERIFICAR/BAJA SIMILITUD/CONFIABLE vistos en distintas pruebas)
- **Lowe's** ✅ — confirmado 2026-06-23, aparece como ganador en resultados "All Stores" (ej. $3.85 stud lumber)
- **Menards** ⏳ — pendiente de probar directo (no salió ganador en las pruebas de esta sesión)
- **Floor & Decor** ⏳ — pendiente de probar
- **All Stores** ✅ con matiz — el flujo funciona y elige ganador correctamente (confirmado contra Home Depot y Lowe's), pero **sin la tabla comparativa** — ver nota arriba en "All Stores"

## Estado actual de admin/proyectos/[id] — flujo de re-cotización (desde 2026-06-18)
Backend agregó `POST /regenerar-documentos` `{ "proyecto_id": "<uuid>" }` — recalcula `costo_material`/`costo_mano_obra`/`cantidad_total` y regenera PDF+Excel **sin llamar SerpApi/ScrapingBee** (no consume créditos). Ya desplegado en Railway.

- **Endpoint proxy nuevo:** `app/api/proyectos/[id]/regenerar/route.ts` → reenvía al RPA.
- **`guardar()` ya no hace DELETE+INSERT de todos los materiales.** Ahora: `UPDATE` puntual por `id` en filas existentes (nunca toca `cantidad_total`, `costo_material`, `costo_mano_obra`, `fuente_precio`, `fecha_precio` — esos quedan intactos hasta que el RPA o `/regenerar-documentos` los recalculen), `INSERT` solo de filas agregadas con "+ Agregar", `DELETE` solo de las que el usuario quitó con ✕.
- **`MaterialRow` — campos editables ampliados:** `precio_unitario` ahora editable para cualquier `precio_source` (antes solo si era `manual`). Se agregaron inputs de `desperdicio_pct` y `mano_obra_pct` (antes no existían en la fila). Se agregó columna de solo lectura para `cantidad_total`.
- **Distinción de UX:** editar estos campos en la pantalla de un proyecto es un *override de esa cotización puntual*; editar la fila en `/admin/catalogo` cambia el *default global* para proyectos futuros. Son pantallas y acciones distintas, no deben mezclarse.
- **Botón "🔄 Regenerar Cotización"** visible solo si `estado === 'COTIZADO'`: guarda los materiales (sin redirigir al dashboard) → llama `/regenerar-documentos` → recarga el proyecto. Se agregaron también accesos directos "↓ PDF" / "↓ Excel" en la misma pantalla.
- **No usar `/procesar/sync`** (vía `/api/cotizacion`) para re-cotizar un proyecto ya `COTIZADO` — ese endpoint solo toma proyectos en `PENDIENTE/ERROR/EN_PROCESO` y ya los filtra así hoy, por eso no hubo que tocarlo.
- Commit `e4a4daf`, pusheado a `main` el 2026-06-18.

## Sesión 2026-06-30 — RPA async polling + fixes de deploy

- **`/api/cotizacion/route.ts`** — cambiado de `/procesar/sync` (bloqueante, 120s timeout) a `/procesar` (retorna inmediato). Resuelve el error "The operation was aborted due to timeout" cuando ScrapingBee × 3 tiendas tarda >120s.
- **`app/admin/dashboard/page.tsx`** — `correrRPA()` ahora hace polling a Supabase cada 5s hasta que no queden proyectos en PENDIENTE/EN_PROCESO. Muestra "⏳ Procesando... actualizando cada 5s" mientras espera. `useEffect` agrega ping silencioso a Railway al cargar el dashboard (despierta el servicio en background para evitar cold start cuando el usuario hace click). Commits `c882333`, `b9cc585`.
- **`app/admin/proyectos/[id]/page.tsx` línea 697** — `onClick={regenerar}` → `onClick={() => regenerar()}`. Fix de TS error que bloqueaba los últimos 4 builds de Vercel (`MouseEvent` no asignable a `boolean | undefined`). Commit `dd824e4`.

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

## Sesión 2026-06-23 — prueba end-to-end ejecutada + automatización con Playwright

Se ejecutó por primera vez el plan de prueba end-to-end descrito en la sesión 2026-06-18, usando un navegador automatizado (Playwright) en vez de pruebas manuales. Resultado: el flujo completo (crear proyecto → correr RPA → regenerar cotización → PDF con divisiones CSI) funciona correctamente. Detalle abajo para repetir esto en el futuro sin volver a redescubrir los mismos obstáculos.

### Proyecto de prueba usado para validar (queda en BD, no borrar sin avisar)
- **`ATL-2026-008` — cliente "John Smith"**, email `omarfredygarcia@gmail.com`, estado COTIZADO.
- 4 materiales que cubren los 4 escenarios de precio: `EV Charging Station (Level 2)` (fixed), `Electrical Labor & Installation` (manual), `Drywall 1/2" 4x8 Sheet` (serpapi, tienda fija Home Depot — 100 ft² → calculó correctamente 4 sheets), `2x4x8 stud lumber (All Stores test)` (serpapi, "All Stores").
- Sirvió también para probar "Regenerar Cotización": se cambió el precio del drywall y el PDF recalculó el costo total correctamente sin gastar créditos nuevos.

### Cómo correr el frontend en local para pruebas (obstáculos reales encontrados)
1. **`npm run dev` con Turbopack crashea en este equipo** (`TurbopackInternalError: failed to create whole tree`, reproducible, no es flaky). Usar siempre `npx next dev --webpack` en su lugar.
2. **`.env.local` no tiene las variables del backend Railway** — sin esto, "Correr RPA" intenta pegarle a `localhost:8000` y el sandbox `/admin/test-scraper` hace fetch a una URL vacía. Hay que agregar (ya quedaron agregadas, son locales, no se suben a git):
   ```
   RPA_SERVICE_URL=https://atlantic-rpa-service-production-2e39.up.railway.app
   NEXT_PUBLIC_RAILWAY_RPA_URL=https://atlantic-rpa-service-production-2e39.up.railway.app
   ```
   `NEXT_PUBLIC_*` se inyecta en build time — si se agrega o cambia, hay que reiniciar el dev server, no basta con guardar el archivo.
3. **El backend Railway hace cold start** (~9-25s la primera llamada tras estar inactivo). Un primer intento puede fallar con "Failed to fetch" desde el browser o timeout por curl — no es un error real, es la instancia despertando. Si falla, repetir la misma llamada después de "calentarla" con un `curl` simple a `/`.
4. **`/api/cotizacion` (botón "▶ Correr RPA") procesa TODOS los proyectos en PENDIENTE/ERROR/EN_PROCESO de la BD, no solo el que estás probando** — y la BD de `.env.local` es la misma de producción, no hay BD de test separada. Antes de correr el RPA para una prueba, revisar si hay otros proyectos PENDIENTE que no se quieran reprocesar, y si hay, parquearlos temporalmente a otro estado (ej. `COMPLETADO`) y restaurarlos a `PENDIENTE` después. Esto pasó con `ATL-2026-004` en esta sesión.
5. **Las screenshots de "carga" hay que esperarlas explícitamente** — el dashboard y el sandbox muestran "Cargando proyectos..."/"Consultando..." mientras hacen fetch a Supabase/Railway; si se captura pantalla sin esperar a que ese texto desaparezca, sale vacío. No usar `page.waitForFunction(fn, { timeout })` con dos argumentos para esto en Playwright — en esta sesión ese patrón devolvió "Timeout 30000ms exceeded" ignorando el timeout pasado; más confiable hacer un loop manual con `page.waitForTimeout` polling cada 2s.
6. **`/api/proyectos/[id]/pdf` fuerza descarga en el browser headless** (Playwright no renderiza el PDF inline, dispara evento de descarga) — para capturar contenido del PDF no naveguar ahí con Playwright; mejor descargar el PDF con `fetch` directo desde Node y renderizarlo a imagen con `pymupdf` (`pip install pymupdf`, `fitz.open(...).get_pixmap(dpi=...)`). Las páginas del PDF de este sistema son **landscape Letter (792×612pt)**, no portrait — si se recorta una región, calcular el `clip` con esas dimensiones.

### Para automatizar screenshots/pruebas en el futuro
- Playwright quedó instalado como devDependency (`npm i -D playwright`, `npx playwright install chromium`) — no fue revertido, queda disponible.
- El login de `/admin/login` es un formulario simple (`input[type=email]`, `input[type=password]`, `button[type=submit]`) — no tiene fricción para automatizar.
- Para no exponer datos reales de clientes en capturas del dashboard, se puede redactar por DOM antes de la captura: buscar filas que contengan nombres reales conocidos y reemplazar el `innerHTML` de la celda de cliente por un placeholder, vía `page.evaluate(...)`, antes de `page.screenshot()`.

### Generar el Manual de Usuario / Resumen Ejecutivo en PDF
- Los `.html` fuente están en `C:\proyectos\atlantic-contrato\Entregables\`. Las imágenes van en `Entregables/screenshots/` (referenciadas como `screenshots/0X-nombre.png` dentro del HTML) y el logo en `Entregables/assets/logo.png`.
- Regenerar el PDF con Edge headless (no hace falta ninguna librería adicional):
  ```
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless --disable-gpu --print-to-pdf="<ruta>.pdf" --no-pdf-header-footer "file:///<ruta>.html"
  ```

## 🔴 Hueco de seguridad — falta auth en casi toda `/api/*` (encontrado 2026-06-23)

Revisando un hallazgo del backend sobre `/api/reportes/stats`, se confirmó que el problema es de **toda la API**, no solo esa ruta: ninguna ruta usaba `createServerSupabaseClient()` + `getUser()` antes de tocar datos con la service key.

### ✅ Corregido, commiteado (`2463a8c`) y verificado en vivo en `atlanticser.com` (2026-06-23)
- `GET /api/reportes/stats` — antes era un dump público de costos/márgenes sin login. Verificado: `curl https://atlanticser.com/api/reportes/stats` → `401` sin sesión.
- `POST /api/reportes/rentabilidad` — antes era un relay de email abierto (cualquiera podía hacer que Resend enviara HTML arbitrario a cualquier dirección usando el dominio de Atlantic). El `GET` de este mismo archivo (usado por el cron de cron-job.org) **no se tocó** — sigue protegido por `x-cron-secret`, es un mecanismo de auth distinto y correcto para ese caso.
- `busquedasSerpApi: mats.length * 3` (dato inventado) → ahora `logs.length` (filas reales de `log_precios`), en `cargarStats()` del dashboard y en el cron de `rentabilidad/route.ts`. Verificado en producción: el modal de Rentabilidad ya muestra "80 consultas SerpApi" en vez del número inflado.
- Botón "🗓 Programar" del modal de Rentabilidad eliminado (`app/admin/dashboard/page.tsx`) — solo hacía `localStorage.setItem(...)` y mostraba "✅ programado" sin configurar nada real. Queda solo "📧 Enviar ahora", que sí funciona. Verificado en producción: 0 ocurrencias del botón.
- **Bug aparte encontrado al probar este fix — gráficas de Rentabilidad intermitentes:** el script de Chart.js se carga desde CDN (`cdnjs.cloudflare.com`) en un `useEffect`, y su `onload` usaba un closure de `stats` capturado en el montaje (casi siempre `null`, porque el fetch a Supabase normalmente termina después que arranca la carga del script). Si la red tardaba más en el CDN que en el fetch, el gráfico nunca se disparaba — intermitente, no reproducible a voluntad. Fix: nuevo estado `chartLibReady` seteado en el `onload`, y el render de las gráficas depende de `stats && chartLibReady` en vez del closure viejo. Verificado: 4/4 cargas frescas en local con canvas renderizado, y confirmado en producción con `getImageData` sobre el canvas.

**Pendiente — mismo problema de auth, sin corregir todavía, requiere sesión aparte:**
| Ruta | Riesgo |
|---|---|
| `GET/POST /api/proyectos` | Expone nombre/email/teléfono/dirección de **todos** los clientes (`select('*, materiales(*)')`) |
| `POST /api/cotizacion` | Cualquiera dispara el RPA → gasta créditos SerpApi/ScrapingBee |
| `POST /api/enviar` | Cualquiera con un `proyecto_id` fuerza el envío del email al cliente |
| `POST /api/proyectos/[id]/regenerar` | Cualquiera regenera PDF/Excel de cualquier proyecto |
| `GET /api/proyectos/[id]/pdf` y `/excel` | Descarga directa del documento (precios + datos del cliente) de cualquier proyecto |
| `GET /api/precios` | **Código muerto** (nada del frontend lo llama) que quema `SERP_API_KEY` públicamente — candidato a borrar directamente en vez de protegerlo |

`/api/contact` es la única ruta pública a propósito (formulario de la web) y está bien así.

**Fix a replicar en cada ruta** (mismo patrón ya usado en `stats` y `rentabilidad`):
```ts
import { createServerSupabaseClient } from '@/lib/supabase-server'
const authClient = await createServerSupabaseClient()
const { data: { user } } = await authClient.auth.getUser()
if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
```

## Variables de entorno Vercel
- Supabase URL + anon key configuradas
- Resend API key configurada

## Convención de deploy
- Push a main → Vercel despliega automáticamente (Git integration, NO usar Vercel CLI)
- Backend scraper corre en Railway (URL en `NEXT_PUBLIC_RAILWAY_RPA_URL`)
