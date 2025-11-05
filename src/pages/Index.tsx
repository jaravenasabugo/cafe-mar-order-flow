import { useState, useMemo } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CafeteriaSelector } from "@/components/order/CafeteriaSelector";
import { ProviderSearch } from "@/components/order/ProviderSearch";
import { ProductSelector } from "@/components/order/ProductSelector";
import { OrderSummary } from "@/components/order/OrderSummary";
import { useProviders } from "@/hooks/use-providers";
import { Order, SelectedProduct } from "@/types/order";

const Index = () => {
  const { toast } = useToast();
  const [cafeteria, setCafeteria] = useState("");
  const [fullName, setFullName] = useState("");
  const [providerId, setProviderId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { providers, loading, error } = useProviders();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProvider = providers.find(p => p.id === providerId);
  
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

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu nombre y apellido",
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
      solicitante: fullName.trim(),
      cafeteria,
      proveedor: selectedProvider?.nombre || "",
      productos: selectedProducts,
      total_neto: total,
      iva,
      total_con_iva: totalConIva,
    };
    
    const webhookUrl = import.meta.env.VITE_ORDER_WEBHOOK_URL as string | undefined;
    if (!webhookUrl) {
      toast({
        title: "Error de configuración",
        description: "Falta VITE_ORDER_WEBHOOK_URL en el archivo .env",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(webhookUrl!, {
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
      setFullName("");
      setCafeteria("");
      setProviderId("");
      setQuantities({});
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
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-3 text-foreground">
            Café Mar de Viña
          </h1>
          <div className="h-1 w-24 bg-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground font-light">
            Sistema de Pedidos a Proveedores
          </p>
        </div>

        {/* Form */}
        <div className="space-y-8">
          {/* Nombre y Apellido */}
          <div className="space-y-3 animate-fade-in">
            <Label className="text-lg font-serif text-foreground">Nombre y apellido</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Escribe tu nombre y apellido"
              className="h-12 bg-card border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

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
            <ProductSelector
              products={selectedProvider.productos}
              quantities={quantities}
              onQuantityChange={handleQuantityChange}
            />
          )}
          
          {selectedProducts.length > 0 && (
            <OrderSummary products={selectedProducts} total={total} />
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
