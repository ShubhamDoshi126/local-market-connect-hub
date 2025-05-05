
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BusinessTeam from "@/components/business/BusinessTeam";

const EditBusiness = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Check if user has permission to edit this business
  const { data: permission, isLoading: permissionLoading } = useQuery({
    queryKey: ["business-permission", id, user?.id],
    queryFn: async () => {
      if (!user) return { canEdit: false };

      // Check if user is the business owner
      const { data: business } = await supabase
        .from("businesses")
        .select("created_by")
        .eq("id", id)
        .single();
      
      if (business?.created_by === user.id) {
        return { canEdit: true, role: "owner", isOwner: true };
      }

      // Check if user is a team member with edit permission
      const { data: member } = await supabase
        .from("business_members")
        .select("role")
        .eq("business_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      return { 
        canEdit: !!member && ["owner", "admin"].includes(member.role),
        role: member?.role,
        isOwner: member?.role === "owner"
      };
    },
    enabled: !!user && !!id,
  });

  // Fetch business data
  const { data: business, isLoading: businessLoading } = useQuery({
    queryKey: ["business-details", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!permission?.canEdit,
  });

  useEffect(() => {
    if (!permissionLoading && permission && !permission.canEdit) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You don't have permission to edit this business"
      });
      navigate(`/business/${id}`);
    }
  }, [permission, permissionLoading, navigate, id]);

  if (permissionLoading || businessLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <Skeleton className="h-12 w-1/2 mb-4" />
            <Skeleton className="h-4 w-1/4 mb-8" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Edit Business</h1>
            <p className="text-gray-600 mt-2">
              Update your business information and manage team members
            </p>
          </div>

          <Tabs defaultValue="details">
            <TabsList>
              <TabsTrigger value="details">Business Details</TabsTrigger>
              <TabsTrigger value="team">Team Management</TabsTrigger>
            </TabsList>

            <TabsContent value="details">
              <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Business Details</h2>
                <p className="text-gray-600 mb-6">
                  This is a placeholder for the business edit form. In a complete implementation,
                  you would be able to edit all business details here.
                </p>
                <div className="flex space-x-4">
                  <Button onClick={() => navigate(`/business/${id}`)}>
                    Return to Business Page
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="team">
              {permission?.isOwner && id && (
                <BusinessTeam businessId={id} isOwner={true} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EditBusiness;
