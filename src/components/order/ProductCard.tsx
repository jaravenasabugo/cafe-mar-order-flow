import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Product } from "@/types/order";

interface ProductCardProps {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export const ProductCard = ({ product, quantity, onQuantityChange }: ProductCardProps) => {
  const handleDecrease = () => {
    if (quantity > 0) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    onQuantityChange(quantity + 1);
  };

  const subtotal = quantity * product.precio_unitario;

  return (
    <Card 
      className={`p-4 bg-card border-border transition-all duration-300 hover:border-primary ${
        quantity > 0 ? 'ring-2 ring-primary/50' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <h4 className="font-medium text-foreground">{product.nombre}</h4>
          <p className="text-sm text-muted-foreground">
            ${product.precio_unitario.toLocaleString('es-CL')} / {product.unidad}
          </p>
          {quantity > 0 && (
            <p className="text-sm font-semibold text-primary mt-1">
              Subtotal: ${subtotal.toLocaleString('es-CL')}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleDecrease}
            disabled={quantity === 0}
            className="h-9 w-9 rounded-full border-primary/50 hover:bg-primary hover:text-primary-foreground"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <span className="w-12 text-center font-semibold text-lg text-foreground">
            {quantity}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleIncrease}
            className="h-9 w-9 rounded-full border-primary/50 hover:bg-primary hover:text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
