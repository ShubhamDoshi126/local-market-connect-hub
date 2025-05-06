
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/card";

const joinBusinessSchema = z.object({
  inviteCode: z.string().min(6, "Invite code must be at least 6 characters"),
});

type JoinBusinessValues = z.infer<typeof joinBusinessSchema>;

interface BusinessSearchResult {
  id: string;
  name: string;
  description: string | null;
}

const JoinBusinessForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<BusinessSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const form = useForm<JoinBusinessValues>({
    resolver: zodResolver(joinBusinessSchema),
    defaultValues: {
      inviteCode: "",
    },
  });

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 3) {
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Please enter at least 3 characters to search",
      });
      return;
    }

    setSearching(true);

    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, description")
        .ilike("name", `%${searchQuery}%`)
        .limit(5);

      if (error) throw error;

      setSearchResults(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Search Error",
        description: error.message || "Failed to search for businesses",
      });
    } finally {
      setSearching(false);
    }
  };

  const joinBusiness = async (businessId: string) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to join a business",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // First check if user is already a member of this business
      const { data: existingMember } = await supabase
        .from("business_members")
        .select("id")
        .eq("business_id", businessId)
        .eq("user_id", user.id)
        .single();

      if (existingMember) {
        toast({
          title: "Already a member",
          description: "You are already a member of this business",
        });
        navigate(`/business/${businessId}`);
        return;
      }

      // Create vendor record if it doesn't exist yet
      const { data: existingVendor } = await supabase
        .from("vendors")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingVendor) {
        // Get business details to use for vendor creation
        const { data: business } = await supabase
          .from("businesses")
          .select("name, description")
          .eq("id", businessId)
          .single();

        if (!business) throw new Error("Business not found");

        // Create vendor profile with approved status
        const { error: vendorError } = await supabase
          .from("vendors")
          .insert({
            id: user.id,
            business_id: businessId,
            business_name: business.name,
            business_category: "other", // Default category
            description: "",
            user_id: user.id,
            status: "approved" // Set to approved by default
          });

        if (vendorError) throw vendorError;
      } else {
        // Update existing vendor with the new business_id
        const { error: updateError } = await supabase
          .from("vendors")
          .update({ 
            business_id: businessId,
            status: "approved" // Ensure status is approved
          })
          .eq("id", user.id);

        if (updateError) throw updateError;
      }

      // Add user to business_members
      const { error: memberError } = await supabase
        .from("business_members")
        .insert({
          business_id: businessId,
          user_id: user.id,
          role: "member", // Default role
        });

      if (memberError) throw memberError;

      toast({
        title: "Success!",
        description: "You have successfully joined the business as an approved vendor",
      });
      navigate(`/business/${businessId}`);
    } catch (error: any) {
      console.error("Error joining business:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to join business",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: JoinBusinessValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to join a business",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);

    try {
      // Validate the invite code
      const { data: invite, error: inviteError } = await supabase
        .from("business_invites")
        .select("business_id")
        .eq("code", values.inviteCode)
        .eq("status", "active")
        .maybeSingle();

      if (inviteError || !invite) {
        throw new Error("Invalid or expired invite code");
      }

      await joinBusiness(invite.business_id);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to join business with invite code",
      });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Search for a Business</h2>
        <div className="flex space-x-2">
          <Input
            placeholder="Enter business name..."
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
                      onClick={() => joinBusiness(business.id)}
                      disabled={loading}
                    >
                      Join
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

      <div className="space-y-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">Or</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Join with Invite Code</h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="inviteCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invite Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter invite code..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={loading}>
              {loading ? "Joining..." : "Join Business"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export default JoinBusinessForm;
