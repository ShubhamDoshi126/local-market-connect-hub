
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import VendorEventInvites from "./VendorEventInvites";

interface ProductInterest {
  product_id: string;
  product_name: string;
  event_id: string;
  event_name: string;
  interest_count: number;
}

const VendorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [productInterests, setProductInterests] = useState<ProductInterest[]>([]);

  useEffect(() => {
    const fetchUserBusiness = async () => {
      if (!user) return;

      try {
        // First check if user is a vendor
        const { data: vendorData } = await supabase
          .from("vendors")
          .select("business_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (vendorData?.business_id) {
          setBusinessId(vendorData.business_id);
          return;
        }

        // If not a direct vendor, check if they're a business member
        const { data: memberData } = await supabase
          .from("business_members")
          .select("business_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberData?.business_id) {
          setBusinessId(memberData.business_id);
        }
      } catch (error) {
        console.error("Error fetching business:", error);
      }
    };

    fetchUserBusiness();
  }, [user]);

  useEffect(() => {
    const fetchProductInterests = async () => {
      if (!businessId) return;
      
      setLoading(true);
      try {
        // Get products for this business
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select("id, name")
          .eq("business_id", businessId);

        if (productsError) throw productsError;

        if (!products || products.length === 0) {
          setProductInterests([]);
          setLoading(false);
          return;
        }

        // Get event products for this business
        const { data: eventProducts, error: eventProductsError } = await supabase
          .from("event_products")
          .select(`
            product_id,
            event_id,
            events (
              name
            )
          `)
          .eq("business_id", businessId);

        if (eventProductsError) throw eventProductsError;

        // Map product IDs to their names
        const productMap = products.reduce((acc, product) => {
          acc[product.id] = product.name;
          return acc;
        }, {} as Record<string, string>);

        // Get interest counts
        const allInterests: ProductInterest[] = [];
        
        for (const eventProduct of eventProducts) {
          const { data: interests, error: interestsError } = await supabase
            .from("product_interests")
            .select("count")
            .eq("event_id", eventProduct.event_id)
            .eq("product_id", eventProduct.product_id)
            .count();

          if (interestsError) continue;

          allInterests.push({
            product_id: eventProduct.product_id || "",
            product_name: productMap[eventProduct.product_id || ""] || "Unknown Product",
            event_id: eventProduct.event_id || "",
            event_name: eventProduct.events?.name || "Unknown Event",
            interest_count: interests.count || 0
          });
        }

        setProductInterests(allInterests);
      } catch (error: any) {
        console.error("Error fetching product interests:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load product interest data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProductInterests();
  }, [businessId]);

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-4">Please log in to view your dashboard</p>
        </CardContent>
      </Card>
    );
  }

  if (!businessId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-4">You need to be associated with a business to view the dashboard</p>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = productInterests
    .filter(item => item.interest_count > 0)
    .map(item => ({
      name: item.product_name.length > 20 
        ? item.product_name.substring(0, 20) + '...' 
        : item.product_name,
      interests: item.interest_count,
      event: item.event_name
    }));

  return (
    <div className="space-y-6">
      <Tabs defaultValue="invites">
        <TabsList>
          <TabsTrigger value="invites">Event Invitations</TabsTrigger>
          <TabsTrigger value="interests">Product Interests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invites" className="pt-4">
          <VendorEventInvites />
        </TabsContent>
        
        <TabsContent value="interests" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Interest Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-72 w-full" />
              ) : chartData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No product interests recorded yet</p>
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45} 
                        textAnchor="end" 
                        height={70} 
                      />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name, props) => [
                          `${value} interests`, props.payload.event
                        ]} 
                      />
                      <Bar dataKey="interests" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              
              {!loading && chartData.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-medium mb-2">Most Interested Products</h3>
                  <ul className="space-y-2">
                    {productInterests
                      .sort((a, b) => b.interest_count - a.interest_count)
                      .slice(0, 5)
                      .map((item, index) => (
                        <li key={item.product_id + item.event_id} className="flex justify-between">
                          <div>
                            <span className="font-medium">{item.product_name}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              at {item.event_name}
                            </span>
                          </div>
                          <span className="font-medium">{item.interest_count} interests</span>
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorDashboard;
