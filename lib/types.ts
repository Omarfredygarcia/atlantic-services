export type EstadoProyecto = 'PENDIENTE' | 'EN_PROCESO' | 'COTIZADO' | 'ENVIADO' | 'ERROR'
export type RolUsuario = 'admin' | 'operador'
export type PrecioSource = 'serpapi' | 'scrapingbee' | 'fixed' | 'manual'

export interface Proyecto {
  id: string
  project_code: string
  fecha_creacion: string
  cliente_id?: string   // FK -> clientes.id (snapshot de texto abajo se mantiene igual, no se elimina)
  cliente_nombre: string
  cliente_email: string
  cliente_telefono?: string
  direccion?: string
  tipo_proyecto?: string
  descripcion?: string
  area_total_ft2?: number
  estado: EstadoProyecto
  ultimo_paso?: string
  fecha_hora_proceso?: string
  pdf_path?: string
  pdf_url?: string
  excel_path?: string
  fecha_envio_email?: string
  error_detalle?: string
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  proyecto_id: string
  linea: number

  // ── FKs v21 (modelo relacional correcto) ──────────────────
  catalogo_id?:  string   // FK → catalogo.id
  categoria_id?: string   // FK → categorias.id
  tienda_id?:    string   // FK → tiendas.id
  unidad_id?:    string   // FK → unidades.id

  // ── Campos de texto (snapshot del momento de cotización) ──
  // Se mantienen para historial y compatibilidad con RPA
  categoria:        string
  material:         string
  area_ft2:         number
  unidad:           string
  tienda_preferida?: string
  search_query?:    string

  // ── Calculados por el RPA ─────────────────────────────────
  precio_unitario?:   number   // precio final por unidad de compra (ej. por caja, ya convertido)
  precio_cotizacion?: number   // MAX entre tiendas, ya convertido -- precio facturado al cliente
  precio_compra?:     number   // MIN entre tiendas, ya convertido -- precio que paga Atlantic
  precio_por_sqft?:   number   // precio crudo tal como lo dio la tienda ganadora (antes de convertir a caja) -- null si el material no se vende por caja
  sqft_por_caja?:     number
  longitud_pies?:     number
  desperdicio_pct?:   number
  mano_obra_pct?:     number
  cantidad_total?:    number
  costo_material?:    number
  costo_mano_obra?:   number
  fecha_precio?:      string
  fuente_precio?:     string
  comparison?: {
    store: string
    precio: number
    product_title?: string
    match_score?: number
    winner?: boolean
  }[]

  created_at: string
  updated_at?: string
}

// ── Tablas de referencia ──────────────────────────────────────
export interface ClienteRef {
  id: string
  nombre: string
  email?: string | null
  telefono?: string | null
  empresa?: string | null
  direccion?: string | null
  identificacion?: string | null   // EIN (negocio) o SSN (individuo) -- EEUU no tiene un solo formato tipo NIT/RUT
  notas?: string | null
}

export interface CategoriaRef {
  id: string
  nombre: string
  csi_division?: string
  csi_nombre?: string
  activo?: boolean
}

export interface TiendaRef {
  id: string
  nombre: string
  url?: string
  activo?: boolean
}

export interface UnidadRef {
  id: string
  codigo: string
  descripcion?: string
  activo?: boolean
}

// ── CatalogoItem — modelo relacional v20 completo ────────────
export interface CatalogoItem {
  id: string
  material: string
  precio_base: number
  precio_source: PrecioSource
  precio_base_usd?: number
  desperdicio_pct: number
  mano_obra_pct: number
  search_query?: string
  activo?: boolean

  // FKs
  categoria_id: string
  tienda_id:    string
  unidad_id:    string

  // Joins (vienen de Supabase select con *)
  categorias?: { nombre: string; csi_division?: string; csi_nombre?: string }
  tiendas?:   { nombre: string }
  unidades?:  { codigo: string; descripcion?: string }

  // Campos planos derivados del JOIN — para uso fácil en UI
  categoria_nombre?: string
  tienda_nombre?:    string
  unidad_codigo?:    string
  unidad_desc?:      string
}

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: RolUsuario
  activo: boolean
}

// ── Constantes UI ─────────────────────────────────────────────
export const TIPOS_PROYECTO = [
  'Flooring', 'Drywall', 'Paint', 'Siding', 'Carpentry',
  'Waterproofing', 'Remodeling', 'Full Renovation', 'Commercial', 'Other'
]

export const ESTADO_COLORS: Record<EstadoProyecto, string> = {
  PENDIENTE:  'bg-yellow-100 text-yellow-800',
  EN_PROCESO: 'bg-blue-100 text-blue-800',
  COTIZADO:   'bg-purple-100 text-purple-800',
  ENVIADO:    'bg-teal-100 text-teal-800',
  ERROR:      'bg-red-100 text-red-800',
}

export const PRECIO_SOURCE_LABELS: Record<PrecioSource, string> = {
  serpapi:     '🌐 Google Shopping',
  scrapingbee: '🐝 Scraping directo',
  fixed:       '🔒 Precio fijo',
  manual:      '✏️ Manual',
}