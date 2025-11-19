import { useEffect, useMemo, useState } from "react";
import { fetchSheetRows } from "@/lib/googleSheets";
import { OrdenDashboard } from "@/types/dashboard";

interface UseOrdenesResult {
  ordenes: OrdenDashboard[];
  loading: boolean;
  error: string | null;
}

// Estructura esperada en Google Sheets - Hoja "Ordenes":
// Columnas: numeroOrden, cafeteria, solicitante, proveedor, total_neto, iva, total_con_iva, fechaPedido, estadoAprobacion, observacion, linkOrdenCompra
export function useOrdenes(): UseOrdenesResult {
  const [ordenes, setOrdenes] = useState<OrdenDashboard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID as string | undefined;
  const sheetOrdenes = (import.meta.env.VITE_SHEET_ORDENES as string | undefined) || "Ordenes";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!sheetId) {
        setError("Falta configurar VITE_GOOGLE_SHEET_ID en variables de entorno");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const ordenRows = await fetchSheetRows(sheetId, sheetOrdenes);
        
        console.log("useOrdenes - Filas obtenidas:", ordenRows.length);
        if (ordenRows.length > 0) {
          console.log("useOrdenes - Primera fila de ejemplo:", ordenRows[0]);
        }

        // Parsear órdenes desde Google Sheets
        const ordenesParsed: OrdenDashboard[] = [];
        for (const row of ordenRows) {
          const numeroOrden = String((row["numeroOrden"] ?? row["Número de Orden"] ?? row["Numero Orden"] ?? "")).trim();
          const cafeteria = String((row["cafeteria"] ?? row["Cafetería"] ?? row["Cafeteria"] ?? "")).trim();
          const solicitante = String((row["solicitante"] ?? row["Solicitante"] ?? "")).trim();
          const proveedor = String((row["proveedor"] ?? row["Proveedor"] ?? "")).trim();
          
          // Manejar fecha del pedido - puede venir como Date object o string
          const fechaPedidoRaw = row["Fecha del pedido"] ?? row["fechaPedido"] ?? row["Fecha Pedido"] ?? row["Fecha"] ?? "";
          let fechaPedido = "";
          
          // Log para depuración - solo en desarrollo y para las primeras filas
          if (import.meta.env.DEV && ordenesParsed.length < 3 && fechaPedidoRaw) {
            console.log("Fecha del pedido raw:", {
              valor: fechaPedidoRaw,
              tipo: typeof fechaPedidoRaw,
              esDate: fechaPedidoRaw instanceof Date,
              stringValue: String(fechaPedidoRaw)
            });
          }
          
          if (fechaPedidoRaw instanceof Date) {
            // Si es un objeto Date, formatearlo como YYYY-MM-DD
            const year = fechaPedidoRaw.getFullYear();
            const month = String(fechaPedidoRaw.getMonth() + 1).padStart(2, "0");
            const day = String(fechaPedidoRaw.getDate()).padStart(2, "0");
            fechaPedido = `${year}-${month}-${day}`;
          } else if (typeof fechaPedidoRaw === "string") {
            fechaPedido = fechaPedidoRaw.trim();
          } else if (typeof fechaPedidoRaw === "number") {
            // Si es un timestamp, convertirlo a Date y luego formatearlo
            const date = new Date(fechaPedidoRaw);
            if (!isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              fechaPedido = `${year}-${month}-${day}`;
            }
          } else if (fechaPedidoRaw !== null && fechaPedidoRaw !== undefined && fechaPedidoRaw !== "") {
            // Intentar convertir cualquier otro tipo a string
            fechaPedido = String(fechaPedidoRaw).trim();
          }
          
          const estadoAprobacion = String((row["Estado Aprobacion"] ?? row["Estado Aprobación"] ?? row["estadoAprobacion"] ?? row["Estado"] ?? "")).trim();
          const observacion = String((row["observacion"] ?? row["Observación"] ?? row["Observacion"] ?? "")).trim();
          const linkOrdenCompra = String((row["Link orden de Compra"] ?? row["Link Orden de Compra"] ?? row["linkOrdenCompra"] ?? row["Link Orden Compra"] ?? row["Link"] ?? "")).trim() || undefined;

          // Parsear números
          const totalNetoRaw = row["total_neto"] ?? row["Total Neto"] ?? row["Total Neto"] ?? 0;
          const totalNeto = typeof totalNetoRaw === "number" ? totalNetoRaw : Number(String(totalNetoRaw || "0").replace(/[^0-9.,-]/g, "").replace(",", "."));

          const ivaRaw = row["iva"] ?? row["IVA"] ?? 0;
          const iva = typeof ivaRaw === "number" ? ivaRaw : Number(String(ivaRaw || "0").replace(/[^0-9.,-]/g, "").replace(",", "."));

          const totalConIvaRaw = row["Total del pedido + IVA"] ?? row["total_con_iva"] ?? row["Total con IVA"] ?? row["Total Con IVA"] ?? 0;
          
          // Log para depuración - solo en desarrollo y para las primeras filas
          if (import.meta.env.DEV && ordenesParsed.length < 3 && numeroOrden) {
            console.log("Total del pedido + IVA raw:", {
              numeroOrden,
              valor: totalConIvaRaw,
              tipo: typeof totalConIvaRaw,
              esDate: totalConIvaRaw instanceof Date,
              todasLasClaves: Object.keys(row).filter(k => k.toLowerCase().includes("total") || k.toLowerCase().includes("iva")),
              todasLasClavesCompletas: Object.keys(row),
              rowCompleto: row
            });
          }
          
          // Parsear el total con IVA - manejar diferentes formatos
          let totalConIva = 0;
          
          // Si viene como objeto Date (Google Sheets interpretó el número como fecha)
          // Intentar obtener el valor numérico original desde la celda
          if (totalConIvaRaw instanceof Date) {
            // Google Sheets almacena fechas como días desde 1899-12-30
            // Si el valor es una fecha muy lejana (año > 2100), probablemente es un número mal interpretado
            const year = totalConIvaRaw.getFullYear();
            if (year > 2100 || year < 1900) {
              // Es un número mal interpretado como fecha
              // Intentar obtener el valor desde la celda original si está disponible
              // Por ahora, intentar buscar en otras claves o usar el timestamp
              console.warn(`Total del pedido + IVA interpretado como fecha incorrecta: ${totalConIvaRaw}. Año: ${year}`);
              // Intentar buscar en otras variaciones del nombre
              const altKeys = Object.keys(row).filter(k => 
                k.toLowerCase().includes("total") && 
                (k.toLowerCase().includes("iva") || k.toLowerCase().includes("+"))
              );
              if (altKeys.length > 0) {
                const altValue = row[altKeys[0]];
                if (typeof altValue === "number") {
                  totalConIva = altValue;
                } else if (altValue && !(altValue instanceof Date)) {
                  const strValue = String(altValue).trim();
                  const cleaned = strValue
                    .replace(/[^\d.,-]/g, "")
                    .replace(/\./g, "")
                    .replace(",", ".");
                  const parsed = Number(cleaned);
                  totalConIva = Number.isFinite(parsed) && !isNaN(parsed) ? parsed : 0;
                }
              }
            } else {
              // Es una fecha válida, no un número mal interpretado
              totalConIva = 0;
            }
          } else if (typeof totalConIvaRaw === "number") {
            totalConIva = totalConIvaRaw;
          } else if (totalConIvaRaw !== null && totalConIvaRaw !== undefined && totalConIvaRaw !== "") {
            // Convertir string a número, manejando separadores de miles y decimales
            const strValue = String(totalConIvaRaw).trim();
            // Remover símbolos de moneda y espacios
            const cleaned = strValue
              .replace(/[^\d.,-]/g, "") // Remover todo excepto dígitos, puntos, comas y guiones
              .replace(/\./g, "") // Remover puntos (separadores de miles en formato chileno)
              .replace(",", "."); // Convertir coma decimal a punto
            const parsed = Number(cleaned);
            totalConIva = Number.isFinite(parsed) && !isNaN(parsed) ? parsed : 0;
          }

          // Log del valor parseado
          if (import.meta.env.DEV && ordenesParsed.length < 3 && numeroOrden) {
            console.log("Total del pedido + IVA parseado:", {
              numeroOrden,
              valorOriginal: totalConIvaRaw,
              valorParseado: totalConIva,
              esFinite: Number.isFinite(totalConIva)
            });
          }

          if (!numeroOrden) continue; // Saltar filas sin número de orden

          ordenesParsed.push({
            numeroOrden,
            cafeteria,
            solicitante,
            proveedor,
            total_neto: Number.isFinite(totalNeto) ? totalNeto : 0,
            iva: Number.isFinite(iva) ? iva : 0,
            total_con_iva: Number.isFinite(totalConIva) ? totalConIva : 0,
            fechaPedido,
            estadoAprobacion: estadoAprobacion || "Pendiente",
            observacion,
            linkOrdenCompra,
          });
        }

        console.log("useOrdenes - Órdenes parseadas:", ordenesParsed.length);
        if (!cancelled) setOrdenes(ordenesParsed);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error desconocido cargando órdenes");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sheetId, sheetOrdenes]);

  return useMemo(() => ({ ordenes, loading, error }), [ordenes, loading, error]);
}

