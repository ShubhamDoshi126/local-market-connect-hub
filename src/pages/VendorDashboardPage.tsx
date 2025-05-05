
import { useAuth } from "@/components/auth/AuthProvider";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VendorDashboard from "@/components/vendor/VendorDashboard";
import VendorEventInvites from "@/components/vendor/VendorEventInvites";
import { supabase } from "@/integrations/supabase/client";

const VendorDashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isVendor, setIsVendor] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVendorStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check if user is associated with a business either as a vendor or team member
        const { data: vendorData } = await supabase
          .from("vendors")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (vendorData) {
          setIsVendor(true);
          setLoading(false);
          return;
        }

        const { data: memberData } = await supabase
          .from("business_members")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (memberData) {
          setIsVendor(true);
        } else {
          setIsVendor(false);
        }
      } catch (error) {
        console.error("Error checking vendor status:", error);
        setIsVendor(false);
      } finally {
        setLoading(false);
      }
    };

    checkVendorStatus();
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage your events, products, and view customer interest
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p>Loading...</p>
            </div>
          ) : !isVendor ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Not a Vendor</h2>
              <p className="mb-6">
                You need to be registered as a vendor or belong to a business to access this dashboard.
              </p>
              <button
                onClick={() => navigate("/vendor-signup")}
                className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90 transition-colors"
              >
                Sign Up as a Vendor
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <VendorDashboard />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VendorDashboardPage;
