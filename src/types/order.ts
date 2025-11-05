export interface Product {
  nombre: string;
  precio_unitario: number;
  unidad: string;
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
  total: number;
}

export interface Provider {
  id: string;
  nombre: string;
  productos: Product[];
}
