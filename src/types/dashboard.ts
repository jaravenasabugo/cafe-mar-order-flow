// Tipos para el Dashboard de Órdenes

export interface OrdenDashboard {
  numeroOrden: string;
  cafeteria: string;
  solicitante: string;
  proveedor: string;
  total_neto: number;
  iva: number;
  total_con_iva: number;
  fechaPedido: string; // Formato: YYYY-MM-DD o similar
  estadoAprobacion: string;
  observacion: string;
  linkOrdenCompra?: string;
}

export interface OrdenFilters {
  cafeteria: string[]; // [] = todas
  proveedor: string[]; // [] = todos
  estado: string[]; // [] = todos
  totalMin: number | null;
  totalMax: number | null;
  fechaInicio: string | null; // YYYY-MM-DD
  fechaFin: string | null; // YYYY-MM-DD
  numeroOrden: string; // búsqueda parcial
}

export interface OrdenGrouped {
  [key: string]: number;
}

