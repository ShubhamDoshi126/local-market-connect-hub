
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-purple-700">
              LocalMKT
            </Link>
          </div>
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link to="/events" className="text-gray-700 hover:text-purple-700">
              Discover Events
            </Link>
            <Link to="/vendors" className="text-gray-700 hover:text-purple-700">
              Local Vendors
            </Link>
            <Link to="/vendor-signup">
              <Button variant="outline">Become a Vendor</Button>
            </Link>
            <Button>Sign In</Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
