import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from project root if present (for local runs; Lovable injects env at build time)
const envPath = resolve(__dirname, "../.env");
if (existsSync(envPath)) {
  const env = readFileSync(envPath, "utf-8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([^#=]+)=(.*)$/);
    if (m) {
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const SITE_URL = (process.env.VITE_SITE_URL || "https://bilgarasje.no").replace(/\/$/, "");
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY;

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

/** Alltid skriv gyldig sitemap; brukes både ved suksess og fallback. */
function writeSitemap(urls) {
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
  return outPath;
}

/** Statiske URL-er som brukes når Supabase/env mangler eller fetch feiler. */
function getStaticUrls() {
  const nowIso = new Date().toISOString().slice(0, 10);
  return [
    { loc: SITE_URL, lastmod: nowIso, changefreq: "daily", priority: "1.0" },
    { loc: `${SITE_URL}/biler`, lastmod: nowIso, changefreq: "daily", priority: "0.9" },
    { loc: `${SITE_URL}/manedens-bil`, lastmod: nowIso, changefreq: "weekly", priority: "0.9" },
    { loc: `${SITE_URL}/markedsplass`, lastmod: nowIso, changefreq: "daily", priority: "0.8" },
    { loc: `${SITE_URL}/historie`, lastmod: nowIso, changefreq: "monthly", priority: "0.7" },
    { loc: `${SITE_URL}/om-oss`, lastmod: nowIso, changefreq: "monthly", priority: "0.5" },
    { loc: `${SITE_URL}/kontakt`, lastmod: nowIso, changefreq: "monthly", priority: "0.5" },
  ];
}

async function main() {
  const staticEntries = getStaticUrls();

  if (!supabaseUrl || !supabaseKey) {
    console.warn("[generate-sitemap] Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY – writing sitemap with static URLs only.");
    const outPath = writeSitemap(staticEntries);
    console.log(`✅ Sitemap (static only): ${outPath} (${staticEntries.length} URLs)`);
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cars, error } = await supabase
      .from("cars")
      .select("slug, updated_at, published_at")
      .not("published_at", "is", null)
      .lte("published_at", new Date().toISOString());

    if (error) {
      console.warn("[generate-sitemap] Supabase cars fetch error:", error.message, "– using static URLs only.");
      const outPath = writeSitemap(staticEntries);
      console.log(`✅ Sitemap (static only): ${outPath} (${staticEntries.length} URLs)`);
      return;
    }

    const carEntries = (cars || [])
      .filter((c) => c?.slug && String(c.slug).trim())
      .map((c) => ({
        loc: `${SITE_URL}/biler/${c.slug}`,
        lastmod: formatLastmod(c.updated_at || c.published_at),
        changefreq: "weekly",
        priority: "0.8",
      }));

    // Fetch public owner profiles
    let ownerEntries = [];
    const { data: owners, error: ownersError } = await supabase
      .from("owners")
      .select("slug, updated_at")
      .eq("visible_public", true)
      .not("approved_at", "is", null)
      .not("slug", "is", null);

    if (ownersError) {
      console.warn("[generate-sitemap] Supabase owners fetch error:", ownersError.message, "– skipping owner URLs.");
    } else {
      ownerEntries = (owners || [])
        .filter((o) => o?.slug && String(o.slug).trim())
        .map((o) => ({
          loc: `${SITE_URL}/profil/${o.slug}`,
          lastmod: formatLastmod(o.updated_at),
          changefreq: "monthly",
          priority: "0.6",
        }));
    }

    const urls = [...staticEntries, ...carEntries, ...ownerEntries];
    const outPath = writeSitemap(urls);
    console.log(`✅ Sitemap generated: ${outPath} (${urls.length} URLs)`);
  } catch (err) {
    console.warn("[generate-sitemap] Error:", err?.message ?? err, "– using static URLs only.");
    const outPath = writeSitemap(staticEntries);
    console.log(`✅ Sitemap (static only): ${outPath} (${staticEntries.length} URLs)`);
  }
}

main();
