
import { Badge } from "@/components/ui/badge";
import type { VendorStatus as VendorStatusType } from "./types";

interface VendorStatusProps {
  status: VendorStatusType;
}

export const VendorStatus = ({ status }: VendorStatusProps) => {
  // Map the status to a valid variant type
  const variant: "default" | "destructive" | "outline" | "secondary" = {
    pending: "default",
    approved: "secondary",
    rejected: "destructive",
  }[status] as "default" | "destructive" | "outline" | "secondary";

  return <Badge variant={variant}>{status}</Badge>;
};
