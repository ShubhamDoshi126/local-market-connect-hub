
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/components/auth/AuthProvider";

import Index from "./pages/Index";
import Events from "./pages/Events";
import VendorSignup from "./pages/VendorSignup";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import CreateEvent from "./pages/CreateEvent";
import EventDetail from "./pages/EventDetail";
import BusinessPage from "./pages/BusinessPage";
import BusinessProducts from "./pages/BusinessProducts";
import EditBusiness from "./pages/EditBusiness";
import VendorDashboardPage from "./pages/VendorDashboardPage";
import Profile from "./pages/Profile";
  
// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/events" element={<Events />} />
              <Route path="/events/create" element={<CreateEvent />} />
              <Route path="/events/:id" element={<EventDetail />} />
              <Route path="/vendor-signup" element={<VendorSignup />} />
              <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
              <Route path="/business/:id" element={<BusinessPage />} />
              <Route path="/business/:id/edit" element={<EditBusiness />} />
              <Route path="/business/:id/products" element={<BusinessProducts />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
            <Toaster />
            <Sonner />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
