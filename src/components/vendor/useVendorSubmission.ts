
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

      // Check if the user already has a vendor profile - using maybeSingle to avoid errors
      const { data: existingVendor, error: vendorCheckError } = await supabase
        .from("vendors")
        .select("id, business_id")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (vendorCheckError) {
        console.error("Error checking for existing vendor:", vendorCheckError);
      }
      
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
          .eq("user_id", user.id);

        if (vendorUpdateError) {
          console.error("Error updating vendor:", vendorUpdateError);
          throw vendorUpdateError;
        }
      } else {
        // Business creation - First try direct business creation
        try {
          console.log("Creating business directly");
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
            console.error("Direct business creation failed:", directBusinessError);
            throw directBusinessError;
          }
          
          businessId = directBusiness.id;
          console.log("Business created with ID:", businessId);
        } catch (directError) {
          // If direct creation fails, try using Edge Function
          console.log("Direct business creation failed, trying Edge Function");
          const { data, error } = await supabase.functions.invoke('create_business_function', {
            body: {
              name: values.businessName,
              description: values.description,
              user_id: user.id
            }
          });
          
          if (error) {
            console.error("Edge function error:", error);
            throw new Error(error.message || "Failed to create business");
          }
          
          if (!data?.id) {
            throw new Error("Failed to get business ID from edge function");
          }
          
          businessId = data.id;
          console.log("Business created via edge function with ID:", businessId);
        }

        if (!businessId) {
          throw new Error("Failed to create business - no business ID returned");
        }
        
        // Try to create the vendor profile
        try {
          console.log("Creating vendor profile with user ID:", user.id);
          const { error: vendorError } = await supabase
            .from("vendors")
            .insert({
              id: user.id, // Using user.id as the vendor ID
              business_id: businessId,
              business_name: values.businessName,
              business_category: values.category,
              description: values.description, 
              website: values.website || null,
              instagram: values.instagram || null,
              user_id: user.id,
            });

          if (vendorError) {
            console.error("Error creating vendor:", vendorError);
            throw vendorError;
          }
        } catch (vendorCreateError: any) {
          // If there's a duplicate key error, try updating instead
          if (vendorCreateError.code === '23505') {
            console.log("Vendor already exists, updating instead");
            const { error: vendorUpdateError } = await supabase
              .from("vendors")
              .update({
                business_id: businessId,
                business_name: values.businessName,
                business_category: values.category,
                description: values.description,
                website: values.website || null,
                instagram: values.instagram || null,
              })
              .eq("id", user.id);
            
            if (vendorUpdateError) throw vendorUpdateError;
          } else {
            throw vendorCreateError;
          }
        }
      }

      // Handle vendor location - first check if it exists
      const { data: existingLocation } = await supabase
        .from("vendor_locations")
        .select("id")
        .eq("vendor_id", user.id)
        .maybeSingle();

      if (existingLocation) {
        // Update existing location
        const { error: locationUpdateError } = await supabase
          .from("vendor_locations")
          .update({
            address: values.address,
            city: values.city,
            zip_code: values.zipCode
          })
          .eq("id", existingLocation.id);

        if (locationUpdateError) {
          console.error("Error updating location:", locationUpdateError);
          throw locationUpdateError;
        }
      } else {
        // Create new location
        const { error: locationError } = await supabase
          .from("vendor_locations")
          .insert({
            vendor_id: user.id,  // Using user.id as the vendor_id
            address: values.address,
            city: values.city,
            zip_code: values.zipCode
          });

        if (locationError) {
          console.error("Error creating location:", locationError);
          throw locationError;
        }
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
