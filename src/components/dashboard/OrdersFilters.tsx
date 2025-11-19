import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, X, Check, ChevronsUpDown } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { OrdenDashboard, OrdenFilters } from "@/types/dashboard";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrdersFiltersProps {
  ordenes: OrdenDashboard[];
  filters: OrdenFilters;
  onFiltersChange: (filters: OrdenFilters) => void;
  onClearFilters: () => void;
  hideCafeteriaFilter?: boolean; // Ocultar filtro de cafetería
}

export function OrdersFilters({ ordenes, filters, onFiltersChange, onClearFilters, hideCafeteriaFilter = false }: OrdersFiltersProps) {
  // Función auxiliar para parsear fecha sin problemas de zona horaria
  const parseDateString = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    // Parsear fecha en formato YYYY-MM-DD sin ajustes de zona horaria
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Los meses en JS son 0-indexed
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return undefined;
  };

  // Obtener valores únicos para los selects
  const cafeterias = useMemo(() => {
    if (ordenes.length === 0) return [];
    const unique = Array.from(new Set(ordenes.map((o) => o.cafeteria).filter(Boolean)));
    return unique.sort();
  }, [ordenes]);

  const proveedores = useMemo(() => {
    if (ordenes.length === 0) return [];
    const unique = Array.from(new Set(ordenes.map((o) => o.proveedor).filter(Boolean)));
    return unique.sort();
  }, [ordenes]);

  const estados = useMemo(() => {
    if (ordenes.length === 0) return [];
    const unique = Array.from(new Set(ordenes.map((o) => o.estadoAprobacion || "Pendiente").filter(Boolean)));
    return unique.sort();
  }, [ordenes]);

  // Calcular rango de totales
  const totalRange = useMemo(() => {
    if (ordenes.length === 0) return [0, 100000];
    const totales = ordenes.map((o) => o.total_con_iva).filter((t) => t > 0);
    if (totales.length === 0) return [0, 100000];
    const min = Math.floor(Math.min(...totales));
    const max = Math.ceil(Math.max(...totales));
    return [min, max];
  }, [ordenes]);

  // Si no hay órdenes, mostrar mensaje
  if (ordenes.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No hay órdenes para mostrar filtros
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handlers para selección múltiple
  const handleCafeteriaToggle = (value: string) => {
    const current = filters.cafeteria || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, cafeteria: newValue });
  };

  const handleProveedorToggle = (value: string) => {
    const current = filters.proveedor || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, proveedor: newValue });
  };

  const handleEstadoToggle = (value: string) => {
    const current = filters.estado || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, estado: newValue });
  };

  const handleTotalRangeChange = (values: number[]) => {
    // Si los valores son los mismos que el rango completo, resetear a null
    if (values[0] === totalRange[0] && values[1] === totalRange[1]) {
      onFiltersChange({
        ...filters,
        totalMin: null,
        totalMax: null,
      });
    } else {
      onFiltersChange({
        ...filters,
        totalMin: values[0],
        totalMax: values[1],
      });
    }
  };

  const handleFechaInicioChange = (value: string) => {
    onFiltersChange({
      ...filters,
      fechaInicio: value || null,
    });
  };

  const handleFechaFinChange = (value: string) => {
    onFiltersChange({
      ...filters,
      fechaFin: value || null,
    });
  };

  const handleNumeroOrdenChange = (value: string) => {
    onFiltersChange({
      ...filters,
      numeroOrden: value,
    });
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return !!(
      (filters.cafeteria && filters.cafeteria.length > 0) ||
      (filters.proveedor && filters.proveedor.length > 0) ||
      (filters.estado && filters.estado.length > 0) ||
      filters.totalMin !== null ||
      filters.totalMax !== null ||
      filters.fechaInicio ||
      filters.fechaFin ||
      filters.numeroOrden
    );
  }, [filters]);

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Filtros</CardTitle>
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Limpiar filtros
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Filtro por Cafetería (Multi-select) - Oculto si hideCafeteriaFilter es true */}
          {!hideCafeteriaFilter && (
            <div className="space-y-2">
              <Label>Cafetería</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {filters.cafeteria && filters.cafeteria.length > 0
                      ? `${filters.cafeteria.length} seleccionada${filters.cafeteria.length > 1 ? "s" : ""}`
                      : "Todas"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {cafeterias.map((cafeteria) => {
                      const isSelected = filters.cafeteria?.includes(cafeteria);
                      return (
                        <div
                          key={cafeteria}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                          onClick={() => handleCafeteriaToggle(cafeteria)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleCafeteriaToggle(cafeteria)}
                          />
                          <Label className="cursor-pointer flex-1">{cafeteria}</Label>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Filtro por Proveedor (Combobox con búsqueda y multi-select) */}
          <div className="space-y-2">
            <Label>Proveedor</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {filters.proveedor && filters.proveedor.length > 0
                    ? `${filters.proveedor.length} seleccionado${filters.proveedor.length > 1 ? "s" : ""}`
                    : "Todos"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar proveedor..." />
                  <CommandList>
                    <CommandEmpty>No se encontró el proveedor.</CommandEmpty>
                    <CommandGroup>
                      {proveedores.map((proveedor) => {
                        const isSelected = filters.proveedor?.includes(proveedor);
                        return (
                          <CommandItem
                            key={proveedor}
                            value={proveedor}
                            onSelect={() => {
                              handleProveedorToggle(proveedor);
                            }}
                            className="cursor-pointer"
                          >
                            <div 
                              className="flex items-center space-x-2 w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProveedorToggle(proveedor);
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked !== isSelected) {
                                    handleProveedorToggle(proveedor);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="flex-1">{proveedor}</span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro por Estado (Multi-select) */}
          <div className="space-y-2">
            <Label>Estado</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {filters.estado && filters.estado.length > 0
                    ? `${filters.estado.length} seleccionado${filters.estado.length > 1 ? "s" : ""}`
                    : "Todos"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {estados.map((estado) => {
                    const isSelected = filters.estado?.includes(estado);
                    return (
                      <div
                        key={estado}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => handleEstadoToggle(estado)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleEstadoToggle(estado)}
                        />
                        <Label className="cursor-pointer flex-1">{estado}</Label>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Búsqueda por número de orden */}
          <div className="space-y-2">
            <Label htmlFor="filtro-numero">Número de Orden</Label>
            <Input
              id="filtro-numero"
              type="text"
              placeholder="Buscar número de orden..."
              value={filters.numeroOrden}
              onChange={(e) => handleNumeroOrdenChange(e.target.value)}
            />
          </div>

          {/* Filtro por rango de total */}
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label>
              Rango de Total (con IVA): ${filters.totalMin?.toLocaleString("es-CL") || totalRange[0].toLocaleString("es-CL")} - ${filters.totalMax?.toLocaleString("es-CL") || totalRange[1].toLocaleString("es-CL")}
            </Label>
            <div className="relative px-2">
              <Slider
                min={totalRange[0]}
                max={totalRange[1]}
                step={Math.max(1000, Math.floor((totalRange[1] - totalRange[0]) / 100))}
                value={[filters.totalMin ?? totalRange[0], filters.totalMax ?? totalRange[1]]}
                onValueChange={handleTotalRangeChange}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-2">
              <span>Mín: ${totalRange[0].toLocaleString("es-CL")}</span>
              <span>Máx: ${totalRange[1].toLocaleString("es-CL")}</span>
            </div>
          </div>

          {/* Filtro por fecha inicio */}
          <div className="space-y-2">
            <Label htmlFor="filtro-fecha-inicio">Fecha Inicio</Label>
            <div className="flex gap-2">
              <Input
                id="filtro-fecha-inicio"
                type="date"
                value={filters.fechaInicio || ""}
                onChange={(e) => handleFechaInicioChange(e.target.value)}
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.fechaInicio ? parseDateString(filters.fechaInicio) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        // Usar la fecha local sin ajustes de zona horaria
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const day = String(date.getDate()).padStart(2, "0");
                        handleFechaInicioChange(`${year}-${month}-${day}`);
                      } else {
                        handleFechaInicioChange("");
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Filtro por fecha fin */}
          <div className="space-y-2">
            <Label htmlFor="filtro-fecha-fin">Fecha Fin</Label>
            <div className="flex gap-2">
              <Input
                id="filtro-fecha-fin"
                type="date"
                value={filters.fechaFin || ""}
                onChange={(e) => handleFechaFinChange(e.target.value)}
                className="flex-1"
              />
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.fechaFin ? parseDateString(filters.fechaFin) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        // Usar la fecha local sin ajustes de zona horaria
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(2, "0");
                        const day = String(date.getDate()).padStart(2, "0");
                        handleFechaFinChange(`${year}-${month}-${day}`);
                      } else {
                        handleFechaFinChange("");
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

