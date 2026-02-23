import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;
const siteUrl = (process.env.VITE_SITE_URL || "https://simcanorge.no").replace(/\/$/, "");

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY");
  process.exit(1);
}

function escapeXml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatLastmod(iso) {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return iso.slice(0, 10);
}

async function main() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const nowIso = new Date().toISOString().slice(0, 10);

  const { data: cars, error } = await supabase
    .from("cars")
    .select("slug, updated_at, published_at")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString());

  if (error) {
    console.error("Error fetching cars:", error.message);
    process.exit(1);
  }

  const staticEntries = [
    { loc: siteUrl, lastmod: nowIso, changefreq: "daily", priority: "1.0" },
    { loc: `${siteUrl}/biler`, lastmod: nowIso, changefreq: "daily", priority: "0.9" },
    { loc: `${siteUrl}/manedens-bil`, lastmod: nowIso, changefreq: "weekly", priority: "0.9" },
    { loc: `${siteUrl}/markedsplass`, lastmod: nowIso, changefreq: "daily", priority: "0.8" },
    { loc: `${siteUrl}/historie`, lastmod: nowIso, changefreq: "monthly", priority: "0.7" },
    { loc: `${siteUrl}/om-oss`, lastmod: nowIso, changefreq: "monthly", priority: "0.5" },
    { loc: `${siteUrl}/kontakt`, lastmod: nowIso, changefreq: "monthly", priority: "0.5" },
  ];

  const carEntries = (cars || []).map((c) => ({
    loc: `${siteUrl}/biler/${c.slug}`,
    lastmod: formatLastmod(c.updated_at || c.published_at),
    changefreq: "weekly",
    priority: "0.8",
  }));

  const urls = [...staticEntries, ...carEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) =>
      `  <url><loc>${escapeXml(u.loc)}</loc><lastmod>${u.lastmod}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
  )
  .join("\n")}
</urlset>`;

  const outPath = resolve(__dirname, "../public/sitemap.xml");
  writeFileSync(outPath, xml, "utf-8");
  console.log(`✅ Sitemap generated: ${outPath} (${urls.length} URLs)`);
}

main();
