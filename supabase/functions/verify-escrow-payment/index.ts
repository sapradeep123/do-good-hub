import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-ESCROW-PAYMENT] ${step}${detailsStr}`);
};

// Function to verify Razorpay signature
function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  secret: string
): boolean {
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(secret);
  const messageBytes = encoder.encode(body);
  
  return crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  ).then(key => {
    return crypto.subtle.sign("HMAC", key, messageBytes);
  }).then(signature => {
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return expectedSignature === razorpaySignature;
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      throw new Error("Razorpay secret not configured");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      donation_id 
    } = await req.json();

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !donation_id) {
      throw new Error("Missing required payment verification data");
    }

    logStep("Verifying escrow payment", { 
      razorpay_payment_id, 
      razorpay_order_id, 
      donation_id 
    });

    // Verify signature
    const isValidSignature = await verifyRazorpaySignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret
    );

    if (!isValidSignature) {
      throw new Error("Invalid payment signature");
    }

    logStep("Signature verified successfully");

    // Get donation record
    const { data: donation, error: donationError } = await supabaseClient
      .from("donations")
      .select("*")
      .eq("id", donation_id)
      .eq("user_id", user.id)
      .single();

    if (donationError || !donation) {
      throw new Error("Donation record not found");
    }

    // Update donation with escrow completion
    const { error: updateDonationError } = await supabaseClient
      .from("donations")
      .update({
        payment_status: "escrow_completed", // Payment received in escrow
        service_status: "admin_review", // Ready for admin processing
        transaction_id: razorpay_payment_id,
        updated_at: new Date().toISOString()
      })
      .eq("id", donation_id);

    if (updateDonationError) {
      throw new Error(`Failed to update donation: ${updateDonationError.message}`);
    }

    // Update transaction status
    const { error: updateTransactionError } = await supabaseClient
      .from("transactions")
      .update({
        status: "escrow_completed",
        admin_notes: "Payment verified and secured in escrow. Ready for vendor assignment.",
        updated_at: new Date().toISOString()
      })
      .eq("donation_id", donation_id);

    if (updateTransactionError) {
      logStep("Warning: Failed to update transaction status", updateTransactionError);
    }

    logStep("Escrow payment verification completed successfully");

    return new Response(JSON.stringify({
      success: true,
      message: "Payment verified and secured in admin escrow",
      donation_id: donation_id,
      status: "escrow_completed"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});