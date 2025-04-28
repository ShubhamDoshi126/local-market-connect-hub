
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VendorActions } from "./VendorActions";
import { VendorStatus } from "./VendorStatus";
import { type Vendor } from "./types";

interface VendorTableProps {
  vendors: Vendor[] | null;
  onStatusUpdate: (vendorId: string, status: "approved" | "rejected") => Promise<void>;
}

export const VendorTable = ({ vendors, onStatusUpdate }: VendorTableProps) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Business Name</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Location</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {vendors?.map((vendor) => (
          <TableRow key={vendor.id}>
            <TableCell>{vendor.business_name}</TableCell>
            <TableCell>{vendor.business_category}</TableCell>
            <TableCell>
              {vendor.vendor_locations?.[0]?.city}, {vendor.vendor_locations?.[0]?.zip_code}
            </TableCell>
            <TableCell>
              <VendorStatus status={vendor.status} />
            </TableCell>
            <TableCell className="space-x-2">
              <VendorActions 
                vendorId={vendor.id} 
                status={vendor.status} 
                onStatusUpdate={onStatusUpdate}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
