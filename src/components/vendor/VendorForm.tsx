
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorFormSchema, VendorFormValues } from "./vendorFormSchema";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import BusinessInfoSection from "./BusinessInfoSection";
import LocationSection from "./LocationSection";
import SocialMediaSection from "./SocialMediaSection";
import TermsConditionsSection from "./TermsConditionsSection";
import { useVendorSubmission } from "./useVendorSubmission";

const VendorForm = () => {
  const { handleSubmit: submitVendor, loading } = useVendorSubmission();

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

  const onSubmit = async (values: VendorFormValues) => {
    await submitVendor(values);
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

        {/* Terms and Conditions */}
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
