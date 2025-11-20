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

// Tipos para el Dashboard de Facturas

export interface FacturaDashboard {
  idFactura: string;
  localidad: string;
  numeroFactura: string;
  fechaEmision: string; // Formato: YYYY-MM-DD o similar
  fechaRecepcion: string; // Formato: YYYY-MM-DD o similar
  fechaVencimiento: string; // Formato: YYYY-MM-DD o similar
  rutEmisor: string;
  nombreEmisor: string;
  tipoDocumento: string;
  formaPago: string;
  fechaPago: string | null; // Puede estar vacío
  condicionPago: string;
  montoNeto: number;
  iva: number;
  montoTotal: number;
  observacion: string;
  linkFactura?: string; // Link a la factura
}

export interface DetalleFactura {
  idFactura: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  precioTotal: number;
}

export interface FacturaFilters {
  localidad: string[]; // [] = todas
  nombreEmisor: string[]; // [] = todos
  tipoDocumento: string[]; // [] = todos
  formaPago: string[]; // [] = todas
  condicionPago: string[]; // [] = todas
  montoMin: number | null;
  montoMax: number | null;
  fechaInicio: string | null; // YYYY-MM-DD
  fechaFin: string | null; // YYYY-MM-DD
  tipoFecha: "emision" | "recepcion" | "vencimiento"; // Tipo de fecha a filtrar
  busqueda: string; // búsqueda parcial en numeroFactura o rutEmisor
}

export type UserRole = 'admin' | 'encargado';

