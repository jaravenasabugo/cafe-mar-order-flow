import { useState } from "react";
import { Check, ChevronsUpDown, Store } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { PROVIDERS } from "@/data/mockData";

interface ProviderSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const ProviderSearch = ({ value, onChange }: ProviderSearchProps) => {
  const [open, setOpen] = useState(false);
  
  const selectedProvider = PROVIDERS.find((provider) => provider.id === value);

  return (
    <div className="space-y-3 animate-fade-in">
      <Label className="text-lg font-serif flex items-center gap-2 text-foreground">
        <Store className="w-5 h-5 text-primary" />
        Proveedor
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full h-12 justify-between bg-card border-border hover:border-primary transition-colors text-foreground"
          >
            {selectedProvider ? selectedProvider.nombre : "Busca o selecciona un proveedor..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-popover border-border" align="start">
          <Command className="bg-popover">
            <CommandInput 
              placeholder="Escribe para buscar..." 
              className="h-12 text-foreground"
            />
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                No se encontró el proveedor.
              </CommandEmpty>
              <CommandGroup>
                {PROVIDERS.map((provider) => (
                  <CommandItem
                    key={provider.id}
                    value={provider.nombre}
                    onSelect={() => {
                      onChange(provider.id);
                      setOpen(false);
                    }}
                    className="cursor-pointer hover:bg-muted"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === provider.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {provider.nombre}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
