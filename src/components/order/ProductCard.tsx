import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Product } from "@/types/order";

interface ProductCardProps {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export const ProductCard = ({ product, quantity, onQuantityChange }: ProductCardProps) => {
  const [inputValue, setInputValue] = useState<string>(quantity.toString());

  // Sincronizar el input cuando cambia la cantidad externamente (por ejemplo, desde botones)
  useEffect(() => {
    setInputValue(quantity.toString());
  }, [quantity]);

  const handleDecrease = () => {
    if (quantity > 0) {
      onQuantityChange(quantity - 1);
    }
  };

  const handleIncrease = () => {
    onQuantityChange(quantity + 1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permitir campo vacío mientras se escribe
    if (value === "" || value === "-") {
      setInputValue(value);
      return;
    }

    // Validar que sea un número entero positivo
    const numValue = parseInt(value, 10);
    
    if (!isNaN(numValue) && numValue >= 0) {
      setInputValue(value);
      onQuantityChange(numValue);
    }
  };

  const handleInputBlur = () => {
    // Cuando se pierde el foco, asegurar que el valor sea válido
    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue) || numValue < 0) {
      setInputValue("0");
      onQuantityChange(0);
    } else {
      setInputValue(numValue.toString());
    }
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
            className="h-9 w-9 rounded-full border-primary/50 hover:bg-primary hover:text-primary-foreground shrink-0"
          >
            <Minus className="h-4 w-4" />
          </Button>
          
          <Input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            className="w-20 text-center font-semibold text-lg h-9 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            placeholder="0"
            min={0}
          />
          
          <Button
            variant="outline"
            size="icon"
            onClick={handleIncrease}
            className="h-9 w-9 rounded-full border-primary/50 hover:bg-primary hover:text-primary-foreground shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
