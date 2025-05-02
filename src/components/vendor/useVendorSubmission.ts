
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { VendorFormValues } from "./vendorFormSchema";

export const useVendorSubmission = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: VendorFormValues) => {
    setLoading(true);
    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "You must be logged in to submit a vendor application.",
        });
        navigate("/auth");
        return;
      }

      // 1. First create a business
      const { data: business, error: businessError } = await supabase
        .from("businesses")
        .insert({
          name: values.businessName,
          description: values.description,
          created_by: user.id
        })
        .select()
        .single();

      if (businessError) throw businessError;

      if (!business) {
        throw new Error("Failed to create business");
      }

      // 2. Then create the vendor profile connected to the business
      // Generate a UUID for the vendor ID first
      const { data: vendorId } = await supabase.rpc('gen_random_uuid');
      
      const { error: vendorError } = await supabase
        .from("vendors")
        .insert({
          id: vendorId,
          business_id: business.id,
          business_name: values.businessName,
          business_category: values.category,
          description: values.description, 
          website: values.website || null,
          instagram: values.instagram || null,
          user_id: user.id, // This is crucial for RLS policies
        });

      if (vendorError) throw vendorError;

      // 3. Add vendor location
      const { error: locationError } = await supabase
        .from("vendor_locations")
        .insert({
          vendor_id: vendorId,
          address: values.address,
          city: values.city,
          zip_code: values.zipCode
        });

      if (locationError) throw locationError;

      toast({
        title: "Business created!",
        description: "You've successfully registered your vendor business.",
      });
      navigate("/business/" + business.id);
      
      return { success: true };
    } catch (error: any) {
      console.error("Error creating vendor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred while submitting your application.",
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return { handleSubmit, loading };
};
