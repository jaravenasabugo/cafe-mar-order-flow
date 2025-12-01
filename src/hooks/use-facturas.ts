import { useEffect, useMemo, useState } from "react";
import { fetchSheetRows } from "@/lib/googleSheets";
import { FacturaDashboard } from "@/types/dashboard";

interface UseFacturasResult {
  facturas: FacturaDashboard[];
  loading: boolean;
  error: string | null;
}

// Estructura esperada en Google Sheets - Hoja "Facturas":
// Columnas: Localidad, ID Factura, Numero Factura, Fecha emision, Fecha recepción, Fecha vencimiento,
// Rut Emisor, Nombre Emisor, Tipo Documento, Forma de pago, Fecha Pago, Condición Pago,
// Monto Neto, IVA, Monto Total, Observacion
export function useFacturas(): UseFacturasResult {
  const [facturas, setFacturas] = useState<FacturaDashboard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID as string | undefined;
  const sheetFacturas = (import.meta.env.VITE_SHEET_FACTURAS as string | undefined) || "Facturas";

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

        const facturaRows = await fetchSheetRows(sheetId, sheetFacturas);

        // Parsear facturas desde Google Sheets
        const facturasParsed: FacturaDashboard[] = [];
        for (const row of facturaRows) {
          const idFactura = String((row["ID Factura"] ?? row["idFactura"] ?? "")).trim();
          const localidad = String((row["Localidad"] ?? row["localidad"] ?? "")).trim();
          const numeroFactura = String((row["Numero Factura"] ?? row["numeroFactura"] ?? "")).trim();
          
          // Manejar fechas - pueden venir como Date object o string
          const fechaEmisionRaw = row["Fecha emision"] ?? row["fechaEmision"] ?? row["Fecha Emision"] ?? "";
          const fechaRecepcionRaw = row["Fecha recepción"] ?? row["fechaRecepcion"] ?? row["Fecha Recepción"] ?? "";
          const fechaVencimientoRaw = row["Fecha vencimiento"] ?? row["fechaVencimiento"] ?? row["Fecha Vencimiento"] ?? "";
          const fechaPagoRaw = row["Fecha Pago"] ?? row["fechaPago"] ?? "";

          // Función auxiliar para parsear fechas
          const parseDate = (dateRaw: any): string => {
            if (!dateRaw) return "";
            if (dateRaw instanceof Date) {
              const year = dateRaw.getFullYear();
              const month = String(dateRaw.getMonth() + 1).padStart(2, "0");
              const day = String(dateRaw.getDate()).padStart(2, "0");
              return `${year}-${month}-${day}`;
            }
            if (typeof dateRaw === "number") {
              const date = new Date(dateRaw);
              if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
              }
            }
            return String(dateRaw).trim();
          };

          const fechaEmision = parseDate(fechaEmisionRaw);
          const fechaRecepcion = parseDate(fechaRecepcionRaw);
          const fechaVencimiento = parseDate(fechaVencimientoRaw);
          const fechaPago = fechaPagoRaw ? parseDate(fechaPagoRaw) : null;

          const rutEmisor = String((row["Rut Emisor"] ?? row["rutEmisor"] ?? "")).trim();
          const nombreEmisor = String((row["Nombre Emisor"] ?? row["nombreEmisor"] ?? "")).trim();
          const tipoDocumento = String((row["Tipo Documento"] ?? row["tipoDocumento"] ?? "")).trim();
          const formaPago = String((row["Forma de pago"] ?? row["formaPago"] ?? row["Forma de Pago"] ?? "")).trim();
          const condicionPago = String((row["Condición Pago"] ?? row["condicionPago"] ?? row["Condicion Pago"] ?? "")).trim();
          const observacion = String((row["Observacion"] ?? row["observacion"] ?? row["Observación"] ?? "")).trim();
          const linkFactura = String((row["Link Factura"] ?? row["linkFactura"] ?? "")).trim();

          // Función auxiliar para parsear números con formato
          const parseNumber = (value: any): number => {
            if (typeof value === "number" && !isNaN(value)) {
              return value;
            }
            if (value === null || value === undefined || value === "") {
              return 0;
            }
            
            const valueStr = String(value).trim();
            if (valueStr === "" || valueStr === "-") {
              return 0;
            }
            
            // Remover caracteres no numéricos excepto punto, coma y signo negativo
            let cleaned = valueStr.replace(/[^0-9.,-]/g, "");
            
            // Detectar formato: punto es separador de miles, coma es decimal (formato chileno)
            const tienePunto = cleaned.includes(".");
            const tieneComa = cleaned.includes(",");
            
            if (tienePunto && tieneComa) {
              // Tiene ambos: "5.500,50" -> punto es miles, coma es decimal
              cleaned = cleaned.replace(/\./g, "").replace(",", ".");
            } else if (tienePunto && !tieneComa) {
              // Solo punto: verificar si es miles o decimal
              const partes = cleaned.split(".");
              if (partes.length === 2 && partes[1].length <= 2) {
                // Probablemente es decimal: "5.5" o "5.50"
                // Mantener como está
              } else {
                // Probablemente es separador de miles: "5.500" o "1.234.567"
                cleaned = cleaned.replace(/\./g, "");
              }
            } else if (!tienePunto && tieneComa) {
              // Solo coma: verificar si es miles o decimal
              const partes = cleaned.split(",");
              if (partes.length === 2 && partes[1].length <= 2) {
                // Probablemente es decimal: "5,5" -> convertir a "5.5"
                cleaned = cleaned.replace(",", ".");
              } else {
                // Probablemente es separador de miles: "5,500" -> quitar comas
                cleaned = cleaned.replace(/,/g, "");
              }
            }
            
            const parsed = parseFloat(cleaned);
            return Number.isFinite(parsed) && !isNaN(parsed) ? parsed : 0;
          };

          // Parsear números
          const montoNetoRaw = row["Monto Neto"] ?? row["montoNeto"] ?? 0;
          const montoNeto = parseNumber(montoNetoRaw);

          const ivaRaw = row["IVA"] ?? row["iva"] ?? 0;
          const iva = parseNumber(ivaRaw);

          const montoTotalRaw = row["Monto Total"] ?? row["montoTotal"] ?? 0;
          let montoTotal = 0;
          if (montoTotalRaw instanceof Date) {
            const year = montoTotalRaw.getFullYear();
            if (year > 2100 || year < 1900) {
              // Es un número mal interpretado como fecha
              montoTotal = 0;
            } else {
              montoTotal = 0;
            }
          } else if (typeof montoTotalRaw === "number") {
            montoTotal = montoTotalRaw;
          } else if (montoTotalRaw !== null && montoTotalRaw !== undefined && montoTotalRaw !== "") {
            const strValue = String(montoTotalRaw).trim();
            const cleaned = strValue
              .replace(/[^\d.,-]/g, "")
              .replace(/\./g, "")
              .replace(",", ".");
            const parsed = Number(cleaned);
            montoTotal = Number.isFinite(parsed) && !isNaN(parsed) ? parsed : 0;
          }

          if (!idFactura) continue; // Saltar filas sin ID de factura

          facturasParsed.push({
            idFactura,
            localidad,
            numeroFactura,
            fechaEmision,
            fechaRecepcion,
            fechaVencimiento,
            rutEmisor,
            nombreEmisor,
            tipoDocumento,
            formaPago,
            fechaPago,
            condicionPago,
            montoNeto: Number.isFinite(montoNeto) ? montoNeto : 0,
            iva: Number.isFinite(iva) ? iva : 0,
            montoTotal: Number.isFinite(montoTotal) ? montoTotal : 0,
            observacion,
            linkFactura: linkFactura || undefined,
          });
        }

        if (!cancelled) setFacturas(facturasParsed);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error desconocido cargando facturas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sheetId, sheetFacturas]);

  return useMemo(() => ({ facturas, loading, error }), [facturas, loading, error]);
}

