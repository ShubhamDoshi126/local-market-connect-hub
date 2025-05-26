// src/components/event/ProductInterestButton.tsx
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface ProductInterestButtonProps {
  productId: string;
  eventId: string;
}

const ProductInterestButton = ({ productId, eventId }: ProductInterestButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [interested, setInterested] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkInterest = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("product_interests")
          .select("id")
          .eq("product_id", productId)
          .eq("user_id", user.id)
          .eq("event_id", eventId)
          .maybeSingle();

        if (error) throw error;
        setInterested(!!data);
      } catch (error) {
        console.error("Error checking interest:", error);
      } finally {
        setLoading(false);
      }
    };

    checkInterest();
  }, [productId, user, eventId]);

  const toggleInterest = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to express interest in products",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (interested) {
        // Remove interest
        const { error } = await supabase
          .from("product_interests")
          .delete()
          .eq("product_id", productId)
          .eq("user_id", user.id)
          .eq("event_id", eventId);

        if (error) throw error;
        setInterested(false);
        toast({
          title: "Interest Removed",
          description: "You are no longer interested in this product",
        });
      } else {
        // Add interest
        const { error } = await supabase
          .from("product_interests")
          .insert({
            product_id: productId,
            user_id: user.id,
            event_id: eventId,
          });

        if (error) throw error;
        setInterested(true);
        toast({
          title: "Interest Added",
          description: "You have expressed interest in this product",
        });
      }
    } catch (error: any) {
      console.error("Error toggling interest:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update interest",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={interested ? "default" : "outline"}
      size="sm"
      onClick={toggleInterest}
      disabled={loading}
      className={interested ? "bg-rose-500 hover:bg-rose-600" : ""}
    >
      <Heart className={`h-4 w-4 mr-2 ${interested ? "fill-white" : ""}`} />
      {interested ? "Interested" : "Express Interest"}
    </Button>
  );
};

export default ProductInterestButton;
