// src/components/event/EventVendorInviteForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Business {
  id: string;
  name: string;
  description: string | null;
}

const EventVendorInviteForm = ({ eventId }: { eventId: string }) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [searching, setSearching] = useState(false);
  const [inviting, setInviting] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Please enter at least 2 characters to search",
      });
      return;
    }

    setSearching(true);

    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, description")
        .or(`name.ilike.%${searchQuery}%`)
        .limit(10);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        variant: "destructive",
        title: "Search Error",
        description: error.message || "Failed to search for businesses",
      });
    } finally {
      setSearching(false);
    }
  };

  const inviteVendor = async (businessId: string) => {
    setInviting(true);

    try {
      // Check if already invited
      const { data: existingInvite } = await supabase
        .from("event_vendors")
        .select("id")
        .eq("event_id", eventId)
        .eq("business_id", businessId)
        .maybeSingle();

      if (existingInvite) {
        toast({
          title: "Already Invited",
          description: "This business has already been invited to this event",
        });
        return;
      }

      // Create the invitation
      const { error } = await supabase
        .from("event_vendors")
        .insert({
          event_id: eventId,
          business_id: businessId,
          status: "invited" // Initial status is 'invited'
        });

      if (error) throw error;

      toast({
        title: "Vendor Invited",
        description: "The vendor has been successfully invited to this event",
      });
    } catch (error: any) {
      console.error("Error inviting vendor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to invite vendor",
      });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Invite Vendors to Event</h2>
      
      <div className="flex space-x-2">
        <Input
          placeholder="Search for businesses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-grow"
        />
        <Button 
          onClick={handleSearch}
          disabled={searching}
          type="button"
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>

      {searchResults.length > 0 && (
        <div className="space-y-4 mt-4">
          <h3 className="text-md font-medium">Search Results:</h3>
          <div className="space-y-3">
            {searchResults.map((business) => (
              <Card key={business.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{business.name}</h4>
                    <p className="text-sm text-gray-500">{business.description || "No description available"}</p>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => inviteVendor(business.id)}
                    disabled={inviting}
                  >
                    Invite
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {searchResults.length === 0 && searchQuery && !searching && (
        <p className="text-center text-gray-500 py-2">No businesses found matching "{searchQuery}"</p>
      )}
    </div>
  );
};

export default EventVendorInviteForm;
