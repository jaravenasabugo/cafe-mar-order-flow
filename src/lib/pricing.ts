import { Product } from "@/types/order";

/**
 * Calcula el precio unitario con descuento aplicado según las reglas de negocio
 * 
 * Regla especial para COMERCIAL CCU S.A. - Categoría "Latas":
 * - 1-8 unidades: precio unitario = 14208
 * - 9 o más unidades: precio unitario = 13248
 * 
 * @param product - Producto a calcular
 * @param quantity - Cantidad del producto
 * @param providerName - Nombre del proveedor
 * @returns Precio unitario con descuento aplicado (si aplica)
 */
export function calculateUnitPrice(
  product: Product,
  quantity: number,
  providerName: string
): number {
  // Verificar si aplica el descuento especial
  const isCCUProvider = providerName.trim().toUpperCase() === "COMERCIAL CCU S.A.";
  const isLatasCategory = product.categoria?.trim().toUpperCase() === "LATAS";
  
  if (isCCUProvider && isLatasCategory && quantity > 0) {
    // Aplicar descuento según cantidad
    if (quantity >= 9) {
      return 13248; // Precio para 9 o más unidades
    } else {
      return 14208; // Precio para 1-8 unidades
    }
  }
  
  // Retornar precio original si no aplica descuento
  return product.precio_unitario;
}

/**
 * Verifica si se aplicó un descuento al producto
 * 
 * @param product - Producto a verificar
 * @param quantity - Cantidad del producto
 * @param providerName - Nombre del proveedor
 * @returns true si se aplicó un descuento, false en caso contrario
 */
export function hasDiscountApplied(
  product: Product,
  quantity: number,
  providerName: string
): boolean {
  const isCCUProvider = providerName.trim().toUpperCase() === "COMERCIAL CCU S.A.";
  const isLatasCategory = product.categoria?.trim().toUpperCase() === "LATAS";
  
  // Solo hay descuento si es CCU, categoría Latas, cantidad >= 9, y el precio cambió
  if (isCCUProvider && isLatasCategory && quantity >= 9) {
    const unitPrice = calculateUnitPrice(product, quantity, providerName);
    return unitPrice !== product.precio_unitario;
  }
  
  return false;
}

/**
 * Calcula el subtotal de un producto aplicando descuentos si corresponde
 * 
 * @param product - Producto a calcular
 * @param quantity - Cantidad del producto
 * @param providerName - Nombre del proveedor
 * @returns Subtotal con descuentos aplicados
 */
export function calculateSubtotal(
  product: Product,
  quantity: number,
  providerName: string
): number {
  const unitPrice = calculateUnitPrice(product, quantity, providerName);
  return quantity * unitPrice;
}

