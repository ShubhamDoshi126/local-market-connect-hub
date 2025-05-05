
import { useState, useEffect } from "react";
import { Heart, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  business_name: string;
  business_id: string;
  interest_count?: number;
  has_expressed_interest?: boolean;
}

interface EventProductListProps {
  eventId: string;
}

const EventProductList = ({ eventId }: EventProductListProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Get all event products for this event
      const { data: eventProducts, error: eventProductsError } = await supabase
        .from("event_products")
        .select("product_id, business_id")
        .eq("event_id", eventId);

      if (eventProductsError) throw eventProductsError;

      if (!eventProducts || eventProducts.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch product details
      const productIds = eventProducts.map(ep => ep.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*, businesses(name)")
        .in("id", productIds);

      if (productsError) throw productsError;

      // Count interests for each product
      let productsWithInterests = await Promise.all(
        productsData.map(async (product) => {
          // Get interest count
          const { count, error: countError } = await supabase
            .from("product_interests")
            .select("*", { count: "exact", head: true })
            .eq("product_id", product.id)
            .eq("event_id", eventId);

          if (countError) {
            console.error("Error counting interests:", countError);
            return {
              ...product,
              business_name: product.businesses?.name || "Unknown Business",
              interest_count: 0,
              has_expressed_interest: false
            };
          }

          // Check if current user has expressed interest
          let hasExpressedInterest = false;
          if (user) {
            const { data: interestData } = await supabase
              .from("product_interests")
              .select("id")
              .eq("product_id", product.id)
              .eq("event_id", eventId)
              .eq("user_id", user.id)
              .maybeSingle();

            hasExpressedInterest = !!interestData;
          }

          return {
            ...product,
            business_name: product.businesses?.name || "Unknown Business",
            interest_count: count || 0,
            has_expressed_interest: hasExpressedInterest
          };
        })
      );

      setProducts(productsWithInterests);
    } catch (error: any) {
      console.error("Error fetching products:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load products for this event",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleInterest = async (productId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to express interest in products",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check if interest already exists
      const { data: existingInterest } = await supabase
        .from("product_interests")
        .select("id")
        .eq("product_id", productId)
        .eq("event_id", eventId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingInterest) {
        // Remove interest
        await supabase
          .from("product_interests")
          .delete()
          .eq("id", existingInterest.id);

        toast({
          title: "Interest removed",
          description: "You've removed your interest in this product",
        });
      } else {
        // Add interest
        await supabase
          .from("product_interests")
          .insert({
            product_id: productId,
            event_id: eventId,
            user_id: user.id,
          });

        toast({
          title: "Interest saved",
          description: "You've expressed interest in this product",
        });
      }

      // Refresh products to update counts
      fetchProducts();
    } catch (error: any) {
      console.error("Error toggling interest:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update your interest. Please try again.",
      });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [eventId, user]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-24 w-24 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-lg font-medium">No products available</h3>
        <p className="text-muted-foreground">
          No products have been added to this event yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <Card key={product.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-24 w-24 object-cover rounded-md"
                />
              ) : (
                <div className="h-24 w-24 bg-muted rounded-md flex items-center justify-center text-muted-foreground">
                  No image
                </div>
              )}
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {product.description || "No description available"}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline">{product.business_name}</Badge>
                      {product.price && (
                        <span className="text-sm font-medium">
                          ${product.price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <Button
                      variant={product.has_expressed_interest ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleInterest(product.id)}
                    >
                      <Heart
                        className={`h-4 w-4 mr-2 ${
                          product.has_expressed_interest ? "fill-current" : ""
                        }`}
                      />
                      {product.has_expressed_interest ? "Interested" : "Express Interest"}
                    </Button>
                    <span className="text-xs text-muted-foreground mt-1">
                      {product.interest_count} {product.interest_count === 1 ? "person" : "people"} interested
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EventProductList;
