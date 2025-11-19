import { useEffect, useMemo, useState } from "react";
import { fetchSheetRows } from "@/lib/googleSheets";

export interface Encargado {
  nombre: string;
  mail: string;
  local: string;
}

interface UseEncargadosResult {
  encargados: Encargado[];
  loading: boolean;
  error: string | null;
  getEncargadoByEmail: (email: string) => Encargado | undefined;
}

// Estructura esperada en Google Sheets:
// Hoja de Encargados: columnas -> Nombre, Mail, Local
export function useEncargados(): UseEncargadosResult {
  const [encargados, setEncargados] = useState<Encargado[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const sheetId = import.meta.env.VITE_GOOGLE_SHEET_ID as string | undefined;
  const sheetEncargados = (import.meta.env.VITE_SHEET_ENCARGADOS as string | undefined) || "Encargados";

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

        const encargadoRows = await fetchSheetRows(sheetId, sheetEncargados);

        // Parsear encargados con columnas Nombre, Mail y Local
        const encargadosParsed: Encargado[] = [];
        for (const row of encargadoRows) {
          const nombre = String((row["Nombre"] ?? row["nombre"] ?? "")).trim();
          const mail = String((row["Mail"] ?? row["mail"] ?? row["Email"] ?? row["email"] ?? "")).trim().toLowerCase();
          const local = String((row["Local"] ?? row["local"] ?? "")).trim();
          
          if (!nombre || !mail) continue;
          
          encargadosParsed.push({ nombre, mail, local: local || "General" });
        }

        if (!cancelled) setEncargados(encargadosParsed);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Error desconocido cargando encargados");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [sheetId, sheetEncargados]);

  const getEncargadoByEmail = useMemo(() => {
    return (email: string): Encargado | undefined => {
      const emailLower = email.toLowerCase().trim();
      return encargados.find((encargado) => encargado.mail === emailLower);
    };
  }, [encargados]);

  return useMemo(
    () => ({ encargados, loading, error, getEncargadoByEmail }),
    [encargados, loading, error, getEncargadoByEmail]
  );
}

