import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-RAZORPAY-ORDER] ${step}${detailsStr}`);
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

    const { transaction_id } = await req.json();
    if (!transaction_id) {
      throw new Error("Transaction ID is required");
    }

    logStep("Getting transaction details", { transaction_id });

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabaseClient
      .from("transactions")
      .select(`
        *,
        donations:donation_id(total_amount, package_title, ngo_id),
        ngos:ngo_id(name)
      `)
      .eq("id", transaction_id)
      .eq("donor_user_id", user.id)
      .single();

    if (transactionError || !transaction) {
      throw new Error("Transaction not found or access denied");
    }

    // Check if transaction is delivered
    if (transaction.status !== "delivered") {
      throw new Error("Payment can only be initiated after delivery confirmation");
    }

    // Check if payment already exists
    const { data: existingPayment } = await supabaseClient
      .from("payments")
      .select("*")
      .eq("transaction_id", transaction_id)
      .single();

    if (existingPayment && existingPayment.status !== "failed") {
      throw new Error("Payment already initiated for this transaction");
    }

    const amount = Math.round(transaction.donations.total_amount * 100); // Convert to paise
    const currency = "INR";

    // Create Razorpay order
    const orderData = {
      amount,
      currency,
      receipt: `txn_${transaction_id}`,
      notes: {
        transaction_id,
        package_title: transaction.donations.package_title,
        ngo_name: transaction.ngos.name
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

    // Save payment record
    const { data: payment, error: paymentError } = await supabaseClient
      .from("payments")
      .upsert({
        transaction_id,
        razorpay_order_id: razorpayOrder.id,
        amount: transaction.donations.total_amount,
        currency: "INR",
        status: "pending",
        user_id: user.id,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'transaction_id'
      })
      .select()
      .single();

    if (paymentError) {
      logStep("Error saving payment", paymentError);
      throw new Error(`Failed to save payment: ${paymentError.message}`);
    }

    logStep("Payment record saved", { payment_id: payment.id });

    return new Response(JSON.stringify({
      success: true,
      razorpay_order: razorpayOrder,
      payment_id: payment.id
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