import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const siteUrl = (Deno.env.get("SITE_URL") ?? "https://simcanorge.no").replace(/\/$/, "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");

  if (!slug || slug.length === 0) {
    return new Response(
      `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${siteUrl}/biler"></head><body>Redirecting...</body></html>`,
      {
        status: 302,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Location": `${siteUrl}/biler`,
          ...corsHeaders,
        },
      },
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: row, error } = await supabase
    .from("cars")
    .select(`
      slug,
      title,
      year,
      brand,
      model,
      story,
      published_at,
      car_images(image_url, sort_order)
    `)
    .eq("slug", slug)
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .maybeSingle();

  if (error || !row) {
    return new Response(
      `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=${siteUrl}/biler"></head><body>Redirecting...</body></html>`,
      {
        status: 302,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Location": `${siteUrl}/biler`,
          ...corsHeaders,
        },
      },
    );
  }

  const car = row as {
    slug: string;
    title: string;
    year: number | null;
    brand: string | null;
    model: string;
    story: string | null;
    published_at: string | null;
    car_images?: { image_url: string; sort_order: number | null }[];
  };

  const sortedImages = (car.car_images ?? []).sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0),
  );
  const firstImage = sortedImages[0]?.image_url;

  const ogImage = firstImage?.startsWith("http")
    ? firstImage
    : firstImage
      ? `${siteUrl}${firstImage.startsWith("/") ? "" : "/"}${firstImage}`
      : `${siteUrl}/favicon.png`;

  const canonicalUrl = `${siteUrl}/biler/${car.slug}`;

  const title = `${car.title}${car.year != null ? ` (${car.year})` : ""} – Bilhistorie fra Norge | Simca Norge`;

  const description = car.story
    ? car.story.slice(0, 155).trim() + (car.story.length > 155 ? "…" : "")
    : `${[car.brand, car.model].filter(Boolean).join(" ")}${car.year != null ? ` (${car.year})` : ""} – Se historien på Simca Norge.`.trim();

  const html = `<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${canonicalUrl}">

  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${escapeHtml(ogImage)}">
  <meta property="og:site_name" content="Simca Norge">
  <meta property="og:locale" content="nb_NO">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(ogImage)}">

  <meta http-equiv="refresh" content="0;url=${canonicalUrl}">
</head>
<body>
  <p>Videresender til bilen… <a href="${canonicalUrl}">Gå til ${escapeHtml(car.title)}</a>.</p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
      ...corsHeaders,
    },
  });
});
