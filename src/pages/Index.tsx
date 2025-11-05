import { useState, useMemo } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CafeteriaSelector } from "@/components/order/CafeteriaSelector";
import { ProviderSearch } from "@/components/order/ProviderSearch";
import { ProductSelector } from "@/components/order/ProductSelector";
import { OrderSummary } from "@/components/order/OrderSummary";
import { PROVIDERS } from "@/data/mockData";
import { Order, SelectedProduct } from "@/types/order";

const Index = () => {
  const { toast } = useToast();
  const [cafeteria, setCafeteria] = useState("");
  const [providerId, setProviderId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const selectedProvider = PROVIDERS.find(p => p.id === providerId);
  
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

  const handleQuantityChange = (productName: string, quantity: number) => {
    setQuantities(prev => ({
      ...prev,
      [productName]: quantity,
    }));
  };

  const handleSubmit = async () => {
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
      cafeteria,
      proveedor: selectedProvider?.nombre || "",
      productos: selectedProducts,
      total,
    };

    // Aquí se enviaría a Google Sheets
    console.log("Pedido a enviar:", JSON.stringify(order, null, 2));

    // Simulación de envío exitoso
    toast({
      title: "✅ Pedido enviado con éxito",
      description: `Pedido de ${selectedProducts.length} producto(s) por $${total.toLocaleString('es-CL')}`,
    });

    // Reset form
    setCafeteria("");
    setProviderId("");
    setQuantities({});
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
          <CafeteriaSelector value={cafeteria} onChange={setCafeteria} />
          
          <ProviderSearch value={providerId} onChange={setProviderId} />
          
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
              className="w-full h-14 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover:scale-[1.02]"
            >
              <Send className="mr-2 h-5 w-5" />
              Enviar Pedido
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
