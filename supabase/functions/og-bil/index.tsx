/// <reference lib="deno.ns" />
import React from "https://esm.sh/react@18.2.0";
import { ImageResponse } from "https://deno.land/x/og_edge@0.0.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://simcanorge.no").replace(/\/$/, "");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function abs(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/storage/")) return `${SUPABASE_URL}${url}`;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
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
    const year = (car as Record<string, unknown>).year as number | null;

    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            position: "relative",
            fontFamily: "sans-serif",
            backgroundColor: "#1a1a1a",
          }}
        >
          {/* Background car image */}
          <img
            src={mainImageUrl}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "630px",
              objectFit: "cover",
            }}
          />

          {/* Gradient overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "630px",
              background: "linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.92) 100%)",
              display: "flex",
            }}
          />

          {/* Content overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1200px",
              height: "630px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "48px",
            }}
          >
            {/* Year badge */}
            {year != null && (
              <div
                style={{
                  position: "absolute",
                  top: "36px",
                  left: "48px",
                  backgroundColor: "#c8a96e",
                  borderRadius: "2px",
                  padding: "6px 18px",
                  display: "flex",
                }}
              >
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    letterSpacing: "2px",
                  }}
                >
                  {String(year)}
                </span>
              </div>
            )}

            {/* Title */}
            <div
              style={{
                fontSize: "48px",
                fontWeight: 800,
                color: "#ffffff",
                marginBottom: "8px",
                display: "flex",
              }}
            >
              {title.length > 40 ? title.slice(0, 38) + "\u2026" : title}
            </div>

            {/* Kicker */}
            <div
              style={{
                fontSize: "20px",
                color: "#c8a96e",
                fontStyle: "italic",
                marginBottom: "28px",
                display: "flex",
              }}
            >
              Italiensk design. Norsk historie.
            </div>

            {/* Divider line */}
            <div
              style={{
                width: "100%",
                height: "1px",
                backgroundColor: "rgba(255,255,255,0.2)",
                marginBottom: "16px",
                display: "flex",
              }}
            />

            {/* Footer */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.7)" }}>
                Reportasje · Bilgarasje.no
              </span>
              <span style={{ fontSize: "16px", color: "rgba(255,255,255,0.5)" }}>
                simcanorge.no
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    console.error("og-bil error:", err);
    return new Response("Internal error", { status: 500 });
  }
});
