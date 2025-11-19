import { Link, useLocation } from "react-router-dom";
import { FileText, BarChart3, LogOut, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function Navbar() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({
        title: "Error al cerrar sesión",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/login");
    }
  };

  const navItems = [
    {
      path: "/ordenes",
      label: "Generar Ordenes de Compra",
      icon: FileText,
    },
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: BarChart3,
    },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo y título */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-serif font-bold text-foreground">
              Café Mar de Viña
            </h1>
          </div>

          {/* Navegación */}
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                              (item.path === "/ordenes" && location.pathname === "/");
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Usuario, tema y logout */}
          <div className="flex items-center gap-2">
            {user && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
            )}
            {/* Botón de tema */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newTheme = resolvedTheme === "light" ? "dark" : "light";
                setTheme(newTheme);
              }}
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              aria-label={resolvedTheme === "light" ? "Cambiar a modo oscuro" : "Cambiar a modo claro"}
            >
              {resolvedTheme === "light" ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

