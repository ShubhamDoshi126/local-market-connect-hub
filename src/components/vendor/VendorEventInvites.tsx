
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, MapPinIcon, CheckIcon, XIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface EventInvite {
  id: string;
  status: string;
  event: {
    id: string;
    name: string;
    date: string;
    location: string;
    city: string;
  };
}

const VendorEventInvites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [invites, setInvites] = useState<EventInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);

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
    const fetchInvites = async () => {
      if (!businessId) return;
      
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("event_vendors")
          .select(`
            id, 
            status,
            events:event_id (
              id,
              name,
              date,
              location,
              city
            )
          `)
          .eq("business_id", businessId);

        if (error) throw error;

        setInvites(data as EventInvite[] || []);
      } catch (error: any) {
        console.error("Error fetching invites:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load event invitations",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInvites();
  }, [businessId]);

  const updateInviteStatus = async (inviteId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("event_vendors")
        .update({ status })
        .eq("id", inviteId);

      if (error) throw error;

      // Update local state
      setInvites(
        invites.map((invite) =>
          invite.id === inviteId ? { ...invite, status } : invite
        )
      );

      toast({
        title: status === "accepted" ? "Invitation Accepted" : "Invitation Declined",
        description: status === "accepted" 
          ? "You have accepted the invitation to participate in this event" 
          : "You have declined the invitation to this event",
      });
    } catch (error: any) {
      console.error("Error updating invitation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update invitation status",
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-4">Please log in to view your invitations</p>
        </CardContent>
      </Card>
    );
  }

  if (!businessId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-4">You need to be associated with a business to receive invitations</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Invitations</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : invites.length === 0 ? (
          <p className="text-center py-4 text-gray-500">
            You don't have any event invitations yet
          </p>
        ) : (
          <div className="space-y-4">
            {invites.map((invite) => (
              <div 
                key={invite.id}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Link to={`/events/${invite.event.id}`} className="text-lg font-medium hover:underline">
                      {invite.event.name}
                    </Link>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(invite.event.date).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <MapPinIcon className="h-4 w-4 mr-1" />
                      <span>
                        {invite.event.location}, {invite.event.city}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      invite.status === "accepted" ? "default" :
                      invite.status === "declined" ? "destructive" :
                      "outline"
                    }
                  >
                    {invite.status === "invited" ? "Pending" : 
                     invite.status.charAt(0).toUpperCase() + invite.status.slice(1)}
                  </Badge>
                </div>

                {invite.status === "invited" && (
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={() => updateInviteStatus(invite.id, "accepted")}
                    >
                      <CheckIcon className="h-4 w-4 mr-2" />
                      Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => updateInviteStatus(invite.id, "declined")}
                    >
                      <XIcon className="h-4 w-4 mr-2" />
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorEventInvites;
