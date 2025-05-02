
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Control } from "react-hook-form";
import { VendorFormValues } from "./vendorFormSchema";

interface SocialMediaSectionProps {
  control: Control<VendorFormValues>;
}

const SocialMediaSection = ({ control }: SocialMediaSectionProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Social Media (Optional)</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={control}
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
          control={control}
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
  );
};

export default SocialMediaSection;
