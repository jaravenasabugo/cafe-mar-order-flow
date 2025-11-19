import { useState, useMemo, useCallback } from "react";
import { useOrdenes } from "@/hooks/use-ordenes";
import { OrdenDashboard, OrdenFilters } from "@/types/dashboard";
import { OrdersFilters } from "@/components/dashboard/OrdersFilters";
import { OrdersSummaryCards } from "@/components/dashboard/OrdersSummaryCards";
import { OrdersCharts } from "@/components/dashboard/OrdersCharts";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parse, isValid } from "date-fns";

export default function DashboardGeneral() {
  const { ordenes, loading, error } = useOrdenes();
  const [activeTab, setActiveTab] = useState<"ordenes" | "facturas">("ordenes");
  const [filters, setFilters] = useState<OrdenFilters>({
    cafeteria: [],
    proveedor: [],
    estado: [],
    totalMin: null,
    totalMax: null,
    fechaInicio: null,
    fechaFin: null,
    numeroOrden: "",
  });

  // Función para limpiar todos los filtros
  const handleClearFilters = () => {
    setFilters({
      cafeteria: [],
      proveedor: [],
      estado: [],
      totalMin: null,
      totalMax: null,
      fechaInicio: null,
      fechaFin: null,
      numeroOrden: "",
    });
  };

  // Debug: mostrar información en consola
  console.log("DashboardGeneral - Estado:", { ordenes: ordenes.length, loading, error });

  // Función auxiliar para parsear fechas - acepta múltiples formatos
  const parseDate = useCallback((dateStr: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    
    const trimmed = dateStr.trim();
    
    // Manejar formato "Date(year,month,day)" que viene de Google Sheets
    // Ejemplo: "Date(2025,10,5)" donde month es 0-indexed (10 = noviembre)
    const dateMatch = trimmed.match(/^Date\((\d+),(\d+),(\d+)\)$/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10); // Ya viene como 0-indexed
      const day = parseInt(dateMatch[3], 10);
      const date = new Date(year, month, day);
      if (isValid(date) && !isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date;
      }
    }
    
    // Intentar parsear diferentes formatos, priorizando dd-MM-yyyy y dd/MM/yyyy
    // ya que es el formato más común en Chile
    const formats = [
      "dd-MM-yyyy",  // Prioridad: formato más común en Chile (18-11-2025)
      "dd/MM/yyyy",  // Formato alternativo (18/11/2025)
      "yyyy-MM-dd",  // Formato ISO estándar (2025-11-18)
      "yyyy/MM/dd",  // Formato ISO alternativo
      "MM/dd/yyyy",  // Formato americano
      "MM-dd-yyyy",  // Formato americano alternativo
    ];
    
    for (const fmt of formats) {
      try {
        const parsed = parse(trimmed, fmt, new Date());
        if (isValid(parsed)) {
          // Normalizar a medianoche para evitar problemas de hora
          parsed.setHours(0, 0, 0, 0);
          return parsed;
        }
      } catch {
        continue;
      }
    }
    
    // Si no funciona con formatos conocidos, intentar parse directo
    // Esto puede funcionar si Google Sheets devuelve un formato de fecha estándar
    try {
      const direct = new Date(trimmed);
      if (isValid(direct) && !isNaN(direct.getTime())) {
        direct.setHours(0, 0, 0, 0);
        return direct;
      }
    } catch {
      // Ignorar errores
    }
    
    // Log para depuración - solo en desarrollo
    if (import.meta.env.DEV) {
      console.warn(`No se pudo parsear la fecha: "${trimmed}"`);
    }
    
    return null;
  }, []);

  // Función para aplicar todos los filtros
  const applyFilters = (ordenes: OrdenDashboard[], filters: OrdenFilters): OrdenDashboard[] => {
    return ordenes.filter((orden) => {
      // Filtro por cafetería (múltiple)
      if (filters.cafeteria.length > 0 && !filters.cafeteria.includes(orden.cafeteria)) {
        return false;
      }

      // Filtro por proveedor (múltiple)
      if (filters.proveedor.length > 0 && !filters.proveedor.includes(orden.proveedor)) {
        return false;
      }

      // Filtro por estado (múltiple)
      if (filters.estado.length > 0) {
        const estadoOrden = (orden.estadoAprobacion || "Pendiente").trim();
        if (!filters.estado.includes(estadoOrden)) {
          return false;
        }
      }

      // Filtro por rango de total
      if (filters.totalMin !== null && orden.total_con_iva < filters.totalMin) {
        return false;
      }
      if (filters.totalMax !== null && orden.total_con_iva > filters.totalMax) {
        return false;
      }

      // Filtro por fecha
      if (filters.fechaInicio || filters.fechaFin) {
        const ordenDate = parseDate(orden.fechaPedido);
        if (!ordenDate) {
          // Si no se puede parsear la fecha, excluir la orden del filtro
          return false;
        }

        // Normalizar fechas a medianoche en hora local para comparación
        const normalizeDate = (date: Date): Date => {
          const normalized = new Date(date);
          normalized.setHours(0, 0, 0, 0);
          return normalized;
        };

        const ordenDateNormalized = normalizeDate(ordenDate);

        if (filters.fechaInicio) {
          // Parsear fecha en formato YYYY-MM-DD sin problemas de zona horaria
          const parts = filters.fechaInicio.split("-");
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const fechaInicio = normalizeDate(new Date(year, month, day));
            // Comparar solo las fechas (sin hora) - >= para incluir la fecha de inicio
            // Si la fecha de la orden es anterior a la fecha de inicio, excluir
            if (ordenDateNormalized.getTime() < fechaInicio.getTime()) {
              return false;
            }
          }
        }

        if (filters.fechaFin) {
          // Parsear fecha en formato YYYY-MM-DD sin problemas de zona horaria
          const parts = filters.fechaFin.split("-");
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const fechaFin = normalizeDate(new Date(year, month, day));
            // Comparar solo las fechas (sin hora) - <= para incluir la fecha de fin
            // Si la fecha de la orden es posterior a la fecha de fin, excluir
            if (ordenDateNormalized.getTime() > fechaFin.getTime()) {
              return false;
            }
          }
        }
      }

      // Filtro por número de orden (búsqueda parcial)
      if (filters.numeroOrden) {
        const searchTerm = filters.numeroOrden.toLowerCase();
        if (!orden.numeroOrden.toLowerCase().includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });
  };

  // Aplicar filtros usando useMemo para optimización
  const filteredOrdenes = useMemo(() => {
    const result = applyFilters(ordenes, filters);
    
    // Log para depuración - solo cuando hay filtros de fecha activos
    if (import.meta.env.DEV && (filters.fechaInicio || filters.fechaFin)) {
      console.log("Filtro de fechas activo:", {
        fechaInicio: filters.fechaInicio,
        fechaFin: filters.fechaFin,
        totalOrdenes: ordenes.length,
        ordenesFiltradas: result.length,
        ejemploFechas: ordenes.slice(0, 5).map(o => ({
          numeroOrden: o.numeroOrden,
          fechaPedido: o.fechaPedido,
          parseada: parseDate(o.fechaPedido)?.toISOString().split('T')[0]
        }))
      });
    }
    
    return result;
  }, [ordenes, filters, parseDate]);

  if (loading) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Cargando datos del dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error al cargar datos</h3>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Verifica que VITE_GOOGLE_SHEET_ID y VITE_SHEET_ORDENES estén configurados correctamente.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar mensaje si no hay órdenes
  if (!loading && ordenes.length === 0) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-3 text-foreground">
              Dashboard General
            </h1>
            <div className="h-1 w-24 bg-primary mb-4 mx-auto"></div>
            <p className="text-lg text-muted-foreground">
              Resumen de órdenes de compra y facturas
            </p>
          </div>
          <div className="rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No hay órdenes disponibles</h3>
            <p className="text-sm text-muted-foreground">
              No se encontraron órdenes en la hoja de Google Sheets.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Verifica que la hoja "{import.meta.env.VITE_SHEET_ORDENES || "Ordenes"}" tenga datos y que las columnas estén correctamente nombradas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-3 text-foreground">
            Dashboard General
          </h1>
          <div className="h-1 w-24 bg-primary mb-4 mx-auto"></div>
          <p className="text-lg text-muted-foreground">
            Resumen de órdenes de compra y facturas
          </p>
        </div>

        {/* Tabs para cambiar entre Órdenes y Facturas */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ordenes" | "facturas")} className="mb-6">
          <div className="flex justify-center">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="ordenes">Órdenes</TabsTrigger>
              <TabsTrigger value="facturas">Facturas</TabsTrigger>
            </TabsList>
          </div>

          {/* Contenido: Órdenes */}
          <TabsContent value="ordenes" className="mt-6">
            {/* Filtros */}
            <OrdersFilters
              ordenes={ordenes}
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
            />

            {/* Cards de resumen */}
            <OrdersSummaryCards ordenes={filteredOrdenes} />

            {/* Gráficos */}
            <OrdersCharts ordenes={filteredOrdenes} />

            {/* Tabla */}
            <OrdersTable ordenes={filteredOrdenes} />
          </TabsContent>

          {/* Contenido: Facturas (Placeholder) */}
          <TabsContent value="facturas" className="mt-6">
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                Próximamente dashboard de facturas
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Esta sección estará disponible en una futura actualización
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

