
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

      // Check if the user already has a vendor profile
      const { data: existingVendor } = await supabase
        .from("vendors")
        .select("id, business_id")
        .eq("id", user.id)
        .maybeSingle();
      
      let businessId;
      
      // If vendor already exists, use their existing business ID
      if (existingVendor) {
        businessId = existingVendor.business_id;
        
        // Update the vendor information instead of creating a new record
        const { error: vendorUpdateError } = await supabase
          .from("vendors")
          .update({
            business_name: values.businessName,
            business_category: values.category,
            description: values.description,
            website: values.website || null,
            instagram: values.instagram || null,
          })
          .eq("id", user.id);

        if (vendorUpdateError) throw vendorUpdateError;
      } else {
        // 1. First create a business directly
        // Using direct business creation instead of RPC to avoid type issues
        const { data: directBusiness, error: directBusinessError } = await supabase
          .from("businesses")
          .insert({
            name: values.businessName,
            description: values.description,
            created_by: user.id
          })
          .select()
          .single();
        
        if (directBusinessError) {
          // If direct insert fails, try using our Edge Function
          const { data, error } = await supabase.functions.invoke('create_business_function', {
            body: {
              name: values.businessName,
              description: values.description,
              user_id: user.id
            }
          });
          
          if (error) throw new Error(error.message || "Failed to create business");
          businessId = data?.id;
        } else {
          businessId = directBusiness.id;
        }

        if (!businessId) {
          throw new Error("Failed to create business");
        }
        
        // 2. Then create the vendor profile connected to the business
        // IMPORTANT: Set the ID explicitly to the user's ID to prevent duplicate key violations
        const { error: vendorError } = await supabase
          .from("vendors")
          .insert({
            id: user.id, // Using user.id directly to satisfy the foreign key constraint
            business_id: businessId,
            business_name: values.businessName,
            business_category: values.category,
            description: values.description, 
            website: values.website || null,
            instagram: values.instagram || null,
            user_id: user.id, // This is crucial for RLS policies
          });

        if (vendorError) throw vendorError;
      }

      // 3. Update or create vendor location
      if (existingVendor) {
        // Update existing location
        const { data: existingLocation } = await supabase
          .from("vendor_locations")
          .select("id")
          .eq("vendor_id", user.id)
          .maybeSingle();

        if (existingLocation) {
          const { error: locationUpdateError } = await supabase
            .from("vendor_locations")
            .update({
              address: values.address,
              city: values.city,
              zip_code: values.zipCode
            })
            .eq("id", existingLocation.id);
  
          if (locationUpdateError) throw locationUpdateError;
        } else {
          // If location doesn't exist, insert it
          const { error: locationInsertError } = await supabase
            .from("vendor_locations")
            .insert({
              vendor_id: user.id,
              address: values.address,
              city: values.city,
              zip_code: values.zipCode
            });
  
          if (locationInsertError) throw locationInsertError;
        }
      } else {
        // Create new location
        const { error: locationError } = await supabase
          .from("vendor_locations")
          .insert({
            vendor_id: user.id,
            address: values.address,
            city: values.city,
            zip_code: values.zipCode
          });

        if (locationError) throw locationError;
      }

      toast({
        title: existingVendor ? "Business updated!" : "Business created!",
        description: existingVendor 
          ? "You've successfully updated your vendor business." 
          : "You've successfully registered your vendor business.",
      });
      
      navigate("/business/" + businessId);
      
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
