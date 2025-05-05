
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

// Create a single supabase client for interacting with the supabase database
const getServiceSupabase = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

// This function will be used by our RLS policies to check if a user has access to a business
serve(async (req) => {
  const { user_id, business_id } = await req.json()
  
  if (!user_id || !business_id) {
    return new Response(
      JSON.stringify({ error: 'User ID and Business ID are required' }),
      { headers: { 'Content-Type': 'application/json' }, status: 400 }
    )
  }
  
  const supabase = getServiceSupabase()
  
  try {
    // Check if user is the business owner
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('created_by')
      .eq('id', business_id)
      .single()
    
    if (businessError) throw businessError
    
    if (business?.created_by === user_id) {
      return new Response(
        JSON.stringify({ has_access: true, role: 'owner' }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Check if user is a team member
    const { data: member, error: memberError } = await supabase
      .from('business_members')
      .select('role')
      .eq('business_id', business_id)
      .eq('user_id', user_id)
      .maybeSingle()
    
    if (memberError) throw memberError
    
    if (member) {
      return new Response(
        JSON.stringify({ has_access: true, role: member.role }),
        { headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return new Response(
      JSON.stringify({ has_access: false }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
