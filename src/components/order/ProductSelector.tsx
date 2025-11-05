import { Coffee, Search } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ProductCard } from "./ProductCard";
import { Product } from "@/types/order";
import { useMemo, useState } from "react";

interface ProductSelectorProps {
  products: Product[];
  quantities: Record<string, number>;
  onQuantityChange: (productName: string, quantity: number) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
}

export const ProductSelector = ({ products, quantities, onQuantityChange, onSelectAll, onDeselectAll }: ProductSelectorProps) => {
  const [search, setSearch] = useState("");
  if (products.length === 0) return null;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;
    return products.filter(p => p.nombre.toLowerCase().includes(term));
  }, [products, search]);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-4">
        <Label className="text-lg font-serif flex items-center gap-2 text-foreground">
          <Coffee className="w-5 h-5 text-primary" />
          Productos Disponibles
        </Label>
        {filtered.length > 0 && (onSelectAll || onDeselectAll) && (
          <div className="flex flex-col gap-2">
            {onSelectAll && (
              <Button
                onClick={onSelectAll}
                size="sm"
                className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground w-[250px]"
              >
                Seleccionar todos los productos
              </Button>
            )}
            {onDeselectAll && (
              <Button
                onClick={onDeselectAll}
                size="sm"
                className="text-sm bg-primary hover:bg-primary/90 text-primary-foreground w-[250px]"
              >
                Deseleccionar todos
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto por nombre..."
          className="pl-9 h-10 bg-card border-border text-foreground placeholder:text-muted-foreground"
        />
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-sm text-muted-foreground">No hay productos que coincidan con tu búsqueda.</div>
        ) : (
          filtered.map((product) => (
            <ProductCard
              key={product.nombre}
              product={product}
              quantity={quantities[product.nombre] || 0}
              onQuantityChange={(qty) => onQuantityChange(product.nombre, qty)}
            />
          ))
        )}
      </div>
    </div>
  );
};
