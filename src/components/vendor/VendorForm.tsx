
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vendorFormSchema, VendorFormValues } from "./vendorFormSchema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import LocationSearch from "@/components/map/LocationSearch";

const VendorForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const form = useForm<VendorFormValues>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      businessName: "",
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
    },
  });

  const onSubmit = async (values: VendorFormValues) => {
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

      // Submit vendor application to Supabase
      const { error } = await supabase.from("vendors").insert({
        user_id: user.id,
        business_name: values.businessName,
        email: values.email,
        phone: values.phone,
        description: values.description,
        category: values.category,
        address: values.address,
        city: values.city,
        state: values.state,
        zip_code: values.zipCode,
        website: values.website || null,
        instagram: values.instagram || null,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Application submitted!",
        description: "Your vendor application has been submitted and is pending review.",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An error occurred while submitting your application.",
      });
    } finally {
      setLoading(false);
    }
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
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Business Information</h2>
          
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your business name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="contact@yourbusiness.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="(555) 123-4567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us about your business and what you sell..." 
                    className="min-h-[120px]" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="art">Art & Crafts</SelectItem>
                    <SelectItem value="food">Food & Beverages</SelectItem>
                    <SelectItem value="fashion">Fashion & Accessories</SelectItem>
                    <SelectItem value="home">Home & Decor</SelectItem>
                    <SelectItem value="beauty">Beauty & Wellness</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Social Media (Optional)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourbusiness.com" {...field} />
                  </FormControl>
                  <FormDescription>Your business website (if you have one)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram</FormLabel>
                  <FormControl>
                    <Input placeholder="@yourbusiness" {...field} />
                  </FormControl>
                  <FormDescription>Your Instagram handle (without the @)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="pt-4">
          <Button type="submit" disabled={loading} className="w-full md:w-auto">
            {loading ? "Submitting..." : "Submit Application"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default VendorForm;
