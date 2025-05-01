
import { useState } from "react";
import { Search, Calendar, MapPin, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import EventMap from "@/components/map/EventMap";
import LocationSearch from "@/components/map/LocationSearch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Tag color mapping
const tagColors: Record<string, string> = {
  "art": "bg-blue-100 text-blue-800",
  "food-drink": "bg-green-100 text-green-800",
  "crafts": "bg-yellow-100 text-yellow-800",
  "wellness": "bg-purple-100 text-purple-800",
  "clothing": "bg-pink-100 text-pink-800",
  "home-decor": "bg-orange-100 text-orange-800",
  "jewelry": "bg-indigo-100 text-indigo-800",
  "music": "bg-red-100 text-red-800"
};

interface Event {
  id: string;
  name: string;
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  city: string;
  address: string;
  description: string | null;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
  created_by: string | null;
  created_at: string | null;
}

const Events = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch events from Supabase
  const { data: events, isLoading, error, refetch } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order('date', { ascending: true });
        
      if (error) throw error;
      return data as Event[];
    },
  });

  // Get unique cities from events data
  const cities = events ? ["All Cities", ...Array.from(new Set(events.map(event => event.city)))] : ["All Cities"];

  // Filter events by search term and selected city
  const filteredEvents = events?.filter(event => {
    const matchesSearch = 
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (event.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesCity = selectedCity === "All Cities" || event.city === selectedCity;
    
    return matchesSearch && matchesCity;
  }) || [];

  const handleLocationSelect = (location: { placeName: string; coordinates: [number, number] }) => {
    // Extract city from location if possible
    const parts = location.placeName.split(',');
    if (parts.length > 1) {
      const cityPart = parts[parts.length - 3]?.trim();
      if (cityPart && cities.includes(cityPart)) {
        setSelectedCity(cityPart);
      }
    }
    
    // Switch to map view
    setViewMode("map");
  };

  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventToDelete);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "The event has been successfully deleted.",
      });

      // Refresh events list
      refetch();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "There was an error deleting the event.",
      });
    } finally {
      setEventToDelete(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-purple-50 to-blue-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl md:text-5xl">
                Discover Local Events
              </h1>
              <p className="mt-3 text-xl text-gray-600 sm:mt-4">
                Find markets, pop-ups, and community events in your area
              </p>
            </div>
          </div>
        </section>
        
        {/* Search and Filters */}
        <section className="py-6 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="w-full md:w-1/2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for events..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="w-full md:w-auto flex gap-4">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full md:w-auto border border-gray-300 rounded-md h-10 px-3 py-2 text-gray-900"
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                <Button variant="outline" className="hidden sm:inline-flex">
                  <Calendar className="h-4 w-4 mr-2" />
                  Date
                </Button>
              </div>
            </div>
            
            {/* View toggle */}
            <div className="mt-4 flex justify-center">
              <div className="inline-flex rounded-md shadow-sm" role="group">
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg ${
                    viewMode === "list" 
                      ? "bg-purple-700 text-white" 
                      : "bg-white text-gray-900 hover:bg-gray-100"
                  }`}
                  onClick={() => setViewMode("list")}
                >
                  List View
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-md ${
                    viewMode === "map" 
                      ? "bg-purple-700 text-white" 
                      : "bg-white text-gray-900 hover:bg-gray-100"
                  }`}
                  onClick={() => setViewMode("map")}
                >
                  Map View
                </button>
              </div>
            </div>
            
            {/* Location search for map view */}
            {viewMode === "map" && (
              <div className="mt-4">
                <LocationSearch 
                  className="max-w-xl mx-auto" 
                  onLocationSelect={handleLocationSelect} 
                  placeholder="Find events in a specific location..."
                />
              </div>
            )}
          </div>
        </section>
        
        {/* Events Listing */}
        <section className="py-10 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Upcoming Events</h2>
              {user && (
                <Link to="/events/create">
                  <Button>Create Event</Button>
                </Link>
              )}
            </div>
            
            {isLoading ? (
              <div className="text-center py-10">
                <p className="text-gray-500">Loading events...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <p className="text-red-500">Error loading events. Please try again later.</p>
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No events found. Try adjusting your search or create your own event!</p>
                {user && (
                  <Link to="/events/create" className="mt-4 inline-block">
                    <Button>Create Event</Button>
                  </Link>
                )}
              </div>
            ) : viewMode === "map" ? (
              <EventMap className="mt-4" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-w-16 aspect-h-9 h-[160px] overflow-hidden">
                      <img
                        src={event.image_url || "https://images.unsplash.com/photo-1519750783826-e2420f4d687f"}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xl">{event.name}</CardTitle>
                      <CardDescription className="flex items-center text-sm">
                        <MapPin className="h-3.5 w-3.5 mr-1 text-gray-500" />
                        {event.location}, {event.city}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center mb-2 text-sm text-gray-600">
                        <Calendar className="h-3.5 w-3.5 mr-1 text-gray-500" />
                        {new Date(event.date).toLocaleDateString()} • {event.start_time.substring(0, 5)} - {event.end_time.substring(0, 5)}
                      </div>
                      <p className="line-clamp-2 text-gray-600 text-sm">
                        {event.description || "No description available."}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between items-center">
                      <Link to={`/events/${event.id}`}>
                        <Button size="sm">View Details</Button>
                      </Link>
                      
                      {/* Delete button for event creators */}
                      {user && event.created_by === user.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon"
                              onClick={() => setEventToDelete(event.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Event</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this event? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setEventToDelete(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteEvent} className="bg-red-500 hover:bg-red-600">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
