import { useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FacturaDashboard } from "@/types/dashboard";
import { parse, isValid, format } from "date-fns";

interface InvoicesChartsProps {
  facturas: FacturaDashboard[];
  hideLocalidadCharts?: boolean; // Ocultar gráficos relacionados con localidad
}

// Colores para los gráficos de torta
const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#8dd1e1",
  "#d084d0",
  "#ffb347",
  "#87ceeb",
];

export function InvoicesCharts({ facturas, hideLocalidadCharts = false }: InvoicesChartsProps) {
  // Función auxiliar para parsear fechas (acepta varios formatos)
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    
    const trimmed = dateStr.trim();
    
    // Manejar formato "Date(year,month,day)" que viene de Google Sheets
    const dateMatch = trimmed.match(/^Date\((\d+),(\d+),(\d+)\)$/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10);
      const day = parseInt(dateMatch[3], 10);
      const date = new Date(year, month, day);
      if (isValid(date) && !isNaN(date.getTime())) {
        date.setHours(0, 0, 0, 0);
        return date;
      }
    }
    
    // Intentar diferentes formatos comunes
    const formats = ["yyyy-MM-dd", "dd/MM/yyyy", "dd-MM-yyyy", "yyyy/MM/dd"];
    for (const fmt of formats) {
      try {
        const parsed = parse(trimmed, fmt, new Date());
        if (isValid(parsed)) {
          parsed.setHours(0, 0, 0, 0);
          return parsed;
        }
      } catch {
        continue;
      }
    }
    
    // Si no funciona, intentar parse directo
    const direct = new Date(trimmed);
    if (isValid(direct) && !isNaN(direct.getTime())) {
      direct.setHours(0, 0, 0, 0);
      return direct;
    }
    
    return null;
  };

  // Agrupar por localidad - Monto total
  const montoPorLocalidad = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    facturas.forEach((factura) => {
      const key = factura.localidad || "Sin localidad";
      grouped[key] = (grouped[key] || 0) + factura.montoTotal;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [facturas]);

  // Agrupar por localidad - Cantidad
  const cantidadPorLocalidad = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    facturas.forEach((factura) => {
      const key = factura.localidad || "Sin localidad";
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [facturas]);

  // Agrupar por emisor - Monto total
  const montoPorEmisor = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    facturas.forEach((factura) => {
      const key = factura.nombreEmisor || "Sin emisor";
      grouped[key] = (grouped[key] || 0) + factura.montoTotal;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [facturas]);

  // Agrupar por forma de pago - Cantidad
  const cantidadPorFormaPago = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    facturas.forEach((factura) => {
      const key = factura.formaPago || "Sin forma de pago";
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [facturas]);

  // Agrupar por fecha de emisión - Monto total
  const montoPorFecha = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    facturas.forEach((factura) => {
      const date = parseDate(factura.fechaEmision);
      if (!date) return;
      const key = format(date, "yyyy-MM-dd");
      grouped[key] = (grouped[key] || 0) + factura.montoTotal;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));
  }, [facturas]);


  if (facturas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No hay datos para los filtros seleccionados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {/* Gráfico 1: Monto total por localidad (Barras) - Oculto si hideLocalidadCharts es true */}
      {!hideLocalidadCharts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monto Total por Localidad</CardTitle>
            <CardDescription>Suma de monto total agrupado por localidad</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={montoPorLocalidad}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  tick={{ fill: 'hsl(var(--foreground))' }}
                />
                <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    padding: '10px 14px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                  labelStyle={{
                    color: '#f9fafb',
                    fontWeight: '600',
                    marginBottom: '6px',
                    fontSize: '13px',
                  }}
                  itemStyle={{
                    color: '#f9fafb',
                    fontSize: '13px',
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString("es-CL")}`, 'Monto Total']}
                  labelFormatter={(label) => `Localidad: ${label}`}
                />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico 2: Proporción de facturas por localidad (Torta) - Oculto si hideLocalidadCharts es true */}
      {!hideLocalidadCharts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proporción de Facturas por Localidad</CardTitle>
            <CardDescription>Cantidad de facturas por localidad</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cantidadPorLocalidad}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cantidadPorLocalidad.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#f9fafb',
                    padding: '10px 14px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  }}
                  labelStyle={{
                    color: '#f9fafb',
                    fontWeight: '600',
                    marginBottom: '6px',
                    fontSize: '13px',
                  }}
                  itemStyle={{
                    color: '#f9fafb',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico 3: Monto total por emisor (Barras) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monto Total por Emisor</CardTitle>
          <CardDescription>Top 10 emisores por monto total</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={montoPorEmisor}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
              />
              <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  padding: '10px 14px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
                labelStyle={{
                  color: '#f9fafb',
                  fontWeight: '600',
                  marginBottom: '6px',
                  fontSize: '13px',
                }}
                itemStyle={{
                  color: '#f9fafb',
                  fontSize: '13px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString("es-CL")}`, 'Monto Total']}
                labelFormatter={(label) => `Emisor: ${label}`}
              />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico 4: Proporción por forma de pago (Torta) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proporción por Forma de Pago</CardTitle>
          <CardDescription>Distribución según forma de pago</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cantidadPorFormaPago}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {cantidadPorFormaPago.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  padding: '10px 14px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
                labelStyle={{
                  color: '#f9fafb',
                  fontWeight: '600',
                  marginBottom: '6px',
                  fontSize: '13px',
                }}
                itemStyle={{
                  color: '#f9fafb',
                  fontSize: '13px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico 5: Evolución de monto facturado en el tiempo (Línea) - Ocupa espacio de dos gráficos en escritorio */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Evolución de Monto Facturado</CardTitle>
          <CardDescription>Evolución temporal del monto total por fecha de emisión</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={montoPorFecha}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={80}
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis tick={{ fill: 'hsl(var(--foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb',
                  padding: '10px 14px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                }}
                labelStyle={{
                  color: '#f9fafb',
                  fontWeight: '600',
                  marginBottom: '6px',
                  fontSize: '13px',
                }}
                itemStyle={{
                  color: '#f9fafb',
                  fontSize: '13px',
                }}
                formatter={(value: number) => [`$${value.toLocaleString("es-CL")}`, 'Monto Total']}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
              <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

