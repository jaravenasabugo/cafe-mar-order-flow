// Utilidades para leer Google Sheets usando la API oficial de Google Sheets
// con autenticación mediante cuenta de servicio (recomendado)
// También soporta el método legacy GViz para hojas públicas

export interface GoogleSheetRow {
  [key: string]: string | number | Date | null;
}

// Convierte el JSON "GViz" a un arreglo de objetos basado en la primera fila como cabeceras
// (Método legacy - solo se usa si la API oficial no está disponible)
function gvizToRows(gvizText: string): GoogleSheetRow[] {
  // La respuesta de GViz viene como: google.visualization.Query.setResponse({...})
  const jsonText = gvizText
    .replace(/^.*setResponse\(/s, "")
    .replace(/\);\s*$/s, "");

  const data = JSON.parse(jsonText);
  const cols = (data.table?.cols || []).map((c: any) => (c.label || c.id || "").toString().trim());
  const rows = data.table?.rows || [];

  return rows.map((r: any) => {
    const obj: GoogleSheetRow = {};
    r.c?.forEach((cell: any, idx: number) => {
      const key = cols[idx] || `col_${idx}`;
      let value: any = cell?.v ?? null;
      
      // Verificar el tipo de columna desde la metadata
      const colType = data.table?.cols?.[idx]?.type;
      
      // Si el valor es un número y tiene formato (cell.f), puede ser fecha o número con formato
      if (cell?.f && typeof cell.v === "number") {
        // Si el tipo de columna es "date" o "datetime", convertir a Date
        // Si el tipo es "number", preservar como número (puede tener formato de moneda)
        if (colType === "date" || colType === "datetime") {
          // Google Sheets almacena fechas como días desde 1899-12-30 (epoch de Google Sheets)
          // Convertir a milisegundos desde epoch de JavaScript (1970-01-01)
          // 25569 es el número de días entre 1899-12-30 y 1970-01-01
          const dateValue = (cell.v - 25569) * 86400 * 1000;
          const date = new Date(dateValue);
          // Verificar si la fecha resultante es razonable (entre 1900 y 2100)
          // Si no, probablemente es un número mal interpretado como fecha
          const year = date.getFullYear();
          if (year >= 1900 && year <= 2100) {
            value = date;
          } else {
            // Es un número mal interpretado como fecha, preservar el valor numérico
            value = cell.v;
          }
        } else {
          // Es un número con formato (moneda, porcentaje, etc.), preservar como número
          value = cell.v;
        }
      } else if (value instanceof Date) {
        // Ya es un objeto Date
        value = value;
      } else if (typeof value === "string") {
        value = value.trim();
      }
      
      obj[key] = value;
    });
    return obj;
  });
}

/**
 * Obtiene filas de una hoja de Google Sheets usando la API oficial con cuenta de servicio
 * @param sheetId - ID de la hoja de cálculo de Google Sheets
 * @param sheetName - Nombre de la hoja dentro del documento
 * @returns Array de objetos donde cada objeto representa una fila con las columnas como propiedades
 */
export async function fetchSheetRows(sheetId: string, sheetName: string): Promise<GoogleSheetRow[]> {
  // Intentar usar la API oficial primero (si está configurada)
  const useApiEndpoint = import.meta.env.VITE_USE_GOOGLE_SHEETS_API !== 'false';
  
  if (useApiEndpoint) {
    try {
      // Determinar la URL base de la API
      // En desarrollo, usar el proxy de Vite o la URL completa
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      const apiUrl = `${apiBaseUrl}/get-sheet-data`;
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sheetId, sheetName }),
        cache: 'no-store',
      });

      if (!response.ok) {
        // Intentar obtener el mensaje de error del servidor
        let errorMessage = `Error ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('Error del servidor:', errorData);
        } catch {
          // Si no se puede parsear como JSON, usar el texto
          const errorText = await response.text();
          console.error('Error del servidor (texto):', errorText);
        }
        
        // Si falla la API oficial, intentar con el método legacy si está permitido
        if (import.meta.env.VITE_FALLBACK_TO_GVIZ === 'true') {
          console.warn('La API oficial falló, usando método legacy GViz');
          return fetchSheetRowsLegacy(sheetId, sheetName);
        }
        
        // Si es un error 500, puede ser que el servidor no esté ejecutándose
        if (response.status === 500) {
          throw new Error(`${errorMessage}\n💡 Asegúrate de que el servidor esté ejecutándose: npm run dev:serverless`);
        }
        
        throw new Error(`Error al leer Google Sheet: ${errorMessage}`);
      }

      const data = await response.json();
      return data.rows || [];
    } catch (error) {
      // Si es un error de conexión, puede ser que el servidor no esté ejecutándose
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error(`No se pudo conectar al servidor. Asegúrate de que esté ejecutándose: npm run dev:serverless\nError original: ${error.message}`);
      }
      
      // Si hay un error y está permitido el fallback, usar método legacy
      if (import.meta.env.VITE_FALLBACK_TO_GVIZ === 'true') {
        console.warn('Error con la API oficial, usando método legacy GViz:', error);
        return fetchSheetRowsLegacy(sheetId, sheetName);
      }
      throw error;
    }
  } else {
    // Usar método legacy directamente
    return fetchSheetRowsLegacy(sheetId, sheetName);
  }
}

/**
 * Método legacy: Obtiene filas usando el endpoint GViz público
 * Requiere que el Google Sheet sea accesible públicamente ("Cualquiera con el enlace")
 */
async function fetchSheetRowsLegacy(sheetId: string, sheetName: string): Promise<GoogleSheetRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Error al leer Google Sheet: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  return gvizToRows(text);
}


