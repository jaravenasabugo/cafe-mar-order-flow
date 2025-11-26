import { useEffect, useMemo, useState } from "react";
import { fetchSheetRows } from "@/lib/googleSheets";
import { Product, Provider } from "@/types/order";

interface UseProvidersResult {
  providers: Provider[];
  loading: boolean;
  error: string | null;
}

// Estructura esperada en Google Sheets:
// Hoja de Proveedores: columnas -> id, nombre
// Hoja de Productos: columnas -> provider_id, nombre, unidad, precio_unitario
export function useProviders(): UseProvidersResult {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID as string | undefined;
  // Nombres por defecto según tu estructura
  const sheetProviders = (import.meta.env.VITE_SHEET_PROVIDERS as string | undefined) || "Provveedores";
  const sheetProducts = (import.meta.env.VITE_SHEET_PRODUCTS as string | undefined) || "Base productos";

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

        const [providerRows, productRows] = await Promise.all([
          fetchSheetRows(sheetId, sheetProviders),
          fetchSheetRows(sheetId, sheetProducts),
        ]);

        // Helper para generar un id legible desde nombre
        const slugify = (s: string) => s
          .toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        // Parsear proveedores con tus encabezados personalizados y asegurar ids únicos
        const usedIds = new Set<string>();
        const providersParsedRaw: Provider[] = [];
        for (const row of providerRows) {
          const nombre = String((row["nombre_proveedor"] ?? row["nombre"] ?? "")).trim();
          if (!nombre) continue;
          let id = String((row["id_proveedor"] ?? row["id"] ?? "")).trim();
          if (!id) id = slugify(nombre);
          let uniqueId = id;
          let suffix = 1;
          while (usedIds.has(uniqueId)) {
            uniqueId = `${id}-${suffix++}`;
          }
          usedIds.add(uniqueId);
          providersParsedRaw.push({ id: uniqueId, nombre, productos: [] });
        }

        // Mapa nombre → id para poder asociar productos por nombre de proveedor
        const providerNameToId = new Map<string, string>();
        for (const p of providersParsedRaw) {
          providerNameToId.set(p.nombre.toLowerCase(), p.id);
        }

        // Indexar productos por provider_id resuelto desde nombre o por provider_id directo si existe
        const providerIdToProducts = new Map<string, Product[]>();
        for (const row of productRows) {
          const providerName = String((row["Proveedor"] ?? "")).trim();
          const providerIdFromName = providerName ? (providerNameToId.get(providerName.toLowerCase()) || "") : "";
          const providerId = String((row["provider_id"] ?? providerIdFromName)).trim();
          if (!providerId) continue;

          const nombre = String((row["Producto"] ?? row["nombre"] ?? "")).trim();
          if (!nombre) continue;

          // Usamos "unidad" textual; si hay "Unidades por caja" lo reflejamos como descripción de unidad
          const unidadesPorCajaRaw = row["Unidades por caja"] ?? row["unidades_por_caja"];
          const unidadesPorCaja = typeof unidadesPorCajaRaw === "number" ? unidadesPorCajaRaw : Number(String(unidadesPorCajaRaw || "").replace(/[^0-9.,-]/g, "").replace(",", "."));
          const unidad = Number.isFinite(unidadesPorCaja) && unidadesPorCaja > 0 ? `caja x ${unidadesPorCaja}` : "unidad";

          const precioRaw = row["Precio unitario (CLP)"] ?? row["precio_unitario"];
          let precio_unitario: number;
          
          // Si ya es un número, usarlo directamente
          if (typeof precioRaw === "number" && !isNaN(precioRaw)) {
            precio_unitario = precioRaw;
          } else if (precioRaw === null || precioRaw === undefined || precioRaw === "") {
            precio_unitario = 0;
          } else {
            // Convertir string a número
            const precioStr = String(precioRaw).trim();
            
            if (precioStr === "" || precioStr === "-") {
              precio_unitario = 0;
            } else {
              // Remover caracteres no numéricos excepto punto, coma y signo negativo
              let cleaned = precioStr.replace(/[^0-9.,-]/g, "");
              
              // Detectar si tiene separadores de miles
              // En formato chileno: punto es separador de miles, coma es decimal
              // Ejemplos: "5.500" (miles), "5,5" (decimal), "5.500,50" (miles y decimal)
              
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
              
              precio_unitario = parseFloat(cleaned) || 0;
            }
          }

          const categoria = String((row["Categoria"] ?? row["categoria"] ?? "")).trim();

          const product: Product = { 
            nombre, 
            unidad, 
            precio_unitario: Number.isFinite(precio_unitario) ? precio_unitario : 0,
            categoria: categoria || undefined
          };
          const list = providerIdToProducts.get(providerId) || [];
          list.push(product);
          providerIdToProducts.set(providerId, list);
        }

        // Unir productos a proveedores
        const providersParsed: Provider[] = providersParsedRaw.map((p) => ({
          ...p,
          productos: providerIdToProducts.get(p.id) || [],
        }));

        if (!cancelled) setProviders(providersParsed);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error desconocido cargando datos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sheetId, sheetProviders, sheetProducts]);

  return useMemo(() => ({ providers, loading, error }), [providers, loading, error]);
}


