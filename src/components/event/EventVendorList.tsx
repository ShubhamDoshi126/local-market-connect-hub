
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Store, Check, X } from "lucide-react";

interface EventVendorListProps {
  eventId: string;
  isOwner: boolean;
}

const EventVendorList = ({ eventId, isOwner }: EventVendorListProps) => {
  const { data: vendors, isLoading, error } = useQuery({
    queryKey: ["eventVendors", eventId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_vendors")
        .select(`
          id,
          status,
          businesses (
            id,
            name,
            description,
            vendors (
              business_category,
              instagram,
              website
            )
          )
        `)
        .eq("event_id", eventId);
      
      if (error) throw error;
      return data || [];
    },
  });

  // Helper function to determine badge color based on status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accepted":
        return <Badge className="bg-green-100 text-green-800">Confirmed</Badge>;
      case "declined":
        return <Badge className="bg-red-100 text-red-800">Declined</Badge>;
      case "invited":
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500">Error loading vendors: {error.message}</p>;
  }

  if (!vendors?.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Store className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Vendors Yet</h3>
          <p className="text-gray-600 mb-4">
            {isOwner
              ? "Invite vendors to participate in your event!"
              : "No vendors have confirmed for this event yet."}
          </p>
          {isOwner && (
            <Button>Invite Vendors</Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vendors.map((vendor) => (
        <Card key={vendor.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold">
                <Link to={`/business/${vendor.businesses?.id}`} className="hover:text-purple-700 transition-colors">
                  {vendor.businesses?.name || "Unknown Business"}
                </Link>
              </h3>
              {getStatusBadge(vendor.status)}
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-3">
              {vendor.businesses?.description || "No description available."}
            </p>
            
            {vendor.businesses?.vendors?.[0]?.business_category && (
              <Badge variant="outline" className="mb-4">
                {vendor.businesses.vendors[0].business_category.replace('-', ' ')}
              </Badge>
            )}
            
            <div className="mt-4 flex justify-between items-center">
              <Link to={`/business/${vendor.businesses?.id}`}>
                <Button variant="outline" size="sm">View Products</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default EventVendorList;
