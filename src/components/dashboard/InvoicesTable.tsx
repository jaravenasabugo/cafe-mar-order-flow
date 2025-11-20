import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, X, ExternalLink } from "lucide-react";
import { FacturaDashboard, DetalleFactura } from "@/types/dashboard";
import { parse, isValid, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
// Usaremos tabla HTML normal como en OrdersTable

interface InvoicesTableProps {
  facturas: FacturaDashboard[];
  detalles: DetalleFactura[];
  getDetallesByFacturaId?: (idFactura: string) => DetalleFactura[];
}

type SortField = "numeroFactura" | "montoTotal" | "fechaEmision" | null;
type SortDirection = "asc" | "desc";

export function InvoicesTable({ facturas, detalles, getDetallesByFacturaId }: InvoicesTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [selectedFacturaId, setSelectedFacturaId] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Función para parsear fechas
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    
    const trimmed = dateStr.trim();
    
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
    
    const formats = ["yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy", "yyyy/MM/dd"];
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
    
    const direct = new Date(trimmed);
    if (isValid(direct) && !isNaN(direct.getTime())) {
      direct.setHours(0, 0, 0, 0);
      return direct;
    }
    
    return null;
  };

  // Formatear fecha para mostrar
  const formatDate = (dateStr: string): string => {
    const date = parseDate(dateStr);
    if (!date) return dateStr;
    return format(date, "dd/MM/yyyy");
  };

  // Ordenar facturas
  const sortedFacturas = useMemo(() => {
    if (!sortField) return facturas;

    return [...facturas].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "numeroFactura":
          aValue = a.numeroFactura;
          bValue = b.numeroFactura;
          break;
        case "montoTotal":
          aValue = a.montoTotal;
          bValue = b.montoTotal;
          break;
        case "fechaEmision":
          aValue = parseDate(a.fechaEmision)?.getTime() || 0;
          bValue = parseDate(b.fechaEmision)?.getTime() || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [facturas, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  // Obtener detalles de la factura seleccionada
  const detallesFactura = useMemo(() => {
    if (!selectedFacturaId) return [];
    if (getDetallesByFacturaId) {
      return getDetallesByFacturaId(selectedFacturaId);
    }
    return detalles.filter((d) => d.idFactura === selectedFacturaId);
  }, [selectedFacturaId, getDetallesByFacturaId, detalles]);

  if (facturas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No hay facturas para los filtros seleccionados
          </p>
        </CardContent>
      </Card>
    );
  }

  // Vista de tarjetas para móvil
  if (isMobile) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Facturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedFacturas.map((factura) => {
                const isPagada = factura.fechaPago && factura.fechaPago.trim() !== "";
                return (
                  <Card key={factura.idFactura} className="p-4">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">Factura #{factura.numeroFactura}</h3>
                          <p className="text-sm text-muted-foreground">{formatDate(factura.fechaEmision)}</p>
                        </div>
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                          isPagada ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                        )}>
                          {isPagada ? "Pagada" : "Pendiente"}
                        </span>
                      </div>

                      {/* Información principal */}
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Localidad:</span>
                          <span className="text-sm font-medium">{factura.localidad || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Emisor:</span>
                          <span className="text-sm font-medium">{factura.nombreEmisor || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">RUT:</span>
                          <span className="text-sm font-medium">{factura.rutEmisor || "-"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Tipo:</span>
                          <span className="text-sm font-medium">{factura.tipoDocumento || "-"}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm font-semibold text-muted-foreground">Monto Total:</span>
                          <span className="text-sm font-bold">
                            ${factura.montoTotal.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>

                      {/* Observación */}
                      {factura.observacion && (
                        <div className="border-t pt-2">
                          <p className="text-xs text-muted-foreground mb-1">Observación:</p>
                          <p className="text-sm">{factura.observacion}</p>
                        </div>
                      )}

                      {/* Botones de acción */}
                      <div className="border-t pt-2 space-y-2">
                        {factura.linkFactura && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(factura.linkFactura, '_blank', 'noopener,noreferrer')}
                            className="w-full"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Ver Factura
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedFacturaId(factura.idFactura)}
                          className="w-full"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalle
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Modal de detalles para móvil */}
        <Dialog open={selectedFacturaId !== null} onOpenChange={(open) => !open && setSelectedFacturaId(null)}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalle de Factura</DialogTitle>
              <DialogDescription>
                {selectedFacturaId && sortedFacturas.find(f => f.idFactura === selectedFacturaId)?.numeroFactura}
              </DialogDescription>
            </DialogHeader>
            {detallesFactura.length > 0 ? (
              <div className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Producto</th>
                        <th className="text-right p-3 font-medium">Cantidad</th>
                        <th className="text-right p-3 font-medium">Precio Unitario</th>
                        <th className="text-right p-3 font-medium">Precio Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detallesFactura.map((detalle, index) => (
                        <tr key={index} className="border-b hover:bg-muted/50">
                          <td className="p-3">{detalle.producto}</td>
                          <td className="p-3 text-right">{detalle.cantidad}</td>
                          <td className="p-3 text-right">
                            ${detalle.precioUnitario.toLocaleString("es-CL")}
                          </td>
                          <td className="p-3 text-right font-medium">
                            ${detalle.precioTotal.toLocaleString("es-CL")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end pt-2 border-t">
                  <p className="text-sm font-semibold">
                    Total: ${detallesFactura.reduce((sum, d) => sum + d.precioTotal, 0).toLocaleString("es-CL")}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No hay detalles disponibles para esta factura
              </p>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Vista de tabla para desktop
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Tabla de Facturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th
                    className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("numeroFactura")}
                  >
                    <div className="flex items-center">
                      Número de Factura
                      <SortIcon field="numeroFactura" />
                    </div>
                  </th>
                  <th className="text-left p-3 font-medium">Localidad</th>
                  <th className="text-left p-3 font-medium">Nombre Emisor</th>
                  <th className="text-left p-3 font-medium">RUT Emisor</th>
                  <th className="text-left p-3 font-medium">Tipo Documento</th>
                  <th
                    className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("montoTotal")}
                  >
                    <div className="flex items-center">
                      Monto Total
                      <SortIcon field="montoTotal" />
                    </div>
                  </th>
                  <th
                    className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSort("fechaEmision")}
                  >
                    <div className="flex items-center">
                      Fecha Emisión
                      <SortIcon field="fechaEmision" />
                    </div>
                  </th>
                  <th className="text-left p-3 font-medium">Fecha Vencimiento</th>
                  <th className="text-left p-3 font-medium">Forma de Pago</th>
                  <th className="text-left p-3 font-medium">Condición de Pago</th>
                  <th className="text-left p-3 font-medium">Fecha Pago</th>
                  <th className="text-left p-3 font-medium">Observación</th>
                  <th className="text-left p-3 font-medium">Link Factura</th>
                  <th className="text-left p-3 font-medium">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {sortedFacturas.map((factura, index) => {
                  const isPagada = factura.fechaPago && factura.fechaPago.trim() !== "";
                  return (
                    <tr
                      key={factura.idFactura}
                      className={cn(
                        "border-b hover:bg-muted/50",
                        index % 2 === 0 ? "bg-background" : "bg-muted/20"
                      )}
                    >
                      <td className="p-3">{factura.numeroFactura}</td>
                      <td className="p-3">{factura.localidad || "-"}</td>
                      <td className="p-3">{factura.nombreEmisor || "-"}</td>
                      <td className="p-3">{factura.rutEmisor || "-"}</td>
                      <td className="p-3">{factura.tipoDocumento || "-"}</td>
                      <td className="p-3">
                        ${factura.montoTotal.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="p-3">{formatDate(factura.fechaEmision)}</td>
                      <td className="p-3">{formatDate(factura.fechaVencimiento)}</td>
                      <td className="p-3">{factura.formaPago || "-"}</td>
                      <td className="p-3">{factura.condicionPago || "-"}</td>
                      <td className="p-3">
                        {isPagada ? formatDate(factura.fechaPago!) : "Pendiente"}
                      </td>
                      <td className="p-3 max-w-xs truncate" title={factura.observacion}>
                        {factura.observacion || "-"}
                      </td>
                      <td className="p-3">
                        {factura.linkFactura ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(factura.linkFactura, '_blank', 'noopener,noreferrer')}
                            className="h-8"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFacturaId(factura.idFactura)}
                          className="h-8"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver Detalle
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de detalles para desktop */}
      <Dialog open={selectedFacturaId !== null} onOpenChange={(open) => !open && setSelectedFacturaId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Factura</DialogTitle>
            <DialogDescription>
              {selectedFacturaId && sortedFacturas.find(f => f.idFactura === selectedFacturaId)?.numeroFactura}
            </DialogDescription>
          </DialogHeader>
          {detallesFactura.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Producto</th>
                      <th className="text-right p-3 font-medium">Cantidad</th>
                      <th className="text-right p-3 font-medium">Precio Unitario</th>
                      <th className="text-right p-3 font-medium">Precio Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detallesFactura.map((detalle, index) => (
                      <tr key={index} className="border-b hover:bg-muted/50">
                        <td className="p-3">{detalle.producto}</td>
                        <td className="p-3 text-right">{detalle.cantidad}</td>
                        <td className="p-3 text-right">
                          ${detalle.precioUnitario.toLocaleString("es-CL")}
                        </td>
                        <td className="p-3 text-right font-medium">
                          ${detalle.precioTotal.toLocaleString("es-CL")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end pt-2 border-t">
                <p className="text-sm font-semibold">
                  Total: ${detallesFactura.reduce((sum, d) => sum + d.precioTotal, 0).toLocaleString("es-CL")}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No hay detalles disponibles para esta factura
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

