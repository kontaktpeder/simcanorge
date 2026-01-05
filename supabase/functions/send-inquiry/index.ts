import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InquiryRequest {
  customer_name: string;
  email: string;
  phone?: string;
  car_model?: string;
  car_year?: number;
  message?: string;
  items: Array<{
    part_id: string;
    part_title: string;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: InquiryRequest = await req.json();
    console.log("Received inquiry:", JSON.stringify(data, null, 2));

    // Validate required fields
    if (!data.customer_name || !data.email || !data.items || data.items.length === 0) {
      console.error("Missing required fields");
      return new Response(
        JSON.stringify({ error: "Mangler påkrevde felt (navn, e-post, eller deler)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert inquiry into database
    const { data: inquiry, error: inquiryError } = await supabase
      .from("inquiries")
      .insert({
        customer_name: data.customer_name,
        email: data.email,
        phone: data.phone || null,
        car_model: data.car_model || null,
        car_year: data.car_year || null,
        message: data.message || null,
        read: false,
      })
      .select()
      .single();

    if (inquiryError) {
      console.error("Error inserting inquiry:", inquiryError);
      return new Response(
        JSON.stringify({ error: "Kunne ikke lagre forespørselen" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Inquiry created:", inquiry.id);

    // Insert inquiry items
    const inquiryItems = data.items.map((item) => ({
      inquiry_id: inquiry.id,
      part_id: item.part_id,
      part_title: item.part_title,
    }));

    const { error: itemsError } = await supabase
      .from("inquiry_items")
      .insert(inquiryItems);

    if (itemsError) {
      console.error("Error inserting inquiry items:", itemsError);
    }

    console.log("Inquiry items created for inquiry:", inquiry.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Forespørsel mottatt! Vi tar kontakt så snart som mulig.",
        inquiry_id: inquiry.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-inquiry function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);