
import { useState } from "react";
import { Search, Calendar, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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

// Mock data for events
const mockEvents = [
  {
    id: "1",
    name: "Downtown Artisan Market",
    date: "May 5, 2025",
    time: "10:00 AM - 4:00 PM",
    location: "Central Plaza",
    city: "San Francisco",
    zip: "94105",
    image: "https://images.unsplash.com/photo-1555375771-14b2a63968a9",
    description: "A weekly market featuring local artisans, crafters, and food vendors.",
    tags: ["art", "food-drink", "crafts"],
    vendorCount: 24
  },
  {
    id: "2",
    name: "Neighborhood Wellness Fair",
    date: "May 12, 2025",
    time: "9:00 AM - 2:00 PM",
    location: "Community Park",
    city: "San Francisco",
    zip: "94110",
    image: "https://images.unsplash.com/photo-1519750783826-e2420f4d687f",
    description: "Discover local wellness practitioners, natural products, and healthy food options.",
    tags: ["wellness", "food-drink"],
    vendorCount: 18
  },
  {
    id: "3",
    name: "Vintage Pop-up Market",
    date: "May 20, 2025",
    time: "12:00 PM - 7:00 PM",
    location: "The Old Factory",
    city: "Oakland",
    zip: "94612",
    image: "https://images.unsplash.com/photo-1563994693-c57288ee84e0",
    description: "Curated vintage clothing, accessories, and home goods from top collectors.",
    tags: ["clothing", "home-decor"],
    vendorCount: 16
  },
  {
    id: "4",
    name: "Makers & Music Festival",
    date: "June 2, 2025",
    time: "2:00 PM - 10:00 PM",
    location: "Waterfront Park",
    city: "San Francisco",
    zip: "94111",
    image: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae",
    description: "A celebration of local makers and musicians with food trucks and craft beverages.",
    tags: ["music", "food-drink", "art"],
    vendorCount: 35
  }
];

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

const Events = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("All Cities");

  // Get unique cities from events data
  const cities = ["All Cities", ...Array.from(new Set(mockEvents.map(event => event.city)))];

  // Filter events by search term and selected city
  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = 
      event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCity = selectedCity === "All Cities" || event.city === selectedCity;
    
    return matchesSearch && matchesCity;
  });

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
          </div>
        </section>
        
        {/* Events Listing */}
        <section className="py-10 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold mb-6">Upcoming Events</h2>
            
            {filteredEvents.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-500">No events found. Try adjusting your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => (
                  <Card key={event.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-w-16 aspect-h-9 h-[160px] overflow-hidden">
                      <img
                        src={event.image}
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
                        {event.date} • {event.time}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {event.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className={tagColors[tag]}>
                            {tag.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </Badge>
                        ))}
                      </div>
                      <p className="line-clamp-2 text-gray-600 text-sm">
                        {event.description}
                      </p>
                    </CardContent>
                    <CardFooter className="pt-2 flex justify-between items-center">
                      <div className="text-sm text-gray-600">{event.vendorCount} vendors</div>
                      <Link to={`/events/${event.id}`}>
                        <Button size="sm">View Details</Button>
                      </Link>
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
