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
- Modal nuevo/editar con selector visual de origen (4 botones)
- Tiendas en dropdown: Home Depot, Lowe's, Menards, Floor & Decor
- Richard's Supply **eliminado** del alcance definitivamente

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

## Bugs conocidos
- Constraint `linea` NOT NULL — fix listo pero pendiente de ejecutar

## Variables de entorno Vercel
- Supabase URL + anon key configuradas
- Resend API key configurada

## Convención de deploy
- Push a main → Vercel despliega automáticamente (Git integration, NO usar Vercel CLI)
- Backend scraper corre en Railway (URL en `NEXT_PUBLIC_RAILWAY_RPA_URL`)
