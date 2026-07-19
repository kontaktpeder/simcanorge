/**
 * Kanonisk offentlig origin for SEO (canonical, OG, JSON-LD).
 * Aldri bruk window.location.origin i metadata.
 */
const ENV_URL =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ??
  (import.meta.env.VITE_SITE_URL as string | undefined);

const DEFAULT_ORIGIN = "https://simcanorge.no";

export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "simcanorge.no" || host.endsWith(".simcanorge.no")) {
      return DEFAULT_ORIGIN;
    }
    if (host === "bilgarasje.no" || host.endsWith(".bilgarasje.no")) {
      // Legacy-domene under tilbakeføring til Simca Norge
      return DEFAULT_ORIGIN;
    }
  }
  const fromEnv = ENV_URL?.trim();
  return (fromEnv ? fromEnv : DEFAULT_ORIGIN).replace(/\/$/, "");
}

/** Path uten query/hash → absolutt canonical URL */
export function buildCanonicalUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return `${base}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

export const DEFAULT_OG_IMAGE = `${DEFAULT_ORIGIN}/og-image.png`;
