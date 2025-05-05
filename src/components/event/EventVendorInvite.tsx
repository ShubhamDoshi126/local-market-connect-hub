
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SearchIcon, PlusIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface EventVendorInviteProps {
  eventId: string;
}

interface Business {
  id: string;
  name: string;
  description: string | null;
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
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, description")
        .ilike("name", `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;

      setBusinesses(data || []);
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
                    className="flex justify-between items-center p-3 border rounded"
                  >
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
