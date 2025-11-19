import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useEncargados } from "@/hooks/use-encargados";
import DashboardGeneral from "./DashboardGeneral";
import DashboardLocal from "./DashboardLocal";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const Dashboard = () => {
  const { user } = useAuth();
  const { getEncargadoByEmail, loading: loadingEncargados } = useEncargados();

  // Obtener información del usuario
  const userEncargado = useMemo(() => {
    if (!user?.email) return null;
    return getEncargadoByEmail(user.email);
  }, [user?.email, getEncargadoByEmail]);

  if (loadingEncargados) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-4 text-muted-foreground">Cargando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!userEncargado) {
    return (
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
              <CardDescription>
                No se pudo encontrar tu información en el sistema.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const local = userEncargado.local.trim();

  // Si el usuario es "General", mostrar DashboardGeneral
  if (local === "General") {
    return <DashboardGeneral />;
  }

  // Si es un local específico, mostrar DashboardLocal con filtrado automático
  return <DashboardLocal local={local} />;
};

export default Dashboard;

