
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  selected: boolean;
}

interface VendorEventProductsProps {
  eventId: string;
  businessId: string;
}

const VendorEventProducts = ({ eventId, businessId }: VendorEventProductsProps) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch business products
  const { data: productData, isLoading: productsLoading } = useQuery({
    queryKey: ["business-products", businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", businessId);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!businessId,
  });

  // Fetch products already added to this event
  const { data: eventProductData, isLoading: eventProductsLoading } = useQuery({
    queryKey: ["event-products", eventId, businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_products")
        .select("product_id")
        .eq("event_id", eventId)
        .eq("business_id", businessId);
      
      if (error) throw error;
      return data?.map(item => item.product_id) || [];
    },
    enabled: !!eventId && !!businessId,
  });

  // Merge the two datasets
  useEffect(() => {
    if (productData && eventProductData) {
      const selectedProductIds = eventProductData;
      
      const mergedProducts = productData.map(product => ({
        ...product,
        selected: selectedProductIds.includes(product.id)
      }));
      
      setProducts(mergedProducts);
    }
  }, [productData, eventProductData]);

  const handleProductToggle = (productId: string, checked: boolean) => {
    setProducts(products.map(product => 
      product.id === productId ? { ...product, selected: checked } : product
    ));
  };

  const saveProductSelection = async () => {
    setSaving(true);
    
    try {
      // First, remove all existing product associations for this business/event
      await supabase
        .from("event_products")
        .delete()
        .eq("event_id", eventId)
        .eq("business_id", businessId);
      
      // Then add the selected products
      const selectedProducts = products.filter(p => p.selected);
      
      if (selectedProducts.length > 0) {
        const { error } = await supabase
          .from("event_products")
          .insert(
            selectedProducts.map(product => ({
              event_id: eventId,
              business_id: businessId,
              product_id: product.id
            }))
          );
        
        if (error) throw error;
      }
      
      toast({
        title: "Products Updated",
        description: "Your product selection for this event has been saved",
      });
    } catch (error: any) {
      console.error("Error saving products:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save product selection",
      });
    } finally {
      setSaving(false);
    }
  };

  const isLoading = productsLoading || eventProductsLoading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Event Products</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <p>No products found for your business.</p>
            <Button className="mt-4" variant="outline" asChild>
              <a href={`/business/${businessId}/products`}>Add Products</a>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Select the products you want to showcase at this event:
            </p>
            <div className="space-y-2">
              {products.map((product) => (
                <div key={product.id} className="flex items-start space-x-3 p-2 border rounded">
                  <Checkbox
                    id={`product-${product.id}`}
                    checked={product.selected}
                    onCheckedChange={(checked) => 
                      handleProductToggle(product.id, checked as boolean)
                    }
                  />
                  <div className="grid gap-1">
                    <Label htmlFor={`product-${product.id}`} className="font-medium">
                      {product.name}
                    </Label>
                    <p className="text-sm text-gray-500">
                      {product.description || "No description"}
                    </p>
                    {product.price && (
                      <p className="text-sm font-medium">
                        ${product.price.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={saveProductSelection} disabled={saving} className="mt-4">
              {saving ? "Saving..." : "Save Product Selection"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorEventProducts;
