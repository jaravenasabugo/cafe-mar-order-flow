import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrdenDashboard } from "@/types/dashboard";
import { FileText, DollarSign } from "lucide-react";

interface OrdersSummaryCardsProps {
  ordenes: OrdenDashboard[];
}

export function OrdersSummaryCards({ ordenes }: OrdersSummaryCardsProps) {
  const cantidadOrdenes = ordenes.length;
  const valorTotal = ordenes.reduce((sum, orden) => sum + orden.total_con_iva, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Card: Cantidad de Órdenes */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cantidad de Órdenes</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cantidadOrdenes}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Órdenes en el rango seleccionado
          </p>
        </CardContent>
      </Card>

      {/* Card: Valor Total */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor Total de Órdenes</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${valorTotal.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total con IVA incluido
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

