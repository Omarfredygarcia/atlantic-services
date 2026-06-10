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

## Estado actual del test-scraper (sandbox)
- 4 tiendas detectadas desde Supabase (filtro por nombre: menards, floor, home depot, lowe)
- Dropdown de catálogo carga items por tienda seleccionada, pre-carga search_query en el campo term
- Campo "URL de búsqueda" visible y editable para todas las tiendas (incluyendo F&D)
- Favicon cambiado a `public/images/Logo-transparent.png` via `app/icon.png` (Next.js App Router)

### Lógica de construcción de URL de búsqueda
Al seleccionar material o editar el campo Search Query:
- Si el valor **empieza con `http`** → se usa directamente como `base_url` (URL de producto)
- Si es **texto** → se construye `/search?q=<encoded>` usando constantes por tienda

### Modos F&D (Floor & Decor)
| Modo | `base_url` enviado al backend | Flujo backend |
|---|---|---|
| **A** ✅ | URL directa de producto (`/aquaguard.../product.html`) | ScrapingBee directo, 0 SerpApi |
| **B** | `/search?q=<término>` | SerpApi primero → puede fallar si Google no indexa |

**Para producción:** el campo `search_query` en Supabase para ítems F&D debe guardar la URL directa del producto (no texto descriptivo). Así el Modo A entra automáticamente en el flujo real `/procesar`.

### Parámetros enviados al backend Railway (`/test-scraper`)
```
base_url  = searchUrl construida (o URL directa si aplica)
term      = search_query text (o URL si se escribió una)
modo      = "serpapi" | "scrapingbee"   ← se determina por storeMode
debug     = "1"
```

### Constantes de URL base por tienda (en page.tsx)
```typescript
const STORE_SEARCH_URLS = {
  "homedepot":     "https://www.homedepot.com/s/",
  "lowes":         "https://www.lowes.com/search?searchTerm=",
  "menards":       "https://www.menards.com/main/search.html?search=",
  "flooranddecor": "https://www.flooranddecor.com/search?q=",
}
```

### Modos de scraping por tienda
- **Home Depot / Lowe's** → SerpApi (`modo=serpapi`) — botón "🔍 Probar SerpApi"
- **Menards** → ScrapingBee 2 llamadas (`modo=scrapingbee`) — botón "🐝 Probar ScrapingBee"
- **Floor & Decor** → Híbrido (`modo=scrapingbee`, backend decide Modo A o B) — botón "🔀 Probar F&D Híbrido"

### Trazabilidad del bot (steps[])
- El backend retorna `steps[]` en el response del `/test-scraper`
- El frontend renderiza un timeline vertical con ícono, label, resultado y detalle por paso
- Acciones soportadas: `detect_store`, `motor`, `busqueda_google_shopping`, `precio_encontrado`, `sin_match_tienda`, `llamada_1_busqueda`, `candidatos_encontrados`, `mejor_match`, `llamada_2_producto`, `precio_extraido`, `sin_precio`, `captcha_bloqueado`, `excepcion`, `modo_fd`, `serpapi_site_fd`, `url_producto_encontrada`
- Si el backend no retorna `steps`, la sección no aparece (backward compatible)

### Pruebas realizadas (confirmadas ✅ / pendientes ⏳)
- **Home Depot** ✅ — SerpApi funcionando, precio $49.95, match score 5, trazabilidad correcta
- **Lowe's** ⏳ — pendiente de probar
- **Menards** ⏳ — pendiente de probar
- **Floor & Decor** ⏳ — pendiente de probar

## Bugs conocidos
- Constraint `linea` NOT NULL — fix listo pero pendiente de ejecutar

## Variables de entorno Vercel
- Supabase URL + anon key configuradas
- Resend API key configurada

## Convención de deploy
- Push a main → Vercel despliega automáticamente (Git integration, NO usar Vercel CLI)
- Backend scraper corre en Railway (URL en `NEXT_PUBLIC_RAILWAY_RPA_URL`)
