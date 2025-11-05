export interface Product {
  nombre: string;
  precio_unitario: number;
  unidad: string;
  categoria?: string;
}

export interface SelectedProduct extends Product {
  cantidad: number;
  subtotal: number;
}

export interface Order {
  solicitante: string;
  cafeteria: string;
  proveedor: string;
  productos: SelectedProduct[];
  total_neto: number; // neto (sin IVA)
  iva: number; // 19% del neto
  total_con_iva: number; // neto + IVA
  observacion: string; // puede estar vacío
}

export interface Provider {
  id: string;
  nombre: string;
  productos: Product[];
}
