
import * as z from "zod";

export const vendorFormSchema = z.object({

});

export const formSchema = z.object({
  businessName: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  contactName: z.string().min(2, {
    message: "Contact name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  website: z.string().optional(),
  instagram: z.string().optional(),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  address: z.string().min(5, {
    message: "Address is required.",
  }),
  city: z.string().min(2, {
    message: "City is required.",
  }),
  zipCode: z.string().min(5, {
    message: "Zip code is required.",
  }),
  businessCategory: z.string({
    required_error: "Please select a business category.",
  }),
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions.",
  }),
});

export const categories = [
  { value: "food-drink", label: "Food and Drink" },
  { value: "wellness", label: "Wellness" },
  { value: "jewelry", label: "Jewelry" },
  { value: "clothing", label: "Clothing" },
  { value: "art", label: "Art" },
  { value: "music", label: "Music" },
  { value: "home-decor", label: "Home Decor" },
  { value: "other", label: "Other" },
];

export type FormValues = z.infer<typeof formSchema>;
