
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.8.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Create a single supabase client for interacting with the supabase database
const getServiceSupabase = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
}

// This function will be used to create a business when a user becomes a vendor
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, description, user_id } = await req.json()
    
    if (!name || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Business name and user ID are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    
    const supabase = getServiceSupabase()

    // Check if any businesses already exist for this user to avoid duplicates
    const { data: existingBusinesses, error: checkError } = await supabase
      .from('businesses')
      .select('id')
      .eq('created_by', user_id)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking for existing business:', checkError)
    }

    if (existingBusinesses?.id) {
      console.log('User already has a business, returning existing ID:', existingBusinesses.id)
      return new Response(
        JSON.stringify({ id: existingBusinesses.id, existing: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    // Create the business
    const { data: business, error } = await supabase
      .from('businesses')
      .insert({
        name,
        description: description || null,
        created_by: user_id
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('Error creating business:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    console.log('Business created successfully:', business)
    
    return new Response(
      JSON.stringify({ id: business.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
