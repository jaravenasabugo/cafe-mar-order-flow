import { useMemo, useState } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FacturaDashboard, FacturaFilters } from "@/types/dashboard";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface InvoicesFiltersProps {
  facturas: FacturaDashboard[];
  filters: FacturaFilters;
  onFiltersChange: (filters: FacturaFilters) => void;
  onClearFilters: () => void;
  hideLocalidadFilter?: boolean; // Ocultar filtro de localidad (para encargados)
  localidadesDisponibles?: string[]; // Localidades disponibles para el usuario
}

export function InvoicesFilters({
  facturas,
  filters,
  onFiltersChange,
  onClearFilters,
  hideLocalidadFilter = false,
  localidadesDisponibles,
}: InvoicesFiltersProps) {
  // Función auxiliar para parsear fecha sin problemas de zona horaria
  const parseDateString = (dateStr: string): Date | undefined => {
    if (!dateStr) return undefined;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return undefined;
  };

  // Obtener valores únicos para los selects
  const localidades = useMemo(() => {
    if (facturas.length === 0) return [];
    const unique = Array.from(new Set(facturas.map((f) => f.localidad).filter(Boolean)));
    return unique.sort();
  }, [facturas]);

  const emisores = useMemo(() => {
    if (facturas.length === 0) return [];
    const unique = Array.from(new Set(facturas.map((f) => f.nombreEmisor).filter(Boolean)));
    return unique.sort();
  }, [facturas]);

  const tiposDocumento = useMemo(() => {
    if (facturas.length === 0) return [];
    const unique = Array.from(new Set(facturas.map((f) => f.tipoDocumento).filter(Boolean)));
    return unique.sort();
  }, [facturas]);

  const formasPago = useMemo(() => {
    if (facturas.length === 0) return [];
    const unique = Array.from(new Set(facturas.map((f) => f.formaPago).filter(Boolean)));
    return unique.sort();
  }, [facturas]);

  const condicionesPago = useMemo(() => {
    if (facturas.length === 0) return [];
    const unique = Array.from(new Set(facturas.map((f) => f.condicionPago).filter(Boolean)));
    return unique.sort();
  }, [facturas]);

  // Calcular rango de montos
  const montoRange = useMemo(() => {
    if (facturas.length === 0) return [0, 100000];
    const montos = facturas.map((f) => f.montoTotal).filter((t) => t > 0);
    if (montos.length === 0) return [0, 100000];
    const min = Math.floor(Math.min(...montos));
    const max = Math.ceil(Math.max(...montos));
    return [min, max];
  }, [facturas]);

  // Si no hay facturas, mostrar mensaje
  if (facturas.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No hay facturas para mostrar filtros
          </p>
        </CardContent>
      </Card>
    );
  }

  // Handlers para selección múltiple
  const handleLocalidadToggle = (value: string) => {
    const current = filters.localidad || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, localidad: newValue });
  };

  const handleEmisorToggle = (value: string) => {
    const current = filters.nombreEmisor || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, nombreEmisor: newValue });
  };

  const handleTipoDocumentoToggle = (value: string) => {
    const current = filters.tipoDocumento || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, tipoDocumento: newValue });
  };

  const handleFormaPagoToggle = (value: string) => {
    const current = filters.formaPago || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, formaPago: newValue });
  };

  const handleCondicionPagoToggle = (value: string) => {
    const current = filters.condicionPago || [];
    const newValue = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, condicionPago: newValue });
  };

  const handleMontoRangeChange = (values: number[]) => {
    if (values[0] === montoRange[0] && values[1] === montoRange[1]) {
      onFiltersChange({
        ...filters,
        montoMin: null,
        montoMax: null,
      });
    } else {
      onFiltersChange({
        ...filters,
        montoMin: values[0],
        montoMax: values[1],
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

  const handleTipoFechaChange = (value: "emision" | "recepcion" | "vencimiento") => {
    onFiltersChange({
      ...filters,
      tipoFecha: value,
    });
  };

  const handleBusquedaChange = (value: string) => {
    onFiltersChange({
      ...filters,
      busqueda: value,
    });
  };

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return !!(
      (filters.localidad && filters.localidad.length > 0) ||
      (filters.nombreEmisor && filters.nombreEmisor.length > 0) ||
      (filters.tipoDocumento && filters.tipoDocumento.length > 0) ||
      (filters.formaPago && filters.formaPago.length > 0) ||
      (filters.condicionPago && filters.condicionPago.length > 0) ||
      filters.montoMin !== null ||
      filters.montoMax !== null ||
      filters.fechaInicio ||
      filters.fechaFin ||
      filters.busqueda
    );
  }, [filters]);

  // Usar localidades disponibles si se proporcionan (para encargados)
  const localidadesParaFiltro = localidadesDisponibles && localidadesDisponibles.length > 0
    ? localidadesDisponibles
    : localidades;

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
          {/* Filtro por Localidad (Multi-select) */}
          {!hideLocalidadFilter && (
            <div className="space-y-2">
              <Label>Localidad</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                  >
                    {filters.localidad && filters.localidad.length > 0
                      ? `${filters.localidad.length} seleccionada${filters.localidad.length > 1 ? "s" : ""}`
                      : "Todas"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {localidadesParaFiltro.map((localidad) => {
                      const isSelected = filters.localidad?.includes(localidad);
                      return (
                        <div
                          key={localidad}
                          className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                          onClick={() => handleLocalidadToggle(localidad)}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleLocalidadToggle(localidad)}
                          />
                          <Label className="cursor-pointer flex-1">{localidad}</Label>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Filtro por Emisor (Combobox con búsqueda y multi-select) */}
          <div className="space-y-2">
            <Label>Emisor</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {filters.nombreEmisor && filters.nombreEmisor.length > 0
                    ? `${filters.nombreEmisor.length} seleccionado${filters.nombreEmisor.length > 1 ? "s" : ""}`
                    : "Todos"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar emisor..." />
                  <CommandList>
                    <CommandEmpty>No se encontró el emisor.</CommandEmpty>
                    <CommandGroup>
                      {emisores.map((emisor) => {
                        const isSelected = filters.nombreEmisor?.includes(emisor);
                        return (
                          <CommandItem
                            key={emisor}
                            value={emisor}
                            onSelect={() => {
                              handleEmisorToggle(emisor);
                            }}
                            className="cursor-pointer"
                          >
                            <div
                              className="flex items-center space-x-2 w-full"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEmisorToggle(emisor);
                              }}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (checked !== isSelected) {
                                    handleEmisorToggle(emisor);
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <span className="flex-1">{emisor}</span>
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

          {/* Filtro por Tipo de Documento (Multi-select) */}
          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {filters.tipoDocumento && filters.tipoDocumento.length > 0
                    ? `${filters.tipoDocumento.length} seleccionado${filters.tipoDocumento.length > 1 ? "s" : ""}`
                    : "Todos"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {tiposDocumento.map((tipo) => {
                    const isSelected = filters.tipoDocumento?.includes(tipo);
                    return (
                      <div
                        key={tipo}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => handleTipoDocumentoToggle(tipo)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleTipoDocumentoToggle(tipo)}
                        />
                        <Label className="cursor-pointer flex-1">{tipo}</Label>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro por Forma de Pago (Multi-select) */}
          <div className="space-y-2">
            <Label>Forma de Pago</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {filters.formaPago && filters.formaPago.length > 0
                    ? `${filters.formaPago.length} seleccionada${filters.formaPago.length > 1 ? "s" : ""}`
                    : "Todas"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {formasPago.map((forma) => {
                    const isSelected = filters.formaPago?.includes(forma);
                    return (
                      <div
                        key={forma}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => handleFormaPagoToggle(forma)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleFormaPagoToggle(forma)}
                        />
                        <Label className="cursor-pointer flex-1">{forma}</Label>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro por Condición de Pago (Multi-select) */}
          <div className="space-y-2">
            <Label>Condición de Pago</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {filters.condicionPago && filters.condicionPago.length > 0
                    ? `${filters.condicionPago.length} seleccionada${filters.condicionPago.length > 1 ? "s" : ""}`
                    : "Todas"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0">
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {condicionesPago.map((condicion) => {
                    const isSelected = filters.condicionPago?.includes(condicion);
                    return (
                      <div
                        key={condicion}
                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                        onClick={() => handleCondicionPagoToggle(condicion)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleCondicionPagoToggle(condicion)}
                        />
                        <Label className="cursor-pointer flex-1">{condicion}</Label>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Búsqueda por número de factura o RUT */}
          <div className="space-y-2">
            <Label htmlFor="filtro-busqueda">Buscar (Número o RUT)</Label>
            <Input
              id="filtro-busqueda"
              type="text"
              placeholder="Buscar número de factura o RUT..."
              value={filters.busqueda}
              onChange={(e) => handleBusquedaChange(e.target.value)}
            />
          </div>

          {/* Filtro por rango de monto */}
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label>
              Rango de Monto Total: ${filters.montoMin?.toLocaleString("es-CL") || montoRange[0].toLocaleString("es-CL")} - ${filters.montoMax?.toLocaleString("es-CL") || montoRange[1].toLocaleString("es-CL")}
            </Label>
            <div className="relative px-2">
              <Slider
                min={montoRange[0]}
                max={montoRange[1]}
                step={Math.max(1000, Math.floor((montoRange[1] - montoRange[0]) / 100))}
                value={[filters.montoMin ?? montoRange[0], filters.montoMax ?? montoRange[1]]}
                onValueChange={handleMontoRangeChange}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-2">
              <span>Mín: ${montoRange[0].toLocaleString("es-CL")}</span>
              <span>Máx: ${montoRange[1].toLocaleString("es-CL")}</span>
            </div>
          </div>

          {/* Selector de tipo de fecha */}
          <div className="space-y-2">
            <Label htmlFor="filtro-tipo-fecha">Filtrar por</Label>
            <Select
              value={filters.tipoFecha}
              onValueChange={handleTipoFechaChange}
            >
              <SelectTrigger id="filtro-tipo-fecha">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emision">Fecha de Emisión</SelectItem>
                <SelectItem value="recepcion">Fecha de Recepción</SelectItem>
                <SelectItem value="vencimiento">Fecha de Vencimiento</SelectItem>
              </SelectContent>
            </Select>
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

