/**
 * Public, brandet base-URL for delbare lenker (invitasjoner, share, OG).
 * Prioritet: VITE_PUBLIC_SITE_URL > VITE_SITE_URL > window.location.origin.
 */
export const PUBLIC_BASE_URL: string = (() => {
  const fromEnv =
    (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ??
    (import.meta.env.VITE_SITE_URL as string | undefined);
  if (fromEnv && fromEnv.trim()) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "https://bilgarasje.no";
})();

export const buildInviteUrl = (token: string): string =>
  `${PUBLIC_BASE_URL}/i/${token}`;
