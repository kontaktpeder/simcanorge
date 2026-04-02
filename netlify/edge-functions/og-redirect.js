export default async function handler(req, context) {
  const CRAWLER_UA = /facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|whatsapp|telegrambot|discordbot|pinterest|googlebot|bingbot/i;
  const ua = req.headers.get("user-agent") ?? "";

  if (!CRAWLER_UA.test(ua)) {
    return context.next();
  }

  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const slug = parts[1];

  if (!slug) return context.next();

  const supabaseUrl = (Deno.env.get("VITE_SUPABASE_URL") ?? "https://xsmjjkbycrzberloywqm.supabase.co").replace(/\/$/, "");
  if (!supabaseUrl) return context.next();

  const shareUrl = `${supabaseUrl}/functions/v1/share-biler?slug=${encodeURIComponent(slug)}`;

  return new Response(null, {
    status: 302,
    headers: { Location: shareUrl },
  });
}

export const config = {
  path: "/biler/:slug",
};
