
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorFormSchema, VendorFormValues, categories } from "./vendorFormSchema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { useVendorSubmission } from "./useVendorSubmission";
import BusinessInfoSection from "./BusinessInfoSection";
import LocationSearch from "@/components/map/LocationSearch";
import SocialMediaSection from "./SocialMediaSection";
import TermsConditionsSection from "./TermsConditionsSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const VendorForm = () => {
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
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

  const handleLocationSelect = (location: { placeName: string; coordinates: [number, number] }) => {
    // Extract components from the location string
    const addressParts = location.placeName.split(', ');
    
    // Basic parsing of the address components - this is simplified and might need adjustment
    if (addressParts.length >= 3) {
      // Set the form values
      form.setValue('address', addressParts[0], { shouldValidate: true });
      
      // Set city - typically the second-to-last or third-to-last part
      const cityIndex = addressParts.length >= 4 ? addressParts.length - 3 : addressParts.length - 2;
      form.setValue('city', addressParts[cityIndex], { shouldValidate: true });
      
      // Set state and zip - typically from the last part
      const stateZip = addressParts[addressParts.length - 2].split(' ');
      if (stateZip.length >= 1) {
        form.setValue('state', stateZip[0], { shouldValidate: true });
      }
      
      // Try to extract ZIP code from the last part
      const zipMatch = addressParts[addressParts.length - 2].match(/\d{5}/);
      if (zipMatch) {
        form.setValue('zipCode', zipMatch[0], { shouldValidate: true });
      }
      
      setSelectedLocation(location.placeName);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Business Information */}
        <BusinessInfoSection control={form.control} />
        
        {/* Location Information */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Location</h2>
          
          <div className="mb-4">
            <label className="block mb-2">Search for your address</label>
            <LocationSearch 
              onLocationSelect={handleLocationSelect} 
              placeholder="Start typing your address..." 
            />
            {selectedLocation && (
              <p className="mt-2 text-sm text-green-600">Address selected: {selectedLocation}</p>
            )}
          </div>
          
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Market St" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem className="col-span-2 md:col-span-2">
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="San Francisco" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>State</FormLabel>
                  <FormControl>
                    <Input placeholder="CA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem className="col-span-1">
                  <FormLabel>ZIP Code</FormLabel>
                  <FormControl>
                    <Input placeholder="94103" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
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
