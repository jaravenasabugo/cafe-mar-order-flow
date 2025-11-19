// Utilidades para leer Google Sheets publicados (sin credenciales) usando el endpoint GViz
// Requiere que el Google Sheet sea accesible públicamente ("Cualquiera con el enlace")

export interface GoogleSheetRow {
  [key: string]: string | number | Date | null;
}

// Convierte el JSON "GViz" a un arreglo de objetos basado en la primera fila como cabeceras
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

export async function fetchSheetRows(sheetId: string, sheetName: string): Promise<GoogleSheetRow[]> {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Error al leer Google Sheet: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  return gvizToRows(text);
}


