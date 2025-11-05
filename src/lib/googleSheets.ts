// Utilidades para leer Google Sheets publicados (sin credenciales) usando el endpoint GViz
// Requiere que el Google Sheet sea accesible públicamente ("Cualquiera con el enlace")

export interface GoogleSheetRow {
  [key: string]: string | number | null;
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
      if (typeof value === "string") value = value.trim();
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


