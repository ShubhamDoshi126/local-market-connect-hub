
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">LocalMKT</h3>
            <p className="text-gray-600">
              Discover local events and shop directly from creators in your neighborhood.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">For Shoppers</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/events" className="text-gray-600 hover:text-purple-700">
                  Find Events
                </Link>
              </li>
              <li>
                <Link to="/vendors" className="text-gray-600 hover:text-purple-700">
                  Browse Vendors
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">For Businesses</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/create-event" className="text-gray-600 hover:text-purple-700">
                  Host an Event
                </Link>
              </li>
              <li>
                <Link to="/vendor-signup" className="text-gray-600 hover:text-purple-700">
                  Become a Vendor
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Contact</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 hover:text-purple-700">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/support" className="text-gray-600 hover:text-purple-700">
                  Support
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
