
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Control } from "react-hook-form";
import { VendorFormValues } from "./vendorFormSchema";

interface TermsConditionsSectionProps {
  control: Control<VendorFormValues>;
}

const TermsConditionsSection = ({ control }: TermsConditionsSectionProps) => {
  return (
    <FormField
      control={control}
      name="termsAccepted"
      render={({ field }) => (
        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
          <FormControl>
            <Checkbox
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <div className="space-y-1 leading-none">
            <FormLabel>
              I accept the terms and conditions
            </FormLabel>
            <FormDescription>
              By checking this box, you agree to our Terms of Service and Privacy Policy.
            </FormDescription>
            <FormMessage />
          </div>
        </FormItem>
      )}
    />
  );
};

export default TermsConditionsSection;
