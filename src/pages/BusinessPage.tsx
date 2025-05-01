import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Instagram, Globe, MapPin, Plus } from "lucide-react";

interface VendorData {
  business_category?: string;
  description?: string | null;
  website?: string | null;
  instagram?: string | null;
}

interface LocationData {
  address?: string;
  city?: string;
  zip_code?: string;
}

interface BusinessData {
  id: string;
  name: string;
  description: string | null;
  created_at: string | null;
  created_by: string;
  vendors?: VendorData[];
  vendor_locations?: LocationData[];
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
}

interface EventData {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  city: string;
}

interface EventVendorData {
  status: string;
  events: EventData | null;
}

const BusinessPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isMember, setIsMember] = useState(false);
  
  // Fetch business details
  const { data: business, isLoading: loadingBusiness } = useQuery({
    queryKey: ["business", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(`
          *,
          vendors (
            business_category,
            description,
            website,
            instagram
          ),
          vendor_locations (
            address,
            city,
            zip_code
          )
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      
      // Handle possible SelectQueryError by providing default empty arrays
      const result = {
        ...data,
        vendors: Array.isArray(data.vendors) ? data.vendors : [],
        vendor_locations: Array.isArray(data.vendor_locations) ? data.vendor_locations : []
      } as BusinessData;
      
      return result;
    },
    enabled: !!id,
  });

  // Check if user is a member of this business
  useQuery({
    queryKey: ["businessMembership", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("business_members")
        .select("*")
        .eq("business_id", id)
        .eq("user_id", user.id)
        .single();
      
      if (!error && data) {
        setIsMember(true);
      } else {
        // Also check if user is the creator
        const { data: businessData } = await supabase
          .from("businesses")
          .select("created_by")
          .eq("id", id)
          .single();
        
        if (businessData && businessData.created_by === user.id) {
          setIsMember(true);
        }
      }
      
      return data;
    },
    enabled: !!id && !!user,
  });

  // Fetch upcoming events where this business is participating
  const { data: events, isLoading: loadingEvents } = useQuery({
    queryKey: ["businessEvents", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_vendors")
        .select(`
          status,
          events (
            id,
            name,
            date,
            start_time,
            end_time,
            location,
            city
          )
        `)
        .eq("business_id", id)
        .eq("status", "accepted");
      
      if (error) throw error;
      return data as EventVendorData[];
    },
    enabled: !!id,
  });

  // Fetch products for this business
  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["businessProducts", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("business_id", id);
      
      if (error) throw error;
      return data as ProductData[];
    },
    enabled: !!id,
  });

  if (loadingBusiness) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <p>Loading business details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Business Not Found</h1>
            <p className="mb-8">The business you're looking for doesn't exist or has been removed.</p>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const vendor: VendorData = business?.vendors && business.vendors.length > 0 ? business.vendors[0] : {};
  const location: LocationData = business?.vendor_locations && business.vendor_locations.length > 0 ? business.vendor_locations[0] : {};

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            {/* Business Header */}
            <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold">{business.name}</h1>
                <p className="text-gray-600 mt-1">
                  {vendor.business_category?.replace('-', ' ')}
                </p>
              </div>

              {isMember && (
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link to={`/business/${id}/edit`}>Edit Business</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to={`/business/${id}/members`}>Manage Members</Link>
                  </Button>
                </div>
              )}
            </div>

            <Tabs defaultValue="about" className="w-full">
              <TabsList>
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="products">Products</TabsTrigger>
                <TabsTrigger value="events">Events</TabsTrigger>
              </TabsList>
              
              <TabsContent value="about" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-4">About</h2>
                    <p className="text-gray-700 mb-6">
                      {vendor.description || business.description || "No description available."}
                    </p>
                    
                    {location && (location.address || location.city) && (
                      <div className="mb-6">
                        <h3 className="text-lg font-medium mb-2">Location</h3>
                        <div className="flex items-start">
                          <MapPin className="h-5 w-5 mr-2 text-gray-500 mt-0.5" />
                          <span>
                            {location.address && <>{location.address}, <br /></>}
                            {location.city} {location.zip_code}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-4">
                      {vendor.website && (
                        <a 
                          href={vendor.website.startsWith('http') ? vendor.website : `https://${vendor.website}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-600 hover:text-blue-800"
                        >
                          <Globe className="h-4 w-4 mr-1" />
                          <span>Website</span>
                        </a>
                      )}
                      
                      {vendor.instagram && (
                        <a 
                          href={`https://instagram.com/${vendor.instagram.replace('@', '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-pink-600 hover:text-pink-800"
                        >
                          <Instagram className="h-4 w-4 mr-1" />
                          <span>Instagram</span>
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="products" className="mt-6">
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Products</h2>
                  {isMember && (
                    <Button asChild>
                      <Link to={`/business/${id}/products`}>
                        <Plus className="h-4 w-4 mr-2" /> Add Product
                      </Link>
                    </Button>
                  )}
                </div>
                
                {loadingProducts ? (
                  <p>Loading products...</p>
                ) : products && products.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                      <Card key={product.id} className="overflow-hidden">
                        {product.image_url && (
                          <div className="aspect-w-16 aspect-h-9 h-48">
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <CardContent className="p-4">
                          <h3 className="font-semibold">{product.name}</h3>
                          {product.price && (
                            <p className="font-medium text-gray-900">
                              ${parseFloat(product.price).toFixed(2)}
                            </p>
                          )}
                          {product.description && (
                            <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500 mb-4">No products available yet.</p>
                      {isMember && (
                        <Button asChild>
                          <Link to={`/business/${id}/products`}>
                            <Plus className="h-4 w-4 mr-2" /> Add Your First Product
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="events" className="mt-6">
                <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
                
                {loadingEvents ? (
                  <p>Loading events...</p>
                ) : events && events.length > 0 ? (
                  <div className="space-y-4">
                    {events.map((ev) => ev.events && (
                      <Link key={ev.events.id} to={`/events/${ev.events.id}`}>
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <h3 className="font-semibold">{ev.events.name}</h3>
                            <div className="text-sm text-gray-600">
                              {new Date(ev.events.date).toLocaleDateString()}
                              {' '}• {ev.events.start_time.substring(0, 5)} - {ev.events.end_time.substring(0, 5)}
                            </div>
                            <div className="text-sm text-gray-600 flex items-center mt-1">
                              <MapPin className="h-3.5 w-3.5 mr-1" />
                              {ev.events.location}, {ev.events.city}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-500">No upcoming events scheduled.</p>
                      {isMember && (
                        <div className="mt-4">
                          <Link to="/events">
                            <Button variant="outline">Browse Available Events</Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BusinessPage;
