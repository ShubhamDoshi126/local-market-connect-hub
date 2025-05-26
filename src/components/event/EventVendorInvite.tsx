
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SearchIcon, PlusIcon, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface EventVendorInviteProps {
  eventId: string;
}

interface VendorData {
  business_category: string;
  id: string;
  user_id: string;
}

interface LocationData {
  city: string;
  zip_code: string;
}

interface ProfileData {
  first_name: string;
  last_name: string;
}

interface Business {
  id: string;
  name: string;
  description: string | null;
  vendor?: VendorData;
  locations?: LocationData[];
  profile?: ProfileData;
}

// Interface for the raw Supabase response structure
interface BusinessResponse {
  id: string;
  name: string;
  description: string | null;
  vendors?: Array<VendorData> | { error: true } | null;
  vendor_locations?: Array<LocationData> | { error: true } | null;
}


const EventVendorInvite = ({ eventId }: EventVendorInviteProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [invitedBusinesses, setInvitedBusinesses] = useState<string[]>([]);

  // Fetch businesses that are already invited to this event
  const fetchInvitedBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from("event_vendors")
        .select("business_id")
        .eq("event_id", eventId);

      if (error) throw error;
      
      setInvitedBusinesses(data.map(item => item.business_id || ""));
    } catch (error: any) {
      console.error("Error fetching invited businesses:", error);
    }
  };

  useEffect(() => {
    fetchInvitedBusinesses();
  }, [eventId]);

  const searchBusinesses = async () => {
    if (!searchQuery || searchQuery.length < 2) return;
    
    setLoading(true);
    try {
      // Get businesses with their vendor information and location data
      const { data, error } = await supabase
        .from("businesses")
        .select(`
          id, 
          name, 
          description,
          vendors (
            id,
            business_category,
            user_id
          ),
          vendor_locations (
            city,
            zip_code
          )
        `)
        .ilike("name", `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;

      console.log("Raw business data:", data);

      // Enhance with profile data where available
      if (data && data.length > 0) {
        const enhancedBusinesses: Business[] = await Promise.all(
          data.map(async (business: BusinessResponse) => {
            // Properly handle the vendors array
            const vendorData = business.vendors && business.vendors.length > 0 
              ? business.vendors[0] 
              : undefined;

            // Only fetch profile if we have a vendor with a user_id
            let profileData: ProfileData | undefined = undefined;
            if (vendorData && vendorData.user_id) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("first_name, last_name")
                .eq("id", vendorData.user_id)
                .maybeSingle();
              
              profileData = profile as ProfileData || undefined;
            }

            // Create a properly typed business object with safe defaults
            const businessObj: Business = {
              id: business.id,
              name: business.name,
              description: business.description,
              vendor: vendorData, // This is already of type VendorData or undefined
              locations: Array.isArray(business.vendor_locations) ? business.vendor_locations : [],
              profile: profileData
            };

            return businessObj;
          })
        );

        console.log("Enhanced businesses:", enhancedBusinesses);
        setBusinesses(enhancedBusinesses);
      } else {
        setBusinesses([]);
      }
    } catch (error: any) {
      console.error("Error searching businesses:", error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: error.message || "Failed to search businesses",
      });
    } finally {
      setLoading(false);
    }
  };

  const inviteBusiness = async (businessId: string) => {
    try {
      const { error } = await supabase
        .from("event_vendors")
        .insert({
          event_id: eventId,
          business_id: businessId,
          status: "invited",
        });

      if (error) throw error;

      setInvitedBusinesses([...invitedBusinesses, businessId]);
      
      toast({
        title: "Vendor Invited",
        description: "The vendor has been invited to your event",
      });
    } catch (error: any) {
      console.error("Error inviting business:", error);
      toast({
        variant: "destructive",
        title: "Invitation Error",
        description: error.message || "Failed to invite vendor",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invite Vendors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="flex-grow">
              <Input
                placeholder="Search vendors by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchBusinesses()}
              />
            </div>
            <Button onClick={searchBusinesses} disabled={loading}>
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              {businesses.length > 0 ? (
                businesses.map((business) => (
                  <div
                    key={business.id}
                    className="flex flex-col p-3 border rounded"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{business.name}</h3>
                        <p className="text-sm text-gray-500">
                          {business.description || "No description"}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => inviteBusiness(business.id)}
                        disabled={invitedBusinesses.includes(business.id)}
                      >
                        {invitedBusinesses.includes(business.id) ? (
                          "Invited"
                        ) : (
                          <>
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Invite
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-2">
                      {business.vendor && business.vendor.business_category && (
                        <Badge variant="secondary">{business.vendor.business_category}</Badge>
                      )}
                      
                      {business.locations && business.locations.length > 0 && (
                        <div className="flex items-center text-xs text-gray-600">
                          <MapPin className="h-3 w-3 mr-1" />
                          {business.locations[0].city}, {business.locations[0].zip_code}
                        </div>
                      )}
                      
                      {business.profile && (
                        <div className="text-xs text-gray-600 ml-auto">
                          Contact: {business.profile.first_name} {business.profile.last_name}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : searchQuery ? (
                <p className="text-center py-3 text-gray-500">
                  No vendors found matching your search
                </p>
              ) : null}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EventVendorInvite;
