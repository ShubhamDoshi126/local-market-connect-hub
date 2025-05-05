
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Calendar, CheckCircle, XCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

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

interface VendorEventInvitesProps {
  businessId: string;
}

const VendorEventInvites = ({ businessId }: VendorEventInvitesProps) => {
  const [invites, setInvites] = useState<EventInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchInvites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_vendors")
        .select(`
          id,
          status,
          events:event_id(
            id,
            name,
            date,
            location,
            city
          )
        `)
        .eq("business_id", businessId);

      if (error) throw error;

      // Transform the data to match the EventInvite interface
      const transformedData: EventInvite[] = data.map(item => ({
        id: item.id,
        status: item.status,
        event: {
          id: item.events.id,
          name: item.events.name,
          date: item.events.date,
          location: item.events.location,
          city: item.events.city
        }
      }));

      setInvites(transformedData);
    } catch (error: any) {
      console.error("Error fetching event invites:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load event invites",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInviteResponse = async (inviteId: string, accept: boolean) => {
    try {
      const { error } = await supabase
        .from("event_vendors")
        .update({ status: accept ? "confirmed" : "declined" })
        .eq("id", inviteId);

      if (error) throw error;

      toast({
        title: accept ? "Invite Accepted" : "Invite Declined",
        description: accept 
          ? "You've successfully joined this event" 
          : "You've declined this event invite",
      });

      fetchInvites();
    } catch (error: any) {
      console.error("Error responding to invite:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not process your response",
      });
    }
  };

  useEffect(() => {
    fetchInvites();
  }, [businessId]);

  const pendingInvites = invites.filter(invite => invite.status === "invited");
  const respondedInvites = invites.filter(invite => invite.status !== "invited");

  if (loading) {
    return <div>Loading event invites...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-500" />
          Event Invitations
        </CardTitle>
        <CardDescription>
          Manage your event participation and invitations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {invites.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>No event invitations yet.</p>
            <p className="text-sm mt-1">When event organizers invite you, they'll appear here!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingInvites.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Pending Invitations</h3>
                <div className="space-y-3">
                  {pendingInvites.map(invite => (
                    <div key={invite.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{invite.event.name}</h4>
                          <div className="text-sm text-muted-foreground">
                            <p>{invite.event.location}, {invite.event.city}</p>
                            <p>
                              {format(parseISO(invite.event.date), "MMMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                          <AlertCircle className="h-3.5 w-3.5 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          onClick={() => handleInviteResponse(invite.id, true)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleInviteResponse(invite.id, false)}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {respondedInvites.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Recent Responses</h3>
                <div className="space-y-3">
                  {respondedInvites.map(invite => (
                    <div key={invite.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{invite.event.name}</h4>
                          <div className="text-sm text-muted-foreground">
                            <p>{invite.event.location}, {invite.event.city}</p>
                            <p>
                              {format(parseISO(invite.event.date), "MMMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        {invite.status === "confirmed" ? (
                          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Confirmed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Declined
                          </Badge>
                        )}
                      </div>
                      {invite.status === "confirmed" && (
                        <div className="mt-3">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate(`/events/${invite.event.id}`)}
                          >
                            View Event
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VendorEventInvites;
