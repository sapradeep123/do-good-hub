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
    const { email, token, newPassword } = await req.json()

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

    // Create regular client for checking token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Verify the token
    const { data: resetRequest, error: tokenError } = await supabase
      .from('password_reset_requests')
      .select('*')
      .eq('email', email)
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (tokenError || !resetRequest) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired reset token' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get the user ID from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update the password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.user_id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update password' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Mark the token as used
    await supabase
      .from('password_reset_requests')
      .update({ used: true })
      .eq('id', resetRequest.id)

    return new Response(
      JSON.stringify({ success: true, message: 'Password updated successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Reset password error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})