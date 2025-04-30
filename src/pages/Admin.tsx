
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import AdminVendorList from "@/components/admin/AdminVendorList";

const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // 1) still waiting on AuthProvider→skip
    if (user === undefined) return;

    // 2) truly no user→go to /auth
    if (user === null) {
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

  // optionally show a spinner while user===undefined
  if (user === undefined) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      <AdminVendorList />
    </div>
  );
};


export default Admin;
