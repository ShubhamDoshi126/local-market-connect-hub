
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Check, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const AdminVendorList = () => {
  const { toast } = useToast();

  const { data: vendors, refetch } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*, vendor_locations(*)");
      
      if (error) throw error;
      return data;
    },
  });

  const updateVendorStatus = async (vendorId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("vendors")
        .update({ status })
        .eq("id", vendorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Vendor ${status} successfully`,
      });
      
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Vendor Applications</h2>
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
              <TableCell>{vendor.status}</TableCell>
              <TableCell className="space-x-2">
                {vendor.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => updateVendorStatus(vendor.id, "approved")}
                    >
                      <Check className="mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateVendorStatus(vendor.id, "rejected")}
                    >
                      <X className="mr-1" />
                      Reject
                    </Button>
                  </>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AdminVendorList;
