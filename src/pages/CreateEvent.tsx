// src/components/event/CreateEvent.tsx

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
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import LocationSearch from "@/components/map/LocationSearch";
import { format } from "date-fns";

const eventFormSchema = z.object({
  name: z.string().min(2, "Event name must be at least 2 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters"),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Please enter a valid date",
  }),
  startTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Please enter a valid time (HH:MM)"),
  endTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Please enter a valid time (HH:MM)"),
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
  const [selectedLocation, setSelectedLocation] = useState<
    { placeName: string; coordinates: [number, number] } | null
  >(null);

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
      // 1️⃣ Create the event (store created_by) and grab the inserted row
      const { data: event, error: eventError } = await supabase
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

      if (eventError) throw eventError;

      // 2️⃣ Add the creator as the event admin (host)
      const { error: adminError } = await supabase
        .from("event_admins")
        .insert({
          event_id: event.id,
          user_id: user.id,
          role: "host",
        });

      if (adminError) throw adminError;

      // 3️⃣ Notify & redirect
      toast({
        title: "Event created!",
        description: "Your event has been successfully created.",
      });
      navigate(`/events/${event.id}`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error creating event",
        description: err.message || "There was an error creating your event.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location: {
    placeName: string;
    coordinates: [number, number];
  }) => {
    setSelectedLocation(location);

    const addressParts = location.placeName.split(", ");
    if (addressParts.length >= 3) {
      form.setValue("address", addressParts[0], { shouldValidate: true });
      const cityIndex =
        addressParts.length >= 4
          ? addressParts.length - 3
          : addressParts.length - 2;
      form.setValue("city", addressParts[cityIndex], {
        shouldValidate: true,
      });
      form.setValue("location", addressParts[0], { shouldValidate: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Create a New Event
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Host your own market event and invite local vendors
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 bg-white p-6 rounded-lg shadow"
            >
              {/* Event Details */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Event Details</h2>
                {/* name, description, date, times… (unchanged) */}
                {/* … */}
              </div>

              {/* Location Section */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Location</h2>
                {/* location search & fields (unchanged) */}
                {/* … */}
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
