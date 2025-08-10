import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-ESCROW-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      throw new Error("Razorpay credentials not configured");
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
      amount, 
      package_id, 
      ngo_id, 
      quantity, 
      package_title, 
      package_amount, 
      description 
    } = await req.json();

    if (!amount || !package_id || !ngo_id) {
      throw new Error("Missing required fields");
    }

    logStep("Creating donation record", { amount, package_id, ngo_id, quantity });

    // Create donation record with escrow status
    const { data: donation, error: donationError } = await supabaseClient
      .from("donations")
      .insert({
        user_id: user.id,
        ngo_id,
        package_id,
        package_title,
        package_amount,
        quantity,
        total_amount: amount,
        payment_method: "razorpay",
        payment_status: "escrow_pending", // New status for escrow
        service_status: "pending",
        transaction_id: `ESC_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`,
        invoice_number: `INV_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`
      })
      .select()
      .single();

    if (donationError) {
      logStep("Error creating donation", donationError);
      throw new Error(`Failed to create donation: ${donationError.message}`);
    }

    logStep("Donation created", { donation_id: donation.id });

    // Create transaction record for admin management
    const { data: transaction, error: transactionError } = await supabaseClient
      .from("transactions")
      .insert({
        donation_id: donation.id,
        package_id,
        ngo_id,
        donor_user_id: user.id,
        status: "escrow_pending",
        admin_notes: "Payment received in admin escrow, awaiting vendor assignment"
      })
      .select()
      .single();

    if (transactionError) {
      logStep("Error creating transaction", transactionError);
      throw new Error(`Failed to create transaction: ${transactionError.message}`);
    }

    const razorpayAmount = Math.round(amount * 100); // Convert to paise
    const currency = "INR";

    // Create Razorpay order
    const orderData = {
      amount: razorpayAmount,
      currency,
      receipt: `esc_${donation.id}`,
      notes: {
        donation_id: donation.id,
        transaction_id: transaction.id,
        package_title,
        ngo_id,
        escrow_type: "admin_managed"
      }
    };

    logStep("Creating Razorpay order", orderData);

    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text();
      throw new Error(`Razorpay API error: ${errorText}`);
    }

    const razorpayOrder = await razorpayResponse.json();
    logStep("Razorpay order created", { order_id: razorpayOrder.id });

    return new Response(JSON.stringify({
      success: true,
      razorpay_order: razorpayOrder,
      donation_id: donation.id,
      transaction_id: transaction.id
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