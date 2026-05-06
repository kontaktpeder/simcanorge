/**
 * Public, brandet base-URL for delbare lenker (invitasjoner, share, OG).
 * Alltid bilgarasje.no – aldri preview-/lovableproject-host.
 * Override med VITE_PUBLIC_SITE_URL kun ved behov (f.eks. staging).
 */
const ENV_URL =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined) ??
  (import.meta.env.VITE_SITE_URL as string | undefined);

export const PUBLIC_BASE_URL: string = (ENV_URL && ENV_URL.trim()
  ? ENV_URL
  : "https://bilgarasje.no"
).replace(/\/$/, "");

export const buildInviteUrl = (token: string): string =>
  `${PUBLIC_BASE_URL}/i/${token}`;
