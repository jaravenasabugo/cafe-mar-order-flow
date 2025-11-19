import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FacturaDashboard } from "@/types/dashboard";
import { FileText, DollarSign, Receipt } from "lucide-react";

interface InvoicesSummaryCardsProps {
  facturas: FacturaDashboard[];
}

export function InvoicesSummaryCards({ facturas }: InvoicesSummaryCardsProps) {
  const cantidadFacturas = facturas.length;
  const montoTotal = facturas.reduce((sum, factura) => sum + factura.montoTotal, 0);
  const ivaTotal = facturas.reduce((sum, factura) => sum + factura.iva, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card: Cantidad de Facturas */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cantidad de Facturas</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{cantidadFacturas}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Facturas en el rango seleccionado
          </p>
        </CardContent>
      </Card>

      {/* Card: Monto Total Facturado */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Monto Total Facturado</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${montoTotal.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total con IVA incluido
          </p>
        </CardContent>
      </Card>

      {/* Card: IVA Total */}
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">IVA Total</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${ivaTotal.toLocaleString("es-CL", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Suma de IVA de todas las facturas
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

