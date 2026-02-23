import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  "Cache-Control": "public, max-age=3600",
  ...corsHeaders,
};

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastmod(iso: string | null | undefined): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://simcanorge.lovable.app";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cars, error } = await supabase
      .from("cars")
      .select("slug, updated_at, published_at")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString());

    const { data: owners, error: ownersError } = await supabase
      .from("owners")
      .select("slug, updated_at")
      .eq("visible_public", true)
      .not("approved_at", "is", null)
      .not("slug", "is", null);

    if (error) {
      console.error("Sitemap fetch error:", error);
    }
    if (ownersError) {
      console.error("Sitemap owners fetch error:", ownersError);
    }

    const carList = (cars ?? []) as {
      slug: string;
      updated_at?: string;
      published_at?: string;
    }[];
    const ownerList = (owners ?? []) as {
      slug: string;
      updated_at?: string;
    }[];
    const nowIso = new Date().toISOString().slice(0, 10);

    const staticEntries = [
      { loc: siteUrl, lastmod: nowIso, changefreq: "daily", priority: "1.0" },
      { loc: `${siteUrl}/biler`, lastmod: nowIso, changefreq: "daily", priority: "0.9" },
      { loc: `${siteUrl}/manedens-bil`, lastmod: nowIso, changefreq: "weekly", priority: "0.9" },
      { loc: `${siteUrl}/markedsplass`, lastmod: nowIso, changefreq: "daily", priority: "0.8" },
      { loc: `${siteUrl}/historie`, lastmod: nowIso, changefreq: "monthly", priority: "0.7" },
      { loc: `${siteUrl}/om-oss`, lastmod: nowIso, changefreq: "monthly", priority: "0.5" },
      { loc: `${siteUrl}/kontakt`, lastmod: nowIso, changefreq: "monthly", priority: "0.5" },
    ];

    const carEntries = carList.map((c) => ({
      loc: `${siteUrl}/biler/${c.slug}`,
      lastmod: formatLastmod(c.updated_at ?? c.published_at),
      changefreq: "weekly",
      priority: "0.8",
    }));

    const ownerEntries = ownerList.map((o) => ({
      loc: `${siteUrl}/profil/${o.slug}`,
      lastmod: formatLastmod(o.updated_at),
      changefreq: "monthly",
      priority: "0.6",
    }));

    const urls = [...staticEntries, ...carEntries, ...ownerEntries];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${escapeXml(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, { status: 200, headers: XML_HEADERS });
  } catch (e) {
    console.error("Sitemap error:", e);
    const siteUrl = Deno.env.get("SITE_URL") ?? "https://simcanorge.lovable.app";
    const nowIso = new Date().toISOString().slice(0, 10);
    const fallback =
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${escapeXml(siteUrl)}</loc><lastmod>${nowIso}</lastmod></url></urlset>`;
    return new Response(fallback, { status: 200, headers: XML_HEADERS });
  }
});
