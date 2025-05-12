
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorFormSchema, VendorFormValues, categories } from "./vendorFormSchema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useVendorSubmission } from "./useVendorSubmission";
import BusinessInfoSection from "./BusinessInfoSection";
import LocationSection from "./LocationSection";
import SocialMediaSection from "./SocialMediaSection";
import TermsConditionsSection from "./TermsConditionsSection";
import { Button } from "@/components/ui/button";

const VendorForm = () => {
  const { handleSubmit, loading } = useVendorSubmission();

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      businessName: "",
      contactName: "",
      email: "",
      phone: "",
      description: "",
      category: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      website: "",
      instagram: "",
      termsAccepted: false
    },
  });

  const onSubmit = (values: VendorFormValues) => {
    handleSubmit(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Information */}
        <BusinessInfoSection control={form.control} />
        
        {/* Location Information */}
        <LocationSection control={form.control} form={form} />
        
        {/* Social Media */}
        <SocialMediaSection control={form.control} />

        <TermsConditionsSection control={form.control} />
        
        <div className="pt-4">
          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? "Creating Business..." : "Create Business"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VendorForm;
