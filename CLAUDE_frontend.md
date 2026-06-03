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
- 4 tiendas en dropdown: Home Depot, Lowe's, Menards, Floor & Decor
- Modo `serpapi` disponible para las 4 tiendas
- Modo `scrapingbee` disponible para las 4 tiendas
- Floor & Decor usa flujo híbrido (SerpApi URL → ScrapingBee precio)
- Deploy confirmado en Vercel ✅

## Bugs conocidos
- `precio_source` field missing en CRUD del frontend del catálogo (pendiente)
- Constraint `linea` NOT NULL — fix listo pero pendiente de ejecutar

## Variables de entorno Vercel
- Supabase URL + anon key configuradas
- Resend API key configurada

## Convención de deploy
- Push a main → Vercel despliega automáticamente
- NO subir page.tsx del test-scraper — ya está desplegado y correcto (v30)
