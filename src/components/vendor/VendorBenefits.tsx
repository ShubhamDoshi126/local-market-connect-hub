
import { Check } from "lucide-react";

const VendorBenefits = () => {
  return (
    <div className="mt-10 bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold flex items-center mb-4">
        <Check size={20} className="text-green-500 mr-2" />
        Why Join LocalMKT?
      </h3>
      <ul className="space-y-3">
        <li className="flex items-start">
          <Check size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
          <span>No commissions or middlemen—keep 100% of your sales</span>
        </li>
        <li className="flex items-start">
          <Check size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
          <span>Connect with local customers who actively support small businesses</span>
        </li>
        <li className="flex items-start">
          <Check size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
          <span>Showcase your products at curated local events</span>
        </li>
        <li className="flex items-start">
          <Check size={16} className="text-green-500 mt-1 mr-2 flex-shrink-0" />
          <span>Build your brand presence in your local community</span>
        </li>
      </ul>
    </div>
  );
};

export default VendorBenefits;
