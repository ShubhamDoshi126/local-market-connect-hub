
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

const productSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  description: z.string().optional(),
  price: z.string().optional().refine(
    (val) => !val || !isNaN(parseFloat(val)),
    { message: "Price must be a valid number" }
  ),
  image_url: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const BusinessProducts = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Check business membership
  const { data: membership, isLoading } = useQuery({
    queryKey: ["businessAccess", id, user?.id],
    queryFn: async () => {
      if (!user) return null;

      // Check if user is the business creator
      const { data: business } = await supabase
        .from("businesses")
        .select("created_by, name")
        .eq("id", id)
        .single();

      if (business && business.created_by === user.id) {
        return { hasAccess: true, businessName: business.name };
      }

      // Check if user is a member
      const { data: member } = await supabase
        .from("business_members")
        .select("*, businesses(name)")
        .eq("business_id", id)
        .eq("user_id", user.id)
        .single();

      if (member) {
        return { hasAccess: true, businessName: member.businesses?.name };
      }

      return { hasAccess: false, businessName: business?.name };
    },
    enabled: !!id && !!user,
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      image_url: "",
    },
  });

  const onSubmit = async (values: ProductFormValues) => {
    if (!user || !id) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to add products.",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const productData = {
        business_id: id,
        name: values.name,
        description: values.description || null,
        price: values.price ? parseFloat(values.price) : null,
        image_url: values.image_url || null,
      };

      const { data, error } = await supabase
        .from("products")
        .insert(productData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Product added!",
        description: "Your product has been successfully added.",
      });

      // Reset form after successful submission
      form.reset();

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error adding product",
        description: error.message || "There was an error adding your product.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Redirect if not logged in or not a member
  if (!isLoading && (!user || (membership && !membership.hasAccess))) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="mb-8">You don't have permission to add products to this business.</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Add a Product</h1>
            {membership?.businessName && (
              <p className="mt-2 text-lg text-gray-600">
                For {membership.businessName}
              </p>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-lg shadow">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
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
                      <Textarea 
                        placeholder="Describe your product (optional)" 
                        className="min-h-[100px]" 
                        {...field} 
                      />
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
                    <FormLabel>Price (optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="text"
                        placeholder="0.00"
                        {...field} 
                      />
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
                      <Input 
                        placeholder="https://example.com/image.jpg"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-between">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate(`/business/${id}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Adding Product..." : "Add Product"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BusinessProducts;
