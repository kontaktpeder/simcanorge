/**
 * Public, brandet base-URL for delbare lenker (invitasjoner, share, OG).
 * Alltid bilgarasje.no – aldri preview-/lovableproject-host.
 * Bruker felles `getSiteUrl()` for å ha én sannhetskilde.
 */
import { getSiteUrl } from "./siteUrl";

export const PUBLIC_BASE_URL: string = getSiteUrl();

export const buildInviteUrl = (token: string): string =>
  `${PUBLIC_BASE_URL}/i/${token}`;
