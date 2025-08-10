import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreatePORequest {
  donation_id: string;
  package_id: string;
  ngo_id: string;
  vendor_id: string;
  total_amount: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { donation_id, package_id, ngo_id, vendor_id, total_amount }: CreatePORequest = await req.json();

    // Generate PO number
    const po_number = `PO-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Set expected delivery date (7 days from now)
    const expected_delivery_date = new Date();
    expected_delivery_date.setDate(expected_delivery_date.getDate() + 7);

    // Create purchase order
    const { data: po, error: poError } = await supabaseClient
      .from("purchase_orders")
      .insert({
        po_number,
        vendor_id,
        ngo_id,
        package_id,
        donation_id,
        total_amount,
        status: "pending",
        expected_delivery_date: expected_delivery_date.toISOString()
      })
      .select()
      .single();

    if (poError) {
      throw poError;
    }

    console.log("Purchase order created:", po);

    return new Response(
      JSON.stringify({ success: true, purchase_order: po }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in create-purchase-order function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);