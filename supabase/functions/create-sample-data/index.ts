import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const sampleUsers = [
      {
        email: 'ngo1@example.com',
        password: 'password123',
        first_name: 'Sarah',
        last_name: 'Johnson',
        role: 'ngo'
      },
      {
        email: 'ngo2@example.com', 
        password: 'password123',
        first_name: 'Michael',
        last_name: 'Chen',
        role: 'ngo'
      },
      {
        email: 'ngo3@example.com',
        password: 'password123',
        first_name: 'Priya',
        last_name: 'Sharma',
        role: 'ngo'
      },
      {
        email: 'vendor1@example.com',
        password: 'password123', 
        first_name: 'David',
        last_name: 'Wilson',
        role: 'vendor'
      },
      {
        email: 'vendor2@example.com',
        password: 'password123',
        first_name: 'Lisa', 
        last_name: 'Martinez',
        role: 'vendor'
      },
      {
        email: 'user1@example.com',
        password: 'password123',
        first_name: 'Emily',
        last_name: 'Davis', 
        role: 'user'
      }
    ]

    const createdUsers = []

    for (const userData of sampleUsers) {
      // Check if user already exists
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('email', userData.email)
        .single()

      if (existingProfile) {
        console.log(`User ${userData.email} already exists, skipping...`)
        continue
      }

      // Create user
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          first_name: userData.first_name,
          last_name: userData.last_name
        }
      })

      if (authError) {
        console.error(`Error creating user ${userData.email}:`, authError)
        continue
      }

      if (authUser.user) {
        // Set user role
        await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: authUser.user.id,
            role: userData.role
          })

        createdUsers.push({
          email: userData.email,
          name: `${userData.first_name} ${userData.last_name}`,
          role: userData.role
        })
      }
    }

    // Create sample NGOs if users were created
    const ngoUsers = createdUsers.filter(u => u.role === 'ngo')
    if (ngoUsers.length > 0) {
      const ngoUser1 = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('email', 'ngo1@example.com')
        .single()

      const ngoUser2 = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('email', 'ngo2@example.com')
        .single()

      const ngoUser3 = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('email', 'ngo3@example.com')
        .single()

      if (ngoUser1.data && ngoUser2.data && ngoUser3.data) {
        await supabaseAdmin
          .from('ngos')
          .insert([
            {
              name: 'Green Earth Foundation',
              email: 'contact@greenearth.org',
              description: 'Environmental conservation and sustainability organization',
              mission: 'To protect and preserve our planet for future generations',
              location: 'San Francisco, CA',
              category: 'Environment',
              phone: '+1-555-0101',
              website_url: 'https://greenearth.org',
              registration_number: 'REG-NGO-001',
              user_id: ngoUser1.data.user_id,
              is_verified: true,
              is_active: true
            },
            {
              name: 'Hope for Children',
              email: 'info@hopechildren.org',
              description: 'Dedicated to improving children\'s lives through education and healthcare',
              mission: 'Every child deserves a bright future',
              location: 'New York, NY',
              category: 'Education',
              phone: '+1-555-0102',
              website_url: 'https://hopechildren.org',
              registration_number: 'REG-NGO-002',
              user_id: ngoUser2.data.user_id,
              is_verified: true,
              is_active: true
            }
          ])

        // Update Akshaya Patra Foundation to assign it to ngo3@example.com
        await supabaseAdmin
          .from('ngos')
          .update({
            user_id: ngoUser3.data.user_id
          })
          .eq('name', 'Akshaya Patra Foundation')
      }
    }

    // Create sample vendors if users were created
    const vendorUsers = createdUsers.filter(u => u.role === 'vendor')
    if (vendorUsers.length > 0) {
      const vendorUser1 = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('email', 'vendor1@example.com')
        .single()

      const vendorUser2 = await supabaseAdmin
        .from('profiles')
        .select('user_id')
        .eq('email', 'vendor2@example.com')
        .single()

      if (vendorUser1.data && vendorUser2.data) {
        await supabaseAdmin
          .from('vendors')
          .insert([
            {
              company_name: 'EcoSupplies Ltd',
              contact_person: 'David Wilson',
              email: 'orders@ecosupplies.com',
              phone: '+1-555-0201',
              address: '123 Green Street, Portland, OR',
              description: 'Sustainable and eco-friendly supplies for organizations',
              services: ['Eco-friendly products', 'Sustainable packaging', 'Green office supplies'],
              user_id: vendorUser1.data.user_id,
              is_active: true
            },
            {
              company_name: 'TechServe Solutions',
              contact_person: 'Lisa Martinez',
              email: 'support@techserve.com',
              phone: '+1-555-0202',
              address: '456 Tech Avenue, Austin, TX',
              description: 'Technology solutions and IT services for non-profits',
              services: ['IT consulting', 'Software development', 'Tech support'],
              user_id: vendorUser2.data.user_id,
              is_active: true
            }
          ])
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Sample data created successfully',
        created_users: createdUsers
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error creating sample data:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to create sample data' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})