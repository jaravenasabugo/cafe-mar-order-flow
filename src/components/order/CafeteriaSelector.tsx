import { Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CAFETERIAS } from "@/data/mockData";

interface CafeteriaSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export const CafeteriaSelector = ({ value, onChange }: CafeteriaSelectorProps) => {
  return (
    <div className="space-y-3 animate-fade-in">
      <Label htmlFor="cafeteria" className="text-lg font-serif flex items-center gap-2 text-foreground">
        <Building2 className="w-5 h-5 text-primary" />
        Cafetería
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger 
          id="cafeteria" 
          className="w-full h-12 bg-card border-border hover:border-primary transition-colors"
        >
          <SelectValue placeholder="Selecciona una cafetería" />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {CAFETERIAS.map((cafeteria) => (
            <SelectItem 
              key={cafeteria} 
              value={cafeteria}
              className="hover:bg-muted cursor-pointer"
            >
              {cafeteria}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
