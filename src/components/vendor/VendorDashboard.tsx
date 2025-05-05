
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Store, Calendar, PackageSearch, Users, ShoppingBag, Heart } from "lucide-react";
import VendorEventInvites from "./VendorEventInvites";

interface Product {
  id: string;
  name: string;
  interest_count: number;
}

interface EventStats {
  total: number;
  upcoming: number;
  past: number;
}

const VendorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [productStats, setProductStats] = useState<Product[]>([]);
  const [eventStats, setEventStats] = useState<EventStats>({ total: 0, upcoming: 0, past: 0 });
  const [totalInterests, setTotalInterests] = useState(0);

  useEffect(() => {
    const fetchVendorData = async () => {
      if (!user) return;

      try {
        // Get vendor details
        const { data: vendorData, error: vendorError } = await supabase
          .from("vendors")
          .select("business_id, business_name")
          .eq("user_id", user.id)
          .maybeSingle();

        if (vendorError) throw vendorError;
        
        if (!vendorData || !vendorData.business_id) {
          setLoading(false);
          return;
        }

        setBusinessId(vendorData.business_id);
        setBusinessName(vendorData.business_name);

        // Get product interest stats
        const { data: productsWithInterest, error: productsError } = await supabase
          .from("products")
          .select("id, name")
          .eq("business_id", vendorData.business_id);

        if (productsError) throw productsError;

        // Count interests for each product
        const productsWithCounts = await Promise.all(
          productsWithInterest.map(async (product) => {
            // For each product, count the interests
            const { count, error: countError } = await supabase
              .from("product_interests")
              .select("*", { count: "exact", head: true })
              .eq("product_id", product.id);

            if (countError) {
              console.error("Error counting interests:", countError);
              return { ...product, interest_count: 0 };
            }

            return { ...product, interest_count: count || 0 };
          })
        );

        // Sort by interest count (highest first)
        productsWithCounts.sort((a, b) => b.interest_count - a.interest_count);
        
        setProductStats(productsWithCounts);
        setTotalInterests(productsWithCounts.reduce((sum, product) => sum + product.interest_count, 0));

        // Get event stats
        const today = new Date().toISOString().split('T')[0];
        
        // Get all events the vendor is participating in
        const { data: events, error: eventsError } = await supabase
          .from("event_vendors")
          .select(`
            event_id,
            status, 
            events(date)
          `)
          .eq("business_id", vendorData.business_id)
          .eq("status", "confirmed");

        if (eventsError) throw eventsError;

        const totalEvents = events.length;
        const upcomingEvents = events.filter(e => e.events.date >= today).length;
        const pastEvents = totalEvents - upcomingEvents;

        setEventStats({
          total: totalEvents,
          upcoming: upcomingEvents,
          past: pastEvents
        });
      } catch (error: any) {
        console.error("Error fetching vendor data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load vendor dashboard data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [user]);

  if (loading) {
    return <div>Loading vendor dashboard...</div>;
  }

  if (!businessId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome to your Vendor Dashboard</CardTitle>
          <CardDescription>
            You need to register as a vendor or join a business to access the full dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/vendor-signup")}>
            Register as a Vendor
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{businessName}</h1>
          <p className="text-muted-foreground">
            Welcome to your vendor dashboard
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => navigate(`/business/${businessId}`)}
          >
            <Store className="h-4 w-4 mr-2" />
            View Business Page
          </Button>
          <Button 
            onClick={() => navigate(`/business/${businessId}/products`)}
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Manage Products
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Customer Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Heart className="h-4 w-4 mr-2 text-rose-500" />
              <div className="text-2xl font-bold">{totalInterests}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Upcoming Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-blue-500" />
              <div className="text-2xl font-bold">{eventStats.upcoming}</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <PackageSearch className="h-4 w-4 mr-2 text-emerald-500" />
              <div className="text-2xl font-bold">{productStats.length}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="interests">
        <TabsList>
          <TabsTrigger value="interests">Product Interests</TabsTrigger>
          <TabsTrigger value="invites">Event Invites</TabsTrigger>
        </TabsList>
        
        <TabsContent value="interests">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-rose-500" />
                Top Products by Interest
              </CardTitle>
              <CardDescription>
                These products are receiving the most interest from potential customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {productStats.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <p>No product interest data available yet.</p>
                  <p className="text-sm mt-1">Add products to your business to track customer interest!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {productStats.slice(0, 5).map(product => (
                    <div key={product.id} className="flex justify-between border-b pb-2">
                      <span>{product.name}</span>
                      <span className="font-medium flex items-center">
                        <Heart className="h-3 w-3 mr-1 text-rose-500" />
                        {product.interest_count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {productStats.length > 0 && (
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/business/${businessId}/products`)}
                    className="w-full"
                  >
                    View All Products
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="invites">
          {businessId && <VendorEventInvites businessId={businessId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VendorDashboard;
