
import { supabase } from "@/integrations/supabase/client";

export async function setAdminRole(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', userId)
    .select();

  if (error) {
    console.error('Error setting admin role:', error);
    throw error;
  }

  return data;
}
