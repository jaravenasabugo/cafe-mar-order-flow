import { useEffect, useMemo, useState } from "react";
import { fetchSheetRows } from "@/lib/googleSheets";
import { DetalleFactura } from "@/types/dashboard";

interface UseDetallesFacturasResult {
  detalles: DetalleFactura[];
  loading: boolean;
  error: string | null;
  getDetallesByFacturaId: (idFactura: string) => DetalleFactura[];
}

// Estructura esperada en Google Sheets - Hoja "Detalles Facturas":
// Columnas: ID Factura, Producto, Cantidad, Precio Unitario, Precio Total
export function useDetallesFacturas(): UseDetallesFacturasResult {
  const [detalles, setDetalles] = useState<DetalleFactura[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID as string | undefined;
  const sheetDetalles = (import.meta.env.VITE_SHEET_DETALLE_FACTURAS as string | undefined) || "Detalles Facturas";

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

        const detalleRows = await fetchSheetRows(sheetId, sheetDetalles);

        // Parsear detalles desde Google Sheets
        const detallesParsed: DetalleFactura[] = [];
        for (const row of detalleRows) {
          const idFactura = String((row["ID Factura"] ?? row["idFactura"] ?? "")).trim();
          const producto = String((row["Producto"] ?? row["producto"] ?? "")).trim();
          
          const cantidadRaw = row["Cantidad"] ?? row["cantidad"] ?? 0;
          const cantidad = typeof cantidadRaw === "number" ? cantidadRaw : Number(String(cantidadRaw || "0").replace(/[^0-9.,-]/g, "").replace(",", "."));

          const precioUnitarioRaw = row["Precio Unitario"] ?? row["precioUnitario"] ?? 0;
          const precioUnitario = typeof precioUnitarioRaw === "number" ? precioUnitarioRaw : Number(String(precioUnitarioRaw || "0").replace(/[^0-9.,-]/g, "").replace(",", "."));

          const precioTotalRaw = row["Precio Total"] ?? row["precioTotal"] ?? 0;
          const precioTotal = typeof precioTotalRaw === "number" ? precioTotalRaw : Number(String(precioTotalRaw || "0").replace(/[^0-9.,-]/g, "").replace(",", "."));

          if (!idFactura || !producto) continue; // Saltar filas sin ID o producto

          detallesParsed.push({
            idFactura,
            producto,
            cantidad: Number.isFinite(cantidad) ? cantidad : 0,
            precioUnitario: Number.isFinite(precioUnitario) ? precioUnitario : 0,
            precioTotal: Number.isFinite(precioTotal) ? precioTotal : 0,
          });
        }

        if (!cancelled) setDetalles(detallesParsed);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error desconocido cargando detalles de facturas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sheetId, sheetDetalles]);

  const getDetallesByFacturaId = useMemo(() => {
    return (idFactura: string): DetalleFactura[] => {
      return detalles.filter((d) => d.idFactura === idFactura);
    };
  }, [detalles]);

  return useMemo(
    () => ({ detalles, loading, error, getDetallesByFacturaId }),
    [detalles, loading, error, getDetallesByFacturaId]
  );
}

