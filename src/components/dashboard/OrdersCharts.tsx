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
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { OrdenDashboard } from "@/types/dashboard";
import { parse, isValid, format } from "date-fns";

interface OrdersChartsProps {
  ordenes: OrdenDashboard[];
  hideCafeteriaCharts?: boolean; // Ocultar gráficos relacionados con cafetería
  hideEstadoChart?: boolean; // Ocultar gráfico de estados
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

export function OrdersCharts({ ordenes, hideCafeteriaCharts = false, hideEstadoChart = false }: OrdersChartsProps) {
  // Función auxiliar para parsear fechas (acepta varios formatos)
  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr || !dateStr.trim()) return null;
    
    const trimmed = dateStr.trim();
    
    // Manejar formato "Date(year,month,day)" que viene de Google Sheets
    const dateMatch = trimmed.match(/^Date\((\d+),(\d+),(\d+)\)$/);
    if (dateMatch) {
      const year = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10); // Ya viene como 0-indexed
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

  // Agrupar por cafetería - Valor total
  const valorPorCafeteria = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    ordenes.forEach((orden) => {
      const key = orden.cafeteria || "Sin cafetería";
      grouped[key] = (grouped[key] || 0) + orden.total_con_iva;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [ordenes]);

  // Agrupar por cafetería - Cantidad
  const cantidadPorCafeteria = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    ordenes.forEach((orden) => {
      const key = orden.cafeteria || "Sin cafetería";
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [ordenes]);

  // Agrupar por estado
  const cantidadPorEstado = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    ordenes.forEach((orden) => {
      const key = orden.estadoAprobacion || "Sin estado";
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  }, [ordenes]);

  // Agrupar por fecha - Valor total
  const valorPorFecha = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    ordenes.forEach((orden) => {
      const date = parseDate(orden.fechaPedido);
      if (!date) return;
      const key = format(date, "yyyy-MM-dd");
      grouped[key] = (grouped[key] || 0) + orden.total_con_iva;
    });
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ name, value }));
  }, [ordenes]);

  // Agrupar por proveedor - Cantidad (Top 5)
  const cantidadPorProveedor = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    ordenes.forEach((orden) => {
      const key = orden.proveedor || "Sin proveedor";
      grouped[key] = (grouped[key] || 0) + 1;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5
  }, [ordenes]);

  // Agrupar por proveedor - Valor total
  const valorPorProveedor = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    ordenes.forEach((orden) => {
      const key = orden.proveedor || "Sin proveedor";
      grouped[key] = (grouped[key] || 0) + orden.total_con_iva;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [ordenes]);

  // Agrupar por solicitante - Valor total
  const valorPorSolicitante = useMemo(() => {
    const grouped: { [key: string]: number } = {};
    ordenes.forEach((orden) => {
      const key = orden.solicitante || "Sin solicitante";
      grouped[key] = (grouped[key] || 0) + orden.total_con_iva;
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10
  }, [ordenes]);

  if (ordenes.length === 0) {
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
      {/* Gráfico 1: Valor total por cafetería (Barras) - Oculto si hideCafeteriaCharts es true */}
      {!hideCafeteriaCharts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Valor Total por Cafetería</CardTitle>
            <CardDescription>Suma de total con IVA agrupado por cafetería</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valorPorCafeteria}>
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
                  formatter={(value: number) => [`$${value.toLocaleString("es-CL")}`, 'Valor']}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico 2: Proporción de pedidos por cafetería (Torta) - Oculto si hideCafeteriaCharts es true */}
      {!hideCafeteriaCharts && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proporción de Pedidos por Cafetería</CardTitle>
            <CardDescription>Cantidad de órdenes por cafetería</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cantidadPorCafeteria}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cantidadPorCafeteria.map((entry, index) => (
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

      {/* Gráfico 3: Proporción de órdenes por estado (Torta) - Oculto si hideEstadoChart es true */}
      {!hideEstadoChart && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proporción de Órdenes por Estado</CardTitle>
            <CardDescription>Distribución según estado de aprobación</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cantidadPorEstado}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cantidadPorEstado.map((entry, index) => (
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
                <Legend wrapperStyle={{ color: '#f9fafb' }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Gráfico 4: Valor total de pedidos por fecha (Línea) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Valor Total de Pedidos por Fecha</CardTitle>
          <CardDescription>Evolución temporal del valor total</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={valorPorFecha}>
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
                  formatter={(value: number) => [`$${value.toLocaleString("es-CL")}`, 'Valor']}
                  labelFormatter={(label) => `Fecha: ${label}`}
                />
                <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico 5: Proporción de órdenes por proveedor (Torta) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Proporción de Órdenes por Proveedor</CardTitle>
          <CardDescription>Top 5 proveedores por cantidad de órdenes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cantidadPorProveedor}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {cantidadPorProveedor.map((entry, index) => (
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

      {/* Gráfico 6: Valor total gastado por proveedor (Barras) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total Gastado por Proveedor</CardTitle>
          <CardDescription>Suma de total con IVA agrupado por proveedor</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valorPorProveedor}>
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
                  formatter={(value: number) => [`$${value.toLocaleString("es-CL")}`, 'Total Gastado']}
                  labelFormatter={(label) => `Proveedor: ${label}`}
                />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico 7: Valor total por solicitante (Barras) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Valor Total por Solicitante</CardTitle>
          <CardDescription>Top 10 solicitantes por valor total</CardDescription>
        </CardHeader>
        <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valorPorSolicitante}>
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
                  formatter={(value: number) => [`$${value.toLocaleString("es-CL")}`, 'Valor Total']}
                  labelFormatter={(label) => `Solicitante: ${label}`}
                />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

