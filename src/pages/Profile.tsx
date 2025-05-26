// src/pages/Profile.tsx
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isVendor, setIsVendor] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        // Fetch user profile
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        setProfile(data);

        // Check if user is a vendor
        const { data: vendorData, error: vendorError } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (vendorError) throw vendorError;
        setIsVendor(!!vendorData);
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load profile data",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (loading) {
    return <div>Loading profile...</div>;
  }

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please log in to view your profile.</p>
          <Button onClick={() => navigate("/auth")} className="mt-4">
            Log In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Your Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p>{user.email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p>{profile?.first_name || ''} {profile?.last_name || ''}</p>
              </div>
              
              {/* Add more profile fields as needed */}
            </div>
            
            <Button variant="outline" className="mt-6">
              Edit Profile
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Account Type</h3>
                <p>{isVendor ? 'Vendor' : 'User'}</p>
              </div>
              
              {isVendor ? (
                <Button onClick={() => navigate("/vendor/dashboard")}>
                  Go to Vendor Dashboard
                </Button>
              ) : (
                <Button onClick={() => navigate("/vendor-signup")}>
                  Become a Vendor
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
