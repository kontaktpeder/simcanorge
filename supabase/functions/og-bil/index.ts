import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://simcanorge.no").replace(/\/$/, "");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function abs(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug");
    if (!slug) return new Response("Missing slug", { status: 400 });

    const { data: car, error } = await supabase
      .from("cars")
      .select("id, title, brand, model, year, car_images(image_url, sort_order)")
      .eq("slug", slug)
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString())
      .maybeSingle();

    if (error || !car) return new Response("Not found", { status: 404 });

    const images = ((car as Record<string, unknown>).car_images as Array<{ image_url: string; sort_order?: number }> ?? [])
      .slice()
      .sort((a, b) => (a.sort_order ?? 9999) - (b.sort_order ?? 9999));
    const mainImageUrl = abs(images[0]?.image_url ?? "/favicon.png");

    const title = String(
      (car as Record<string, unknown>).title ??
      [(car as Record<string, unknown>).brand, (car as Record<string, unknown>).model, (car as Record<string, unknown>).year].filter(Boolean).join(" ")
    );
    const displayTitle = title.length > 40 ? title.slice(0, 38) + "\u2026" : title;
    const year = (car as Record<string, unknown>).year as number | null;

    const yearSvg = year != null
      ? `<rect x="48" y="36" width="${String(year).length * 16 + 36}" height="40" rx="2" fill="#c8a96e"/>
         <text x="66" y="63" font-family="sans-serif" font-size="22" font-weight="700" fill="#1a1a1a" letter-spacing="2">${year}</text>`
      : "";

    const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="50%" stop-color="rgba(0,0,0,0.4)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.92)"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="#1a1a1a"/>
  <image href="${esc(mainImageUrl)}" x="0" y="0" width="1200" height="630" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1200" height="630" fill="url(#g)"/>
  ${yearSvg}
  <text x="48" y="500" font-family="sans-serif" font-size="48" font-weight="800" fill="#ffffff">${esc(displayTitle)}</text>
  <text x="48" y="540" font-family="sans-serif" font-size="20" fill="#c8a96e" font-style="italic">Italiensk design. Norsk historie.</text>
  <line x1="48" y1="568" x2="1152" y2="568" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>
  <text x="48" y="596" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.7)">Reportasje \u00b7 Simca Norge</text>
  <text x="1152" y="596" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.5)" text-anchor="end">simcanorge.no</text>
</svg>`;

    return new Response(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("og-bil error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
