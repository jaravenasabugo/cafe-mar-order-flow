import { Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SelectedProduct } from "@/types/order";

interface OrderSummaryProps {
  products: SelectedProduct[];
  total: number;
}

export const OrderSummary = ({ products, total }: OrderSummaryProps) => {
  if (products.length === 0) return null;

  return (
    <Card className="p-6 bg-card border-primary/30 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-5 h-5 text-primary" />
        <h3 className="text-xl font-serif text-foreground">Resumen del Pedido</h3>
      </div>
      
      <div className="space-y-3">
        {products.map((product) => (
          <div key={product.nombre} className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {product.nombre} × {product.cantidad}
            </span>
            <span className="font-medium text-foreground">
              ${product.subtotal.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>
      
      <Separator className="my-4 bg-border" />
      
      <div className="flex justify-between items-center">
        <span className="text-lg font-serif text-foreground">Total</span>
        <span className="text-2xl font-bold text-primary">
          ${total.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
        </span>
      </div>
    </Card>
  );
};
