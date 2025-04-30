
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Menu, X } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message,
      });
    }
  };

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-purple-700">
              LocalMKT
            </Link>
          </div>
          
          {/* Desktop menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-6">
            <Link to="/events" className="text-gray-700 hover:text-purple-700">
              Discover Events
            </Link>
            
            {user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Create
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Create New</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link to="/events/create">
                      <DropdownMenuItem className="cursor-pointer">
                        Event
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/vendor-signup">
                      <DropdownMenuItem className="cursor-pointer">
                        Business / Vendor
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button onClick={handleSignOut} variant="outline">Sign Out</Button>
              </>
            ) : (
              <Link to="/auth">
                <Button>Sign In</Button>
              </Link>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="sm:hidden">
            <Button variant="ghost" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              to="/events"
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-gray-50"
              onClick={() => setMobileMenuOpen(false)}
            >
              Discover Events
            </Link>
            
            {user && (
              <>
                <Link 
                  to="/events/create"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Create Event
                </Link>
                <Link 
                  to="/vendor-signup"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-gray-50"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Register Business
                </Link>
              </>
            )}
            
            {user ? (
              <button 
                className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-gray-50"
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
              >
                Sign Out
              </button>
            ) : (
              <Link 
                to="/auth"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-700 hover:bg-gray-50"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
