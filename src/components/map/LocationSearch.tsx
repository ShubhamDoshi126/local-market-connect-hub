
import { useState, useRef, useEffect } from "react";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast"; // Correct import path

const MAPBOX_TOKEN = "pk.eyJ1IjoicnJwYXJla2giLCJhIjoiY21hMWFlZWo0MWVoODJqb3JlcjZkMXF6aCJ9.g95mFRljtWFsl_i12Dt-ug";

interface LocationSearchProps {
  onLocationSelect?: (location: {
    placeName: string;
    coordinates: [number, number];
  }) => void;
  placeholder?: string;
  className?: string;
}

const LocationSearch = ({
  onLocationSelect,
  placeholder = "Search for a location...",
  className = "",
}: LocationSearchProps) => {
  const [searchValue, setSearchValue] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Close suggestions dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsContainerRef.current &&
        !suggestionsContainerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!query || query.trim() === "") {
      setSuggestions([]);
      return;
    }
  
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query
        )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`
      );
  
      if (!response.ok) {
        throw new Error("Failed to fetch suggestions");
      }
  
      const data = await response.json();
      setSuggestions(data.features ?? []);
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not fetch location suggestions",
      });
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchValue(value);
    
    if (value.length > 2) {
      fetchSuggestions(value);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectLocation = (feature: any) => {
    const placeName = feature.place_name;
    const [lon, lat] = feature.center; // Mapbox returns center as [lon, lat]
  
    setSearchValue(placeName);
    setSuggestions([]);
    setShowSuggestions(false);
  
    if (onLocationSelect) {
      onLocationSelect({
        placeName,
        coordinates: [lon, lat],
      });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={searchValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="pl-10 pr-24"
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 -translate-y-1/2 h-8"
          onClick={() => {
            setSearchValue("");
            setSuggestions([]);
          }}
          disabled={!searchValue}
        >
          Clear
        </Button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsContainerRef}
          className="absolute z-10 mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {loading ? (
            <div className="p-2 text-center text-sm text-gray-500">Loading...</div>
          ) : (
            <ul className="py-1">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id} // Use id instead of place_id
                  className="px-4 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectLocation(suggestion)}
                >
                  {suggestion.place_name} 
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
