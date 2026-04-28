export type EstadoProyecto = 'PENDIENTE' | 'EN_PROCESO' | 'COTIZADO' | 'ENVIADO' | 'COMPLETADO' | 'ERROR'
export type RolUsuario = 'admin' | 'operador'

export interface Proyecto {
  id: string
  project_code: string
  fecha_creacion: string
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
  categoria: string        // texto — foto del momento de cotización
  material: string
  area_ft2: number
  unidad: string           // texto — viene del catálogo al crear
  tienda_preferida?: string
  precio_unitario?: number
  desperdicio_pct?: number
  cantidad_total?: number
  costo_material?: number
  costo_mano_obra?: number
  fecha_precio?: string
  fuente_precio?: string
  created_at: string
}

// ── Tablas de referencia (modelo relacional) ──────────────────────────────────
export interface CategoriaRef {
  id: string
  nombre: string
  activo?: boolean
}

export interface TiendaRef {
  id: string
  nombre: string
  activo?: boolean
}

export interface UnidadRef {
  id: string
  nombre: string
  activo?: boolean
}

// ── CatalogoItem — refleja el modelo relacional actual ────────────────────────
export interface CatalogoItem {
  id: string
  material: string
  precio_base: number
  desperdicio_pct: number
  mano_obra_pct: number
  search_query?: string
  activo?: boolean
  // Relaciones (vienen del JOIN en Supabase)
  categoria_id: string
  tienda_id: string
  unidad_id: string
  categorias?: { nombre: string }
  tiendas?:   { nombre: string }
  unidades?:  { nombre: string }
  // Nombres planos para uso fácil en UI (derivados del JOIN)
  categoria_nombre?: string
  tienda_nombre?: string
  unidad_nombre?: string
}

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: RolUsuario
  activo: boolean
}

// ── Constantes de UI — solo las que no vienen de BD ──────────────────────────
// CATEGORIAS y TIENDAS se eliminaron — ahora se leen desde Supabase
// Mantener TIPOS_PROYECTO porque no tiene tabla propia aún

export const TIPOS_PROYECTO = [
  'Flooring', 'Drywall', 'Paint', 'Siding', 'Carpentry',
  'Waterproofing', 'Remodeling', 'Full Renovation', 'Other'
]

export const ESTADO_COLORS: Record<EstadoProyecto, string> = {
  PENDIENTE:   'bg-yellow-100 text-yellow-800',
  EN_PROCESO:  'bg-blue-100 text-blue-800',
  COTIZADO:    'bg-purple-100 text-purple-800',
  ENVIADO:     'bg-teal-100 text-teal-800',
  COMPLETADO:  'bg-green-100 text-green-800',
  ERROR:       'bg-red-100 text-red-800',
}