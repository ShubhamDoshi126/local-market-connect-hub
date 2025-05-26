// src/components/vendor/EventProductCollection.tsx
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/auth/AuthProvider";

const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().refine(val => !isNaN(parseFloat(val)), {
    message: "Price must be a valid number",
  }),
  image_url: z.string().optional(),
});

type ProductValues = z.infer<typeof productSchema>;

interface EventProductCollectionProps {
  eventId: string;
  businessId: string;
}

const EventProductCollection = ({ eventId, businessId }: EventProductCollectionProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [eventProducts, setEventProducts] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(true);

  const form = useForm<ProductValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      image_url: "",
    },
  });

  // Fetch existing event products
  useEffect(() => {
    const fetchEventProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("event_products")
          .select(`
            id,
            product_id,
            products (
              id,
              name,
              description,
              price,
              image_url
            )
          `)
          .eq("event_id", eventId)
          .eq("business_id", businessId);

        if (error) throw error;
        setEventProducts(data || []);
      } catch (error: any) {
        console.error("Error fetching event products:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load event products",
        });
      } finally {
        setFetchingProducts(false);
      }
    };

    fetchEventProducts();
  }, [eventId, businessId]);

  const onSubmit = async (values: ProductValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to add products",
      });
      return;
    }

    setLoading(true);

    try {
      // First create the product
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert({
          name: values.name,
          description: values.description || "",
          price: parseFloat(values.price),
          image_url: values.image_url || "",
          business_id: businessId,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Then associate it with the event
      const { error: eventProductError } = await supabase
        .from("event_products")
        .insert({
          event_id: eventId,
          product_id: product.id,
          business_id: businessId,
        });

      if (eventProductError) throw eventProductError;

      toast({
        title: "Product Added",
        description: "Your product has been added to this event",
      });

      // Reset form and refresh product list
      form.reset();
      setEventProducts([...eventProducts, {
        id: Date.now().toString(), // Temporary ID
        product_id: product.id,
        products: product
      }]);
    } catch (error: any) {
      console.error("Error adding product:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to add product",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Products for This Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter product description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="image_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                 )}
              />
              
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Product"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Products</CardTitle>
        </CardHeader>
        <CardContent>
          {fetchingProducts ? (
            <div>Loading products...</div>
          ) : eventProducts.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <p>No products added for this event yet.</p>
              <p className="text-sm mt-1">Add products above to showcase at this event!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventProducts.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold">{item.products.name}</h4>
                      <p className="text-sm text-gray-500">{item.products.description || "No description"}</p>
                      <p className="text-sm font-medium mt-1">${parseFloat(item.products.price).toFixed(2)}</p>
                    </div>
                    {item.products.image_url && (
                      <div className="w-16 h-16 bg-gray-100 rounded">
                        <img 
                          src={item.products.image_url} 
                          alt={item.products.name}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EventProductCollection;
