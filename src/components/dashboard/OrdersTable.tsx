import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { OrdenDashboard } from "@/types/dashboard";
import { parse, isValid, format } from "date-fns";
import { cn } from "@/lib/utils";

interface OrdersTableProps {
  ordenes: OrdenDashboard[];
}

type SortField = "numeroOrden" | "total_con_iva" | "fechaPedido" | null;
type SortDirection = "asc" | "desc";

export function OrdersTable({ ordenes }: OrdersTableProps) {
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Función para parsear fechas (acepta formato Date(...) de Google Sheets)
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    
    const trimmed = dateStr.trim();
    
    // Manejar formato "Date(year,month,day)" que viene de Google Sheets
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
    
    // Intentar diferentes formatos comunes
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
    
    // Si no funciona, intentar parse directo
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

  // Ordenar órdenes
  const sortedOrdenes = useMemo(() => {
    if (!sortField) return ordenes;

    return [...ordenes].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "numeroOrden":
          aValue = a.numeroOrden;
          bValue = b.numeroOrden;
          break;
        case "total_con_iva":
          aValue = a.total_con_iva;
          bValue = b.total_con_iva;
          break;
        case "fechaPedido":
          aValue = parseDate(a.fechaPedido)?.getTime() || 0;
          bValue = parseDate(b.fechaPedido)?.getTime() || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [ordenes, sortField, sortDirection]);

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

  if (ordenes.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No hay órdenes para los filtros seleccionados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tabla de Órdenes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th
                  className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("numeroOrden")}
                >
                  <div className="flex items-center">
                    Número de Orden
                    <SortIcon field="numeroOrden" />
                  </div>
                </th>
                <th className="text-left p-3 font-medium">Cafetería</th>
                <th className="text-left p-3 font-medium">Solicitante</th>
                <th className="text-left p-3 font-medium">Proveedor</th>
                <th
                  className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("total_con_iva")}
                >
                  <div className="flex items-center">
                    Total + IVA
                    <SortIcon field="total_con_iva" />
                  </div>
                </th>
                <th
                  className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort("fechaPedido")}
                >
                  <div className="flex items-center">
                    Fecha Pedido
                    <SortIcon field="fechaPedido" />
                  </div>
                </th>
                <th className="text-left p-3 font-medium">Estado</th>
                <th className="text-left p-3 font-medium">Observación</th>
                <th className="text-left p-3 font-medium">PDF Orden</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrdenes.map((orden, index) => (
                <tr
                  key={orden.numeroOrden}
                  className={cn(
                    "border-b hover:bg-muted/50",
                    index % 2 === 0 ? "bg-background" : "bg-muted/20"
                  )}
                >
                  <td className="p-3">{orden.numeroOrden}</td>
                  <td className="p-3">{orden.cafeteria || "-"}</td>
                  <td className="p-3">{orden.solicitante || "-"}</td>
                  <td className="p-3">{orden.proveedor || "-"}</td>
                  <td className="p-3">
                    ${orden.total_con_iva.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
                  </td>
                  <td className="p-3">{formatDate(orden.fechaPedido)}</td>
                  <td className="p-3">
                    {(() => {
                      const estado = (orden.estadoAprobacion || "Pendiente").toLowerCase();
                      let bgColor = "bg-yellow-100";
                      let textColor = "text-yellow-800";
                      
                      if (estado.includes("aprobada") || estado.includes("aprobado") || estado.includes("aprob")) {
                        bgColor = "bg-green-100";
                        textColor = "text-green-800";
                      } else if (estado.includes("rechazada") || estado.includes("rechazado") || estado.includes("rechaz")) {
                        bgColor = "bg-red-100";
                        textColor = "text-red-800";
                      } else {
                        // Pendiente por defecto (amarillo)
                        bgColor = "bg-yellow-100";
                        textColor = "text-yellow-800";
                      }
                      
                      return (
                        <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", bgColor, textColor)}>
                          {orden.estadoAprobacion || "Pendiente"}
                        </span>
                      );
                    })()}
                  </td>
                  <td className="p-3 max-w-xs truncate" title={orden.observacion}>
                    {orden.observacion || "-"}
                  </td>
                  <td className="p-3">
                    {orden.linkOrdenCompra && orden.linkOrdenCompra.trim() !== "" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(orden.linkOrdenCompra, "_blank")}
                        className="h-8"
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Ver PDF
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

