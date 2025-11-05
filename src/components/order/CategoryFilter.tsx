import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Product } from "@/types/order";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  products: Product[];
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
}

export const CategoryFilter = ({ products, selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(product => {
      if (product.categoria && product.categoria.trim()) {
        cats.add(product.categoria.trim());
      }
    });
    return Array.from(cats).sort();
  }, [products]);

  if (categories.length === 0) return null;

  return (
    <div className="space-y-3 animate-fade-in">
      <div className="text-sm font-medium text-muted-foreground">Filtrar por categoría</div>
      <div className="flex flex-wrap gap-2">
        <Card
          onClick={() => onCategoryChange(null)}
          className={cn(
            "px-4 py-2 cursor-pointer transition-all duration-200 hover:border-primary",
            selectedCategory === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-card border-border hover:bg-accent"
          )}
        >
          <span className="text-sm font-medium">Todas</span>
        </Card>
        {categories.map((category) => (
          <Card
            key={category}
            onClick={() => onCategoryChange(category)}
            className={cn(
              "px-4 py-2 cursor-pointer transition-all duration-200 hover:border-primary",
              selectedCategory === category
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card border-border hover:bg-accent"
            )}
          >
            <span className="text-sm font-medium">{category}</span>
          </Card>
        ))}
      </div>
    </div>
  );
};

