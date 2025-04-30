
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Calendar, Clock, Users } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EventVendorList from "@/components/event/EventVendorList";

const EventDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEventOwner, setIsEventOwner] = useState(false);

  // Fetch event details
  const { data: event, isLoading, error } = useQuery({
    queryKey: ["event", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Check if current user is the event owner
  useEffect(() => {
    if (user && event && user.id === event.created_by) {
      setIsEventOwner(true);
    } else {
      setIsEventOwner(false);
    }
  }, [user, event]);

  // Handle errors
  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-red-600 text-xl font-bold mb-4">Error loading event</h1>
            <p className="mb-4">There was an error loading this event: {error.message}</p>
            <Link to="/events">
              <Button>Back to Events</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-40 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-60 w-full" />
                <Skeleton className="h-60 w-full" />
              </div>
            </div>
          ) : event ? (
            <>
              <div className="mb-8">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{event.name}</h1>
                    <div className="mt-2 flex items-center text-gray-600">
                      <Calendar className="h-5 w-5 mr-2" />
                      <span>{new Date(event.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="mt-1 flex items-center text-gray-600">
                      <Clock className="h-5 w-5 mr-2" />
                      <span>
                        {event.start_time.substring(0, 5)} - {event.end_time.substring(0, 5)}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center text-gray-600">
                      <MapPin className="h-5 w-5 mr-2" />
                      <span>{event.location}, {event.address}, {event.city}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {isEventOwner && (
                      <Button variant="outline">Edit Event</Button>
                    )}
                    {user && !isEventOwner && (
                      <Button variant="outline">Save Event</Button>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4">About This Event</h2>
                      <p className="text-gray-700 whitespace-pre-line">
                        {event.description || "No description provided."}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="mt-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Vendors at This Event</h2>
                  {isEventOwner && (
                    <Button>Invite Vendors</Button>
                  )}
                </div>
                <EventVendorList eventId={event.id} isOwner={isEventOwner} />
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-xl text-gray-600">Event not found</p>
              <Link to="/events" className="mt-4 inline-block">
                <Button>Back to Events</Button>
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventDetail;
