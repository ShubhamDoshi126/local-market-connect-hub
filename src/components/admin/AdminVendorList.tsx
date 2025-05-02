
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { VendorTable } from "./VendorTable";

const AdminVendorList = () => {
  const { toast } = useToast();

  const { data: vendors, refetch } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")  // Changed back to "vendors" to match TypeScript types
        .select("*, vendor_locations(*)");
      
      if (error) throw error;
      return data;
    },
  });

  const updateVendorStatus = async (vendorId: string, status: "approved" | "rejected") => {
    try {
      const { error } = await supabase
        .from("vendors")  // Changed back to "vendors" to match TypeScript types
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
      <VendorTable vendors={vendors} onStatusUpdate={updateVendorStatus} />
    </div>
  );
};

export default AdminVendorList;
