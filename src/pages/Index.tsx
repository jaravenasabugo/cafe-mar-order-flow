import { useState, useMemo, useEffect } from "react";
import { Send, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CafeteriaSelector } from "@/components/order/CafeteriaSelector";
import { ProviderSearch } from "@/components/order/ProviderSearch";
import { CategoryFilter } from "@/components/order/CategoryFilter";
import { ProductSelector } from "@/components/order/ProductSelector";
import { OrderSummary } from "@/components/order/OrderSummary";
import { useProviders } from "@/hooks/use-providers";
import { useEncargados } from "@/hooks/use-encargados";
import { Order, SelectedProduct } from "@/types/order";

const Index = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [cafeteria, setCafeteria] = useState("");
  const [providerId, setProviderId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [observacion, setObservacion] = useState("");
  const { providers, loading, error } = useProviders();
  const { getEncargadoByEmail, loading: loadingEncargados } = useEncargados();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Obtener nombre del usuario desde Google Sheets basado en su email
  const userEncargado = useMemo(() => {
    if (!user?.email) return null;
    return getEncargadoByEmail(user.email);
  }, [user?.email, getEncargadoByEmail]);

  const userFullName = userEncargado?.nombre || "";

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

  const selectedProvider = providers.find(p => p.id === providerId);
  
  // Resetear categoría y cantidades cuando cambia el proveedor
  useEffect(() => {
    setSelectedCategory(null);
    setQuantities({});
  }, [providerId]);
  
  const filteredProducts = useMemo(() => {
    if (!selectedProvider || !providerId) return [];
    if (!selectedCategory) return selectedProvider.productos;
    return selectedProvider.productos.filter(
      product => product.categoria?.trim() === selectedCategory
    );
  }, [selectedProvider, selectedCategory, providerId]);
  
  const selectedProducts: SelectedProduct[] = useMemo(() => {
    if (!selectedProvider) return [];
    
    return selectedProvider.productos
      .filter(product => quantities[product.nombre] > 0)
      .map(product => ({
        ...product,
        cantidad: quantities[product.nombre],
        subtotal: quantities[product.nombre] * product.precio_unitario,
      }));
  }, [selectedProvider, quantities]);

  const total = selectedProducts.reduce((sum, product) => sum + product.subtotal, 0);
  const iva = Math.round(total * 0.19);
  const totalConIva = total + iva;

  const handleQuantityChange = (productName: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productName]: quantity,
    }));
  };

  const handleSelectAll = () => {
    setQuantities(prev => {
      const updated = { ...prev };
      filteredProducts.forEach(product => {
        const currentQuantity = updated[product.nombre] || 0;
        updated[product.nombre] = currentQuantity + 1;
      });
      return updated;
    });
  };

  const handleDeselectAll = () => {
    setQuantities(prev => {
      const updated = { ...prev };
      filteredProducts.forEach(product => {
        updated[product.nombre] = 0;
      });
      return updated;
    });
  };

  const handleSubmit = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "No se encontró información del usuario",
        variant: "destructive",
      });
      return;
    }

    if (!userFullName.trim()) {
      toast({
        title: "Error",
        description: "No se pudo encontrar tu nombre en el sistema. Por favor verifica que tu email esté registrado.",
        variant: "destructive",
      });
      return;
    }

    if (!cafeteria) {
      toast({
        title: "Error",
        description: "Por favor selecciona una cafetería",
        variant: "destructive",
      });
      return;
    }

    if (!providerId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un proveedor",
        variant: "destructive",
      });
      return;
    }

    if (selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Por favor selecciona al menos un producto",
        variant: "destructive",
      });
      return;
    }

    const order: Order = {
      solicitante: userFullName.trim(),
      cafeteria,
      proveedor: selectedProvider?.nombre || "",
      productos: selectedProducts,
      total_neto: total,
      iva,
      total_con_iva: totalConIva,
      observacion: observacion.trim(),
    };

    try {
      setIsSubmitting(true);
      // Usar la función serverless de Vercel como proxy para evitar problemas de CORS
      const response = await fetch("/api/send-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(order),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP ${response.status}`);
      }

      toast({
        title: "✅ Pedido enviado con éxito",
        description: `Pedido de ${selectedProducts.length} producto(s) por $${totalConIva.toLocaleString('es-CL')} (incluye IVA)`,
      });

      // Reset form
      setCafeteria("");
      setProviderId("");
      setSelectedCategory(null);
      setQuantities({});
      setObservacion("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      toast({
        title: "Error al enviar pedido",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in relative">
          <div className="absolute top-0 right-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </Button>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-3 text-foreground">
            Café Mar de Viña
          </h1>
          <div className="h-1 w-24 bg-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground font-light">
            Sistema de Pedidos a Proveedores
          </p>
          {user && (
            <div className="text-sm text-muted-foreground mt-2">
              {loadingEncargados ? (
                <p>Cargando información del usuario...</p>
              ) : userEncargado ? (
                <p>
                  Conectado como: <span className="font-medium text-foreground">{userEncargado.nombre}</span> ({user.email})
                </p>
              ) : (
                <p>
                  Conectado como: {user.email}
                  <span className="text-destructive block mt-1 text-xs">
                    ⚠️ No se encontró tu nombre en el sistema
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <div className="space-y-8">
          <CafeteriaSelector value={cafeteria} onChange={setCafeteria} />
          
          <ProviderSearch 
            value={providerId} 
            onChange={setProviderId} 
            providers={providers}
            disabled={loading}
          />

          {error && (
            <div className="text-sm text-red-500">{error}</div>
          )}
          
          {selectedProvider && (
            <>
              <CategoryFilter
                products={selectedProvider.productos}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
              />
              <ProductSelector
                key={providerId}
                products={filteredProducts}
                quantities={quantities}
                onQuantityChange={handleQuantityChange}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
              />
            </>
          )}
          
          {selectedProducts.length > 0 && (
            <OrderSummary products={selectedProducts} total={total} />
          )}

          {selectedProducts.length > 0 && (
            <div className="space-y-3 animate-fade-in">
              <Label className="text-sm font-medium text-muted-foreground">Observación (opcional)</Label>
              <Textarea
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Agrega cualquier observación o nota adicional sobre el pedido..."
                className="min-h-[100px] bg-card border-border text-foreground placeholder:text-muted-foreground resize-none"
              />
            </div>
          )}
          
          {selectedProducts.length > 0 && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-[1.02]"
            >
              <Send className="mr-2 h-5 w-5" />
              {isSubmitting ? "Enviando..." : "Enviar Pedido"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
