export type EstadoProyecto = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'ERROR'
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
  error_detalle?: string
  created_at: string
  updated_at: string
}

export interface Material {
  id: string
  proyecto_id: string
  linea: number
  categoria: string
  material: string
  area_ft2: number
  unidad: string
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

export interface CatalogoItem {
  id: string
  categoria: string
  material: string
  unidad: string
  precio_base: number
  tienda: string
  desperdicio_pct: number
  mano_obra_pct: number
}

export interface Usuario {
  id: string
  email: string
  nombre: string
  rol: RolUsuario
  activo: boolean
}

export const CATEGORIAS = [
  'Flooring', 'Drywall', 'Paint', 'Siding',
  'Carpentry', 'Waterproof', 'Remodeling', 'Other'
]

export const TIENDAS = ['Home Depot', "Lowe's", 'Menards', 'Floor & Decor', 'ABC Supply']

export const TIPOS_PROYECTO = [
  'Flooring', 'Drywall', 'Paint', 'Siding', 'Carpentry',
  'Waterproofing', 'Remodeling', 'Full Renovation', 'Other'
]

export const ESTADO_COLORS: Record<EstadoProyecto, string> = {
  PENDIENTE:   'bg-yellow-100 text-yellow-800',
  EN_PROCESO:  'bg-blue-100 text-blue-800',
  COMPLETADO:  'bg-green-100 text-green-800',
  ERROR:       'bg-red-100 text-red-800',
}
