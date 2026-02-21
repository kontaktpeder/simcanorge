import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const { data: slugs, error } = await supabase
      .from("cars")
      .select("slug")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString());

    if (error) {
      console.error("Sitemap fetch error:", error);
      return new Response(
        `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}</loc></url></urlset>`,
        {
          status: 200,
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
            ...corsHeaders,
          },
        },
      );
    }

    const carSlugs = (slugs ?? []) as { slug: string }[];
    const now = new Date().toISOString();

    const urls = [
      { loc: siteUrl, priority: "1.0", changefreq: "daily" },
      { loc: `${siteUrl}/biler`, priority: "0.9", changefreq: "daily" },
      { loc: `${siteUrl}/manedens-bil`, priority: "0.9", changefreq: "weekly" },
      { loc: `${siteUrl}/markedsplass`, priority: "0.8", changefreq: "daily" },
      { loc: `${siteUrl}/historie`, priority: "0.7", changefreq: "monthly" },
      { loc: `${siteUrl}/om-oss`, priority: "0.5", changefreq: "monthly" },
      { loc: `${siteUrl}/kontakt`, priority: "0.5", changefreq: "monthly" },
      ...carSlugs.map(({ slug }) => ({
        loc: `${siteUrl}/biler/${slug}`,
        priority: "0.8",
        changefreq: "weekly",
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${escapeXml(u.loc)}</loc><lastmod>${now}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`,
  )
  .join("\n")}
</urlset>`;

    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml",
        "Cache-Control": "public, max-age=3600",
        ...corsHeaders,
      },
    });
  } catch (e) {
    console.error("Sitemap error:", e);
    return new Response("Internal error", {
      status: 500,
      headers: corsHeaders,
    });
  }
});

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
