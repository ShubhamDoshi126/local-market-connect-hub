
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VendorTable } from "./VendorTable";

const AdminVendorList = () => {
  const { data: vendors } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*, vendor_locations(*)");
      
      if (error) throw error;
      console.log("Vendors with locations:", data);
      return data;
    },
  });

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">All Vendors</h2>
      <p className="text-sm text-gray-600 mb-4">
        All vendors are automatically approved. This page is for administrative purposes only.
      </p>
      <VendorTable vendors={vendors} onStatusUpdate={() => Promise.resolve()} />
    </div>
  );
};

export default AdminVendorList;
