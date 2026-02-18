import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InquiryItemInput {
  type: "part" | "listing";
  id: string;
  title: string;
}

interface RecipientGroup {
  recipient_owner_id: string | null;
  message: string;
  items: InquiryItemInput[];
}

interface InquiryRequest {
  customer_name: string;
  email: string;
  phone?: string;
  car_model?: string;
  car_year?: number;
  message?: string;
  /** New: pre-grouped items with per-recipient messages */
  items_by_recipient?: RecipientGroup[];
  /** @deprecated Legacy: flat items list (auto-grouped server-side) */
  items?: InquiryItemInput[];
}

/** Legacy fallback: group flat items by recipient via DB lookup */
async function groupItemsByRecipient(supabase: any, items: InquiryItemInput[]) {
  const adminItems: InquiryItemInput[] = [];
  const byOwnerId = new Map<string, InquiryItemInput[]>();

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

    if (!data.customer_name || !data.email) {
      return new Response(
        JSON.stringify({ error: "Mangler navn eller e-post" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Build recipient groups
    let groups: RecipientGroup[];

    if (data.items_by_recipient && data.items_by_recipient.length > 0) {
      // New format: already grouped by recipient with per-recipient messages
      groups = data.items_by_recipient.filter((g) => g.items.length > 0);
    } else if (data.items && data.items.length > 0) {
      // Legacy format: flat items list, group server-side
      const { adminItems, byOwnerId } = await groupItemsByRecipient(supabase, data.items);
      groups = [];
      if (adminItems.length > 0) {
        groups.push({ recipient_owner_id: null, message: data.message || "", items: adminItems });
      }
      for (const [ownerId, ownerItems] of byOwnerId) {
        groups.push({ recipient_owner_id: ownerId, message: data.message || "", items: ownerItems });
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Mangler varer" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const base = {
      customer_name: data.customer_name,
      email: data.email,
      phone: data.phone || null,
      car_model: data.car_model || null,
      car_year: data.car_year || null,
      read: false,
    };

    const ids: string[] = [];

    for (const g of groups) {
      const { data: inquiry, error: inquiryError } = await supabase
        .from("inquiries")
        .insert({
          ...base,
          message: g.message || null,
          recipient_owner_id: g.recipient_owner_id,
        })
        .select()
        .single();

      if (inquiryError) {
        console.error("Error inserting inquiry:", inquiryError);
        throw inquiryError;
      }

      const inquiryItems = g.items.map((it) => ({
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

      ids.push(inquiry.id);
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
