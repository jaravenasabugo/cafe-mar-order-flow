import { Store } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PROVIDERS } from "@/data/mockData";

interface ProviderSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProviderSearch = ({ value, onChange }: ProviderSearchProps) => {
  return (
    <div className="space-y-3 animate-fade-in">
      <Label htmlFor="provider" className="text-lg font-serif flex items-center gap-2 text-foreground">
        <Store className="w-5 h-5 text-primary" />
        Proveedor
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          id="provider" 
          className="w-full h-12 bg-card border-border hover:border-primary transition-colors"
        >
          <SelectValue placeholder="Busca o selecciona un proveedor" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border max-h-[300px]">
          {PROVIDERS.map((provider) => (
            <SelectItem 
              key={provider.id} 
              value={provider.id}
              className="hover:bg-muted cursor-pointer"
            >
              {provider.nombre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
