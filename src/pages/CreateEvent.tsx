
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LocationSearch from "@/components/map/LocationSearch";
import { format } from "date-fns";

const eventFormSchema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  date: z.string().refine(date => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date",
  }),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Please enter a valid time (HH:MM)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Please enter a valid time (HH:MM)"),
  location: z.string().min(3, "Location name is required"),
  address: z.string().min(5, "Full address is required"),
  city: z.string().min(2, "City is required"),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const CreateEvent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ placeName: string; coordinates: [number, number] } | null>(null);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "10:00",
      endTime: "18:00",
      location: "",
      address: "",
      city: "",
    },
  });

  const onSubmit = async (values: EventFormValues) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to create an event.",
      });
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      const { data: event, error } = await supabase
        .from("events")
        .insert({
          name: values.name,
          description: values.description,
          date: values.date,
          start_time: values.startTime,
          end_time: values.endTime,
          location: values.location,
          address: values.address,
          city: values.city,
          lat: selectedLocation?.coordinates[1] || null,
          lng: selectedLocation?.coordinates[0] || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Event created!",
        description: "Your event has been successfully created.",
      });
      
      navigate(`/events/${event.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating event",
        description: error.message || "There was an error creating your event.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: { placeName: string; coordinates: [number, number] }) => {
    setSelectedLocation(location);
    
    // Extract components from the location string
    const addressParts = location.placeName.split(', ');
    
    // Basic parsing of the address components - this is simplified and might need adjustment
    if (addressParts.length >= 3) {
      // Set the form values - first part is typically the street address
      form.setValue('address', addressParts[0], { shouldValidate: true });
      
      // Set city - typically the second-to-last or third-to-last part
      const cityIndex = addressParts.length >= 4 ? addressParts.length - 3 : addressParts.length - 2;
      form.setValue('city', addressParts[cityIndex], { shouldValidate: true });
      
      // Set location to the same as address initially, user can change it
      form.setValue('location', addressParts[0], { shouldValidate: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Create a New Event</h1>
            <p className="mt-4 text-lg text-gray-600">
              Host your own market event and invite local vendors
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-lg shadow">
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Event Details</h2>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Autumn Market Festival" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell people about your event..." 
                          className="min-h-[120px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem className="md:col-span-1">
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Location</h2>
                
                <div className="mb-4">
                  <label className="block mb-2">Search for location</label>
                  <LocationSearch 
                    onLocationSelect={handleLocationSelect} 
                    placeholder="Start typing the event location..." 
                  />
                  {selectedLocation && (
                    <p className="mt-2 text-sm text-green-600">
                      Location selected: {selectedLocation.placeName}
                    </p>
                  )}
                </div>
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Town Square" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Street Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Market St" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={loading} className="w-full md:w-auto">
                  {loading ? "Creating Event..." : "Create Event"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateEvent;
