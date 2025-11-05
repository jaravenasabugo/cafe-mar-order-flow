import { Coffee } from "lucide-react";
import { Label } from "@/components/ui/label";
import { ProductCard } from "./ProductCard";
import { Product } from "@/types/order";

interface ProductSelectorProps {
  products: Product[];
  quantities: Record<string, number>;
  onQuantityChange: (productName: string, quantity: number) => void;
}

export const ProductSelector = ({ products, quantities, onQuantityChange }: ProductSelectorProps) => {
  if (products.length === 0) return null;

  return (
    <div className="space-y-4 animate-fade-in">
      <Label className="text-lg font-serif flex items-center gap-2 text-foreground">
        <Coffee className="w-5 h-5 text-primary" />
        Productos Disponibles
      </Label>
      <div className="space-y-3">
        {products.map((product) => (
          <ProductCard
            key={product.nombre}
            product={product}
            quantity={quantities[product.nombre] || 0}
            onQuantityChange={(qty) => onQuantityChange(product.nombre, qty)}
          />
        ))}
      </div>
    </div>
  );
};
