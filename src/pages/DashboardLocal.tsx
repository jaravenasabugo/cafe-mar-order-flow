import { useState, useMemo, useCallback } from "react";
import { useOrdenes } from "@/hooks/use-ordenes";
import { useFacturas } from "@/hooks/use-facturas";
import { useDetallesFacturas } from "@/hooks/use-detalles-facturas";
import { OrdenDashboard, OrdenFilters, FacturaDashboard, FacturaFilters } from "@/types/dashboard";
import { OrdersFilters } from "@/components/dashboard/OrdersFilters";
import { OrdersSummaryCards } from "@/components/dashboard/OrdersSummaryCards";
import { OrdersCharts } from "@/components/dashboard/OrdersCharts";
import { OrdersTable } from "@/components/dashboard/OrdersTable";
import { InvoicesFilters } from "@/components/dashboard/InvoicesFilters";
import { InvoicesSummaryCards } from "@/components/dashboard/InvoicesSummaryCards";
import { InvoicesCharts } from "@/components/dashboard/InvoicesCharts";
import { InvoicesTable } from "@/components/dashboard/InvoicesTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parse, isValid } from "date-fns";

interface DashboardLocalProps {
  local: string; // "Cordillera", "HM", o "FACH"
}

export default function DashboardLocal({ local }: DashboardLocalProps) {
  const { ordenes, loading, error } = useOrdenes();
  const { facturas: facturasRaw, loading: loadingFacturas, error: errorFacturas } = useFacturas();
  const { detalles: detallesFacturas, loading: loadingDetalles, getDetallesByFacturaId } = useDetallesFacturas();
  
  const [activeTab, setActiveTab] = useState<"ordenes" | "facturas">("ordenes");
  
  // Filtrar órdenes por el local del usuario (automáticamente)
  const ordenesDelLocal = useMemo(() => {
    return ordenes.filter((orden) => orden.cafeteria === local);
  }, [ordenes, local]);

  // Filtrar facturas por el local del usuario (automáticamente)
  const facturasDelLocal = useMemo(() => {
    return facturasRaw.filter((factura) => factura.localidad === local);
  }, [facturasRaw, local]);

  const [filters, setFilters] = useState<OrdenFilters>({
    cafeteria: [], // No se usa, pero se mantiene para compatibilidad
    proveedor: [],
    estado: [],
    totalMin: null,
    totalMax: null,
    fechaInicio: null,
    fechaFin: null,
    numeroOrden: "",
  });

  // Filtros para facturas
  const [invoiceFilters, setInvoiceFilters] = useState<FacturaFilters>({
    localidad: [], // No se usa para encargados, pero se mantiene para compatibilidad
    nombreEmisor: [],
    tipoDocumento: [],
    formaPago: [],
    condicionPago: [],
    montoMin: null,
    montoMax: null,
    fechaInicio: null,
    fechaFin: null,
    tipoFecha: "emision",
    busqueda: "",
  });

  // Función para limpiar todos los filtros de órdenes
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

  // Función para limpiar todos los filtros de facturas
  const handleClearInvoiceFilters = () => {
    setInvoiceFilters({
      localidad: [],
      nombreEmisor: [],
      tipoDocumento: [],
      formaPago: [],
      condicionPago: [],
      montoMin: null,
      montoMax: null,
      fechaInicio: null,
      fechaFin: null,
      tipoFecha: "emision",
      busqueda: "",
    });
  };

  // Función auxiliar para parsear fechas - acepta múltiples formatos
  const parseDate = useCallback((dateStr: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    
    const trimmed = dateStr.trim();
    
    // Manejar formato "Date(year,month,day)" que viene de Google Sheets
    const dateMatch = trimmed.match(/^Date\((\d+),(\d+),(\d+)\)$/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      const day = parseInt(dateMatch[3], 10);
      const date = new Date(year, month, day);
      if (isValid(date) && !isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date;
      }
    }
    
    const formats = [
      "dd-MM-yyyy",
      "dd/MM/yyyy",
      "yyyy-MM-dd",
      "yyyy/MM/dd",
      "MM/dd/yyyy",
      "MM-dd-yyyy",
    ];
    
    for (const fmt of formats) {
      try {
        const parsed = parse(trimmed, fmt, new Date());
        if (isValid(parsed)) {
          parsed.setHours(0, 0, 0, 0);
          return parsed;
        }
      } catch {
        continue;
      }
    }
    
    try {
      const direct = new Date(trimmed);
      if (isValid(direct) && !isNaN(direct.getTime())) {
        direct.setHours(0, 0, 0, 0);
        return direct;
      }
    } catch {
      // Ignorar errores
    }
    
    return null;
  }, []);

  // Función para aplicar todos los filtros (sin filtro de cafetería ya que está pre-filtrado)
  const applyFilters = (ordenes: OrdenDashboard[], filters: OrdenFilters): OrdenDashboard[] => {
    return ordenes.filter((orden) => {
      // No aplicar filtro de cafetería ya que las órdenes ya están filtradas por local

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
          return false;
        }

        const normalizeDate = (date: Date): Date => {
          const normalized = new Date(date);
          normalized.setHours(0, 0, 0, 0);
          return normalized;
        };

        const ordenDateNormalized = normalizeDate(ordenDate);

        if (filters.fechaInicio) {
          const parts = filters.fechaInicio.split("-");
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const fechaInicio = normalizeDate(new Date(year, month, day));
            if (ordenDateNormalized.getTime() < fechaInicio.getTime()) {
              return false;
            }
          }
        }

        if (filters.fechaFin) {
          const parts = filters.fechaFin.split("-");
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const fechaFin = normalizeDate(new Date(year, month, day));
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

  // Función para aplicar filtros de facturas
  const applyInvoiceFilters = useCallback((facturas: FacturaDashboard[], filters: FacturaFilters): FacturaDashboard[] => {
    return facturas.filter((factura) => {
      // No aplicar filtro de localidad ya que las facturas ya están filtradas por local

      // Filtro por emisor (múltiple)
      if (filters.nombreEmisor.length > 0 && !filters.nombreEmisor.includes(factura.nombreEmisor)) {
        return false;
      }

      // Filtro por tipo de documento (múltiple)
      if (filters.tipoDocumento.length > 0 && !filters.tipoDocumento.includes(factura.tipoDocumento)) {
        return false;
      }

      // Filtro por forma de pago (múltiple)
      if (filters.formaPago.length > 0 && !filters.formaPago.includes(factura.formaPago)) {
        return false;
      }

      // Filtro por condición de pago (múltiple)
      if (filters.condicionPago.length > 0 && !filters.condicionPago.includes(factura.condicionPago)) {
        return false;
      }

      // Filtro por rango de monto
      if (filters.montoMin !== null && factura.montoTotal < filters.montoMin) {
        return false;
      }
      if (filters.montoMax !== null && factura.montoTotal > filters.montoMax) {
        return false;
      }

      // Filtro por fecha (según tipoFecha)
      if (filters.fechaInicio || filters.fechaFin) {
        let fechaFactura: string;
        switch (filters.tipoFecha) {
          case "recepcion":
            fechaFactura = factura.fechaRecepcion;
            break;
          case "vencimiento":
            fechaFactura = factura.fechaVencimiento;
            break;
          default:
            fechaFactura = factura.fechaEmision;
        }

        const facturaDate = parseDate(fechaFactura);
        if (!facturaDate) {
          return false;
        }

        const normalizeDate = (date: Date): Date => {
          const normalized = new Date(date);
          normalized.setHours(0, 0, 0, 0);
          return normalized;
        };

        const facturaDateNormalized = normalizeDate(facturaDate);

        if (filters.fechaInicio) {
          const parts = filters.fechaInicio.split("-");
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const fechaInicio = normalizeDate(new Date(year, month, day));
            if (facturaDateNormalized.getTime() < fechaInicio.getTime()) {
              return false;
            }
          }
        }

        if (filters.fechaFin) {
          const parts = filters.fechaFin.split("-");
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const fechaFin = normalizeDate(new Date(year, month, day));
            if (facturaDateNormalized.getTime() > fechaFin.getTime()) {
              return false;
            }
          }
        }
      }

      // Filtro por búsqueda (número de factura o RUT)
      if (filters.busqueda) {
        const searchTerm = filters.busqueda.toLowerCase();
        const matchNumero = factura.numeroFactura.toLowerCase().includes(searchTerm);
        const matchRut = factura.rutEmisor.toLowerCase().includes(searchTerm);
        if (!matchNumero && !matchRut) {
          return false;
        }
      }

      return true;
    });
  }, [parseDate]);

  // Aplicar filtros usando useMemo para optimización
  const filteredOrdenes = useMemo(() => {
    return applyFilters(ordenesDelLocal, filters);
  }, [ordenesDelLocal, filters, parseDate]);

  // Aplicar filtros de facturas
  const filteredFacturas = useMemo(() => {
    return applyInvoiceFilters(facturasDelLocal, invoiceFilters);
  }, [facturasDelLocal, invoiceFilters, applyInvoiceFilters]);

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
  if (!loading && ordenesDelLocal.length === 0) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-3 text-foreground">
              Dashboard - {local}
            </h1>
            <div className="h-1 w-24 bg-primary mb-4 mx-auto"></div>
            <p className="text-lg text-muted-foreground">
              Resumen de órdenes de compra y facturas
            </p>
          </div>
          <div className="rounded-lg border border-dashed p-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No hay órdenes disponibles</h3>
            <p className="text-sm text-muted-foreground">
              No se encontraron órdenes para el local {local}.
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
            Dashboard - {local}
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
            {/* Filtros - Sin filtro de cafetería */}
            <OrdersFilters
              ordenes={ordenesDelLocal}
              filters={filters}
              onFiltersChange={setFilters}
              onClearFilters={handleClearFilters}
              hideCafeteriaFilter={true}
            />

            {/* Cards de resumen */}
            <OrdersSummaryCards ordenes={filteredOrdenes} />

            {/* Gráficos - Sin gráficos de cafetería ni de estado */}
            <OrdersCharts 
              ordenes={filteredOrdenes} 
              hideCafeteriaCharts={true}
              hideEstadoChart={true}
            />

            {/* Tabla */}
            <OrdersTable ordenes={filteredOrdenes} />
          </TabsContent>

          {/* Contenido: Facturas */}
          <TabsContent value="facturas" className="mt-6">
            {/* Filtros */}
            <InvoicesFilters
              facturas={facturasDelLocal}
              filters={invoiceFilters}
              onFiltersChange={setInvoiceFilters}
              onClearFilters={handleClearInvoiceFilters}
              hideLocalidadFilter={true}
              localidadesDisponibles={[local]}
            />

            {/* Cards de resumen */}
            <InvoicesSummaryCards facturas={filteredFacturas} />

            {/* Gráficos */}
            <InvoicesCharts 
              facturas={filteredFacturas} 
              hideLocalidadCharts={true}
            />

            {/* Tabla */}
            <InvoicesTable 
              facturas={filteredFacturas} 
              detalles={detallesFacturas}
              getDetallesByFacturaId={getDetallesByFacturaId}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

