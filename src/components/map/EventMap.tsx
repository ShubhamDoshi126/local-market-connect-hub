
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { MapPin, Locate } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { mockEvents } from "@/data/mock-events";

// Temporary public token - you should move this to Supabase secrets in production
mapboxgl.accessToken = "pk.eyJ1IjoicnJwYXJla2giLCJhIjoiY21hMWFlZWo0MWVoODJqb3JlcjZkMXF6aCJ9.g95mFRljtWFsl_i12Dt-ug";

interface EventMapProps {
  className?: string;
}

const EventMap = ({ className }: EventMapProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { toast } = useToast();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-122.4194, 37.7749], // Default: San Francisco
      zoom: 11,
    });

    mapInstance.addControl(new mapboxgl.NavigationControl(), "top-right");
    
    mapInstance.on("load", () => {
      setMapLoaded(true);
      map.current = mapInstance;
    });

    return () => {
      mapInstance.remove();
    };
  }, []);

  // Get user location function
  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      toast({
        title: "Finding your location...",
        duration: 2000,
      });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([longitude, latitude]);
          
          if (map.current) {
            map.current.flyTo({
              center: [longitude, latitude],
              zoom: 13,
              essential: true
            });
            
            // Add user marker
            new mapboxgl.Marker({ color: "#3b82f6" })
              .setLngLat([longitude, latitude])
              .addTo(map.current)
              .setPopup(
                new mapboxgl.Popup().setHTML("<strong>Your location</strong>")
              );
            
            // Load nearby events
            loadEventsOnMap([longitude, latitude]);
          }
          
          toast({
            title: "Location found!",
            description: "Showing events near you",
            duration: 3000,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast({
            variant: "destructive",
            title: "Location access denied",
            description: "Please enable location access or search for a location manually",
          });
        }
      );
    } else {
      toast({
        variant: "destructive",
        title: "Geolocation not supported",
        description: "Your browser doesn't support location services",
      });
    }
  };

  // Load event markers on map
  const loadEventsOnMap = (center: [number, number]) => {
    if (!map.current || !mapLoaded) return;
    
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Convert mock event locations to coordinates and add markers
    mockEvents.forEach((event) => {
      // For demo, generate random coordinates around the center point
      const randomOffset = () => (Math.random() - 0.5) * 0.05;
      const lng = center[0] + randomOffset();
      const lat = center[1] + randomOffset();
      
      const marker = new mapboxgl.Marker({ color: "#9333ea" })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <div style="max-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 5px;">${event.name}</h3>
              <p style="margin-bottom: 5px;">${event.date} • ${event.time}</p>
              <p style="margin-bottom: 5px;">${event.location}, ${event.city}</p>
              <a href="/events/${event.id}" style="color: #9333ea; text-decoration: underline;">View details</a>
            </div>
          `)
        )
        .addTo(map.current);
      
      markersRef.current.push(marker);
    });
  };

  return (
    <div className={`relative rounded-lg overflow-hidden shadow-lg ${className}`} style={{ height: "500px" }}>
      <div ref={mapContainer} className="absolute inset-0" />
      
      <div className="absolute top-4 left-4 z-10">
        <Button 
          onClick={getUserLocation}
          variant="secondary"
          className="flex items-center gap-2 shadow-md"
        >
          <Locate className="h-4 w-4" />
          Find Events Near Me
        </Button>
      </div>
      
      <div className="absolute bottom-4 left-4 z-10 bg-white/80 backdrop-blur-sm p-3 rounded-md shadow-md">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-purple-700" />
          <span className="font-medium">Discover local events around you</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Allow location access or search for events in a specific area
        </p>
      </div>
    </div>
  );
};

export default EventMap;
