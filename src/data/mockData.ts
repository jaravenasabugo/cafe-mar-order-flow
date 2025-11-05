import { Provider } from "@/types/order";

// Mock data - En producción, esto vendría de Google Sheets
export const CAFETERIAS = ["Cordillera", "FACH", "HM"];

export const PROVIDERS: Provider[] = [
  {
    id: "1",
    nombre: "Proveedor Café Premium",
    productos: [
      { nombre: "Café Grano Arábica", precio_unitario: 12500, unidad: "kg" },
      { nombre: "Leche Entera", precio_unitario: 950, unidad: "litro" },
      { nombre: "Azúcar Blanca", precio_unitario: 1200, unidad: "kg" },
    ],
  },
  {
    id: "2",
    nombre: "Distribuidora Alimentos del Sur",
    productos: [
      { nombre: "Pan Marraqueta", precio_unitario: 150, unidad: "unidad" },
      { nombre: "Pan Integral", precio_unitario: 180, unidad: "unidad" },
      { nombre: "Medialunas", precio_unitario: 250, unidad: "docena" },
    ],
  },
  {
    id: "3",
    nombre: "Lácteos La Granja",
    productos: [
      { nombre: "Queso Mantecoso", precio_unitario: 5200, unidad: "kg" },
      { nombre: "Mantequilla", precio_unitario: 3800, unidad: "kg" },
      { nombre: "Yogurt Natural", precio_unitario: 850, unidad: "litro" },
    ],
  },
  {
    id: "4",
    nombre: "Verduras Frescas del Valle",
    productos: [
      { nombre: "Lechuga", precio_unitario: 800, unidad: "kg" },
      { nombre: "Tomate", precio_unitario: 1200, unidad: "kg" },
      { nombre: "Palta", precio_unitario: 3500, unidad: "kg" },
    ],
  },
  {
    id: "5",
    nombre: "Carnes Selectas",
    productos: [
      { nombre: "Pechuga de Pollo", precio_unitario: 4500, unidad: "kg" },
      { nombre: "Jamón de Pavo", precio_unitario: 6800, unidad: "kg" },
      { nombre: "Salame", precio_unitario: 7200, unidad: "kg" },
    ],
  },
];
