import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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

    // Build parts list HTML
    const partsListHtml = data.items
      .map((item) => `<li>${item.part_title}</li>`)
      .join("");

    // Send email to admin (kontaktpeder@gmail.com)
    const adminEmailHtml = `
      <h1 style="color: #1e88e5;">🚗 Ny deler-forespørsel fra Simca Norge</h1>
      
      <h2>Kundeinformasjon</h2>
      <table style="border-collapse: collapse; margin-bottom: 20px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Navn:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.customer_name}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>E-post:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.email}</td></tr>
        ${data.phone ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Telefon:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.phone}</td></tr>` : ""}
        ${data.car_model ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Bilmodell:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.car_model}</td></tr>` : ""}
        ${data.car_year ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Årsmodell:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.car_year}</td></tr>` : ""}
      </table>
      
      <h2>Etterspurte deler</h2>
      <ul>${partsListHtml}</ul>
      
      ${data.message ? `<h2>Melding</h2><p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${data.message}</p>` : ""}
      
      <hr style="margin-top: 30px;" />
      <p style="color: #666; font-size: 12px;">Denne forespørselen er lagret i databasen.</p>
    `;

    const adminEmailResponse = await resend.emails.send({
      from: "Simca Norge <onboarding@resend.dev>",
      to: ["kontaktpeder@gmail.com"],
      subject: `Ny deler-forespørsel fra ${data.customer_name}`,
      html: adminEmailHtml,
    });

    console.log("Admin email sent:", adminEmailResponse);

    // Send confirmation email to customer
    const customerEmailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e88e5; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0;">SIMCA NORGE</h1>
          <p style="margin: 10px 0 0;">Takk for din forespørsel!</p>
        </div>
        
        <div style="padding: 30px; background: #fafafa;">
          <p>Hei ${data.customer_name},</p>
          
          <p>Vi har mottatt din forespørsel om følgende deler:</p>
          
          <ul style="background: white; padding: 20px 40px; border-radius: 5px; border: 1px solid #ddd;">
            ${partsListHtml}
          </ul>
          
          <p>Pappa sjekker hylla og kommer tilbake til deg så snart som mulig! 🔧</p>
          
          <p style="margin-top: 30px;">
            Med vennlig hilsen,<br/>
            <strong>Simca Norge</strong>
          </p>
        </div>
        
        <div style="background: #333; color: #999; padding: 20px; text-align: center; font-size: 12px;">
          <p>Dette er en automatisk bekreftelse. Du trenger ikke å svare på denne e-posten.</p>
        </div>
      </div>
    `;

    const customerEmailResponse = await resend.emails.send({
      from: "Simca Norge <onboarding@resend.dev>",
      to: [data.email],
      subject: "Bekreftelse: Vi har mottatt din forespørsel - Simca Norge",
      html: customerEmailHtml,
    });

    console.log("Customer confirmation email sent:", customerEmailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Forespørsel sendt! Sjekk e-posten din for bekreftelse.",
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
