
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { Calendar, MapPin, Link as LinkIcon, Instagram, Users, Edit } from "lucide-react";
import { format } from 'date-fns';

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BusinessTeam from "@/components/business/BusinessTeam";

interface Business {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string | null;
}

interface Vendor {
  id: string;
  business_id: string | null;
  business_name: string;
  business_category: string;
  description: string | null;
  website: string | null;
  instagram: string | null;
  user_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  status: string | null;
}

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
}

const BusinessPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [teamRole, setTeamRole] = useState<string | null>(null);

  // Fetch business details
  const { data: business, isLoading: isBusinessLoading, error: businessError } = useQuery({
    queryKey: ["business", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data as Business;
    },
    enabled: !!id,
  });

  // Fetch vendor details
  const { data: vendor, isLoading: isVendorLoading, error: vendorError } = useQuery({
    queryKey: ["vendor", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("business_id", id)
        .single();
      
      if (error) throw error;
      return data as Vendor;
    },
    enabled: !!id,
  });

  // Check if user is a team member
  const { data: teamMemberData } = useQuery({
    queryKey: ["team-member", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("business_members")
        .select("id, role")
        .eq("business_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) return null;
      return data;
    },
    enabled: !!id && !!user,
  });

  // Fetch events associated with the business
  const { data: events, isLoading: isEventsLoading, error: eventsError } = useQuery({
    queryKey: ["events", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("created_by", business?.created_by);
      
      if (error) throw error;
      return data as Event[];
    },
    enabled: !!business?.created_by,
  });

  useEffect(() => {
    if (user && business && user.id === business.created_by) {
      setIsOwner(true);
    } else {
      setIsOwner(false);
    }

    if (teamMemberData) {
      setIsTeamMember(true);
      setTeamRole(teamMemberData.role);
    } else {
      setIsTeamMember(false);
      setTeamRole(null);
    }
  }, [user, business, teamMemberData]);

  if (isBusinessLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Skeleton className="h-12 w-1/2 mb-4" />
            <Skeleton className="h-4 w-1/4 mb-8" />
            <Skeleton className="h-64" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (businessError) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">Error loading business</h1>
            <p className="text-gray-600">
              There was an error loading this business. Please try again later.
            </p>
            <Link to="/" className="text-blue-500 hover:underline">
              Go back to homepage
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Check if user has edit permissions
  const canEdit = isOwner || (isTeamMember && (teamRole === 'owner' || teamRole === 'admin'));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{business?.name}</h1>
                {vendor && (
                  <div className="mt-2">
                    <Badge className="bg-purple-100 text-purple-800">{vendor.business_category}</Badge>
                  </div>
                )}
              </div>
              {canEdit && (
                <div>
                  <Link to={`/business/${id}/edit`}>
                    <Button variant="outline">
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Business
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            
            <p className="text-gray-500">
              {business?.created_at ? `Created on ${new Date(business.created_at).toLocaleDateString()}` : 'Creation date unavailable'}
            </p>
          </div>

          <Tabs defaultValue="about">
            <TabsList>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="events">Events</TabsTrigger>
              {(isOwner || isTeamMember) && (
                <TabsTrigger value="team">Team</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="about">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-2xl font-semibold mb-4">About</h2>
                  <p className="text-gray-700">{business?.description || "No description available."}</p>
                  
                  {vendor && (
                    <div className="mt-4">
                      {vendor.website && (
                        <div className="flex items-center mb-2">
                          <LinkIcon className="h-4 w-4 mr-2 text-gray-500" />
                          <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {vendor.website}
                          </a>
                        </div>
                      )}
                      {vendor.instagram && (
                        <div className="flex items-center mb-2">
                          <Instagram className="h-4 w-4 mr-2 text-gray-500" />
                          <a href={`https://instagram.com/${vendor.instagram}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            @{vendor.instagram}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="events">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Upcoming Events</h2>
                {isEventsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                  </div>
                ) : eventsError ? (
                  <p className="text-red-500">Error loading events.</p>
                ) : events && events.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map((event) => (
                      <Card key={event.id} className="overflow-hidden">
                        <div className="aspect-w-16 aspect-h-9">
                          <img
                            src={event.image_url || "https://via.placeholder.com/640x360"}
                            alt={event.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-6">
                          <h3 className="text-xl font-semibold mb-2">{event.name}</h3>
                          <div className="flex items-center text-gray-600 mb-2">
                            <Calendar className="h-4 w-4 mr-2" />
                            {format(new Date(event.date), 'MMMM d, yyyy')}
                          </div>
                          <div className="flex items-center text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-2" />
                            {event.location}, {event.city}
                          </div>
                          <p className="text-gray-700">{event.description || "No description available."}</p>
                          <Link to={`/events/${event.id}`} className="text-blue-500 hover:underline mt-4 block">
                            View Details
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-gray-600">No upcoming events found.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {(isOwner || isTeamMember) && (
              <TabsContent value="team">
                <BusinessTeam businessId={id!} isOwner={isOwner} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BusinessPage;
