
import { z } from "zod";

export const businessInviteSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["member", "admin"], {
    required_error: "Please select a role",
  }),
});

export type BusinessInviteFormValues = z.infer<typeof businessInviteSchema>;

export const roles = [
  { value: "member", label: "Member" },
  { value: "admin", label: "Admin" },
  { value: "owner", label: "Owner" },
];
