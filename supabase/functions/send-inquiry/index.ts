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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function genericError(status = 500) {
  return jsonResponse(
    { error: "Noe gikk galt. Prøv igjen senere." },
    status,
  );
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

  const requestId = crypto.randomUUID();
  console.log(`[send-inquiry ${requestId}] request received`);

  try {
    const data: InquiryRequest = await req.json();

    // Basic validation (no payload logging)
    if (
      !data?.customer_name ||
      typeof data.customer_name !== "string" ||
      !data.email ||
      typeof data.email !== "string" ||
      !EMAIL_RE.test(data.email.trim())
    ) {
      return jsonResponse({ error: "Mangler navn eller gyldig e-post" }, 400);
    }

    const hasNewFormat =
      Array.isArray(data.items_by_recipient) && data.items_by_recipient.length > 0;
    const hasLegacy = Array.isArray(data.items) && data.items.length > 0;
    if (!hasNewFormat && !hasLegacy) {
      return jsonResponse({ error: "Mangler varer" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---- Rate limiting (5 / 10 min per IP+email) ----
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const emailKey = data.email.trim().toLowerCase();
    const rateKey = `inquiry:${ip}:${emailKey}`;

    const { data: rl, error: rlError } = await supabase.rpc(
      "check_inquiry_rate_limit",
      { p_key: rateKey, p_max: 5, p_window_minutes: 10 },
    );

    if (rlError) {
      console.error(`[send-inquiry ${requestId}] rate-limit check failed`);
      // Fail closed on rate-limit infrastructure errors? Fail open to avoid breaking UX.
    } else if (rl && rl.allowed === false) {
      console.warn(`[send-inquiry ${requestId}] rate-limited`);
      return new Response(
        JSON.stringify({
          error: "For mange forespørsler. Prøv igjen senere.",
          retry_after_seconds: rl.retry_after_seconds ?? 600,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(rl.retry_after_seconds ?? 600),
            ...corsHeaders,
          },
        },
      );
    }

    // Build recipient groups
    let groups: RecipientGroup[];

    if (hasNewFormat) {
      groups = data.items_by_recipient!.filter((g) => g.items.length > 0);
    } else {
      const { adminItems, byOwnerId } = await groupItemsByRecipient(
        supabase,
        data.items!,
      );
      groups = [];
      if (adminItems.length > 0) {
        groups.push({
          recipient_owner_id: null,
          message: data.message || "",
          items: adminItems,
        });
      }
      for (const [ownerId, ownerItems] of byOwnerId) {
        groups.push({
          recipient_owner_id: ownerId,
          message: data.message || "",
          items: ownerItems,
        });
      }
    }

    if (groups.length === 0) {
      return jsonResponse({ error: "Mangler varer" }, 400);
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
        console.error(`[send-inquiry ${requestId}] insert inquiry failed`);
        return genericError();
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
        console.error(`[send-inquiry ${requestId}] insert items failed`);
      }

      ids.push(inquiry.id);
    }

    console.log(
      `[send-inquiry ${requestId}] ok groups=${groups.length} inquiries=${ids.length}`,
    );

    return jsonResponse(
      {
        success: true,
        message: "Forespørsel mottatt! Selger tar kontakt.",
        inquiry_ids: ids,
      },
      200,
    );
  } catch (_error) {
    console.error(`[send-inquiry ${requestId}] unhandled error`);
    return genericError();
  }
};

serve(handler);
