
import { useRef } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/home/Hero";
import EventMap from "@/components/map/EventMap";
import LocationSearch from "@/components/map/LocationSearch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";

const Index = () => {
  const mapRef = useRef<any>(null);
  const { user } = useAuth();

  const handleLocationSelect = (location: { placeName: string; coordinates: [number, number] }) => {
    if (mapRef.current) {
      mapRef.current.flyTo(location.coordinates);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Discover Events Near You</h2>
              <p className="mt-2 text-lg text-gray-600 mb-4">
                Find local markets and events in your neighborhood
              </p>
              
              <div className="flex flex-wrap justify-center gap-4 mb-6">
                <Link to="/events">
                  <Button variant="default">Browse All Events</Button>
                </Link>
                {user && (
                  <Link to="/events/create">
                    <Button variant="outline">Host Your Own Event</Button>
                  </Link>
                )}
              </div>
            </div>
            
            <LocationSearch 
              className="max-w-xl mx-auto mb-6"
              onLocationSelect={handleLocationSelect}
              placeholder="Search for events in your area..."
            />
            
            <EventMap className="mt-4" />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
