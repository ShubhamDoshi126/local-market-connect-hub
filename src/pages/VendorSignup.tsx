
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import VendorForm from "@/components/vendor/VendorForm";
import VendorBenefits from "@/components/vendor/VendorBenefits";

const VendorSignup = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Become a LocalMKT Vendor
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Connect with local shoppers and sell your products at community events.
              No commissions, just real connections.
            </p>
          </div>

          <VendorForm />
          <VendorBenefits />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default VendorSignup;
