import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InquiryItem {
  type: "part" | "listing";
  id: string;
  title: string;
}

interface InquiryRequest {
  customer_name: string;
  email: string;
  phone?: string;
  car_model?: string;
  car_year?: number;
  message?: string;
  items: InquiryItem[];
}

async function groupItemsByRecipient(supabase: any, items: InquiryItem[]) {
  const adminItems: InquiryItem[] = [];
  const byOwnerId = new Map<string, InquiryItem[]>();

  for (const item of items) {
    if (item.type === "part") {
      adminItems.push(item);
    } else if (item.type === "listing") {
      const { data: listing } = await supabase
        .from("marketplace_items")
        .select("owner_id")
        .eq("id", item.id)
        .single();
      const ownerId = listing?.owner_id ?? null;
      if (ownerId) {
        const list = byOwnerId.get(ownerId) ?? [];
        list.push(item);
        byOwnerId.set(ownerId, list);
      } else {
        adminItems.push(item);
      }
    }
  }

  return { adminItems, byOwnerId };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: InquiryRequest = await req.json();
    console.log("Received inquiry:", JSON.stringify(data, null, 2));

    if (!data.customer_name || !data.email || !data.items || data.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Mangler påkrevde felt (navn, e-post, eller varer)" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { adminItems, byOwnerId } = await groupItemsByRecipient(supabase, data.items);

    const baseInquiry = {
      customer_name: data.customer_name,
      email: data.email,
      phone: data.phone || null,
      car_model: data.car_model || null,
      car_year: data.car_year || null,
      message: data.message || null,
      read: false,
    };

    const insertInquiry = async (recipientOwnerId: string | null, items: InquiryItem[]) => {
      const { data: inquiry, error: inquiryError } = await supabase
        .from("inquiries")
        .insert({ ...baseInquiry, recipient_owner_id: recipientOwnerId })
        .select()
        .single();

      if (inquiryError) {
        console.error("Error inserting inquiry:", inquiryError);
        throw inquiryError;
      }

      const inquiryItems = items.map((it) => ({
        inquiry_id: inquiry.id,
        part_id: it.type === "part" ? it.id : null,
        marketplace_item_id: it.type === "listing" ? it.id : null,
        part_title: it.title,
      }));

      const { error: itemsError } = await supabase
        .from("inquiry_items")
        .insert(inquiryItems);

      if (itemsError) {
        console.error("Error inserting inquiry items:", itemsError);
      }

      return inquiry.id;
    };

    const ids: string[] = [];
    if (adminItems.length > 0) {
      ids.push(await insertInquiry(null, adminItems));
    }
    for (const [ownerId, ownerItems] of byOwnerId) {
      ids.push(await insertInquiry(ownerId, ownerItems));
    }

    console.log("Inquiries created:", ids);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Forespørsel mottatt! Selger tar kontakt.",
        inquiry_ids: ids,
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
