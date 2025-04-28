
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VendorStatus } from "./types";

interface VendorActionsProps {
  vendorId: string;
  status: VendorStatus;
  onStatusUpdate: (vendorId: string, status: "approved" | "rejected") => Promise<void>;
}

export const VendorActions = ({ vendorId, status, onStatusUpdate }: VendorActionsProps) => {
  if (status !== "pending") return null;

  return (
    <>
      <Button
        size="sm"
        className="bg-green-600 hover:bg-green-700"
        onClick={() => onStatusUpdate(vendorId, "approved")}
      >
        <Check className="mr-1" />
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => onStatusUpdate(vendorId, "rejected")}
      >
        <X className="mr-1" />
        Reject
      </Button>
    </>
  );
};
