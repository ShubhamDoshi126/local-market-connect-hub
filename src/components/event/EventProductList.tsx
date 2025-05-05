
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HeartIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductWithInterest {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  business_name: string;
  interested: boolean;
  interest_count: number;
}

interface EventProductListProps {
  eventId: string;
}

const EventProductList = ({ eventId }: EventProductListProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<ProductWithInterest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        // Get all products associated with this event
        const { data: eventProducts, error: eventProductsError } = await supabase
          .from("event_products")
          .select(`
            product_id,
            business_id,
            businesses (
              name
            )
          `)
          .eq("event_id", eventId);

        if (eventProductsError) throw eventProductsError;

        if (!eventProducts || eventProducts.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Get detailed product info
        const productIds = eventProducts.map(ep => ep.product_id);
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("*")
          .in("id", productIds);

        if (productsError) throw productsError;

        // Get current user's interests if logged in
        let userInterests: string[] = [];
        if (user) {
          const { data: interests, error: interestsError } = await supabase
            .from("product_interests")
            .select("product_id")
            .eq("event_id", eventId)
            .eq("user_id", user.id);

          if (!interestsError && interests) {
            userInterests = interests.map(i => i.product_id || "");
          }
        }

        // Get interest counts for each product
        const { data: interestCounts, error: countsError } = await supabase
          .from("product_interests")
          .select("product_id, count")
          .eq("event_id", eventId)
          .group('product_id');

        if (countsError) throw countsError;

        // Map counts to a simple object
        const countMap: Record<string, number> = {};
        interestCounts?.forEach(item => {
          if (item.product_id) {
            countMap[item.product_id] = parseInt(item.count as unknown as string);
          }
        });

        // Combine all the data
        const enrichedProducts: ProductWithInterest[] = productsData.map(product => {
          const eventProduct = eventProducts.find(ep => ep.product_id === product.id);
          return {
            ...product,
            business_name: eventProduct?.businesses?.name || "Unknown",
            interested: userInterests.includes(product.id),
            interest_count: countMap[product.id] || 0
          };
        });

        setProducts(enrichedProducts);
      } catch (error: any) {
        console.error("Error fetching products:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load products for this event",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [eventId, user]);

  const toggleInterest = async (productId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to express interest in products",
        variant: "destructive",
      });
      return;
    }

    try {
      const productIndex = products.findIndex(p => p.id === productId);
      const product = products[productIndex];
      const newInterested = !product.interested;

      // Optimistic update
      const updatedProducts = [...products];
      updatedProducts[productIndex] = {
        ...product,
        interested: newInterested,
        interest_count: newInterested 
          ? product.interest_count + 1 
          : product.interest_count - 1
      };
      setProducts(updatedProducts);

      if (newInterested) {
        // Add interest
        const { error } = await supabase
          .from("product_interests")
          .insert({
            product_id: productId,
            event_id: eventId,
            user_id: user.id
          });

        if (error) throw error;
      } else {
        // Remove interest
        const { error } = await supabase
          .from("product_interests")
          .delete()
          .eq("product_id", productId)
          .eq("event_id", eventId)
          .eq("user_id", user.id);

        if (error) throw error;
      }
    } catch (error: any) {
      console.error("Error toggling interest:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update your interest",
      });
      
      // Revert the optimistic update on error
      const fetchProducts = async () => {
        // ... (same fetching logic as in useEffect)
      };
      fetchProducts();
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-gray-500">No products have been added to this event yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Card key={product.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="p-5">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium text-lg">{product.name}</h3>
                  <p className="text-sm text-gray-600">By {product.business_name}</p>
                  {product.description && (
                    <p className="mt-2 text-gray-600">{product.description}</p>
                  )}
                  {product.price !== null && (
                    <p className="mt-2 font-medium">${product.price.toFixed(2)}</p>
                  )}
                </div>
                <Button
                  variant={product.interested ? "default" : "outline"}
                  size="sm"
                  className="flex items-center space-x-1"
                  onClick={() => toggleInterest(product.id)}
                >
                  <HeartIcon
                    className={`h-4 w-4 ${product.interested ? "fill-current" : ""}`}
                  />
                  <span>{product.interest_count}</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EventProductList;
