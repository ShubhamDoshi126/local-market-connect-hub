
import { Badge } from "@/components/ui/badge";
import type { VendorStatus as VendorStatusType } from "./types";

interface VendorStatusProps {
  status: VendorStatusType;
}

export const VendorStatus = ({ status }: VendorStatusProps) => {
  const variant = {
    pending: "default",
    approved: "success",
    rejected: "destructive",
  }[status];

  return <Badge variant={variant}>{status}</Badge>;
};
