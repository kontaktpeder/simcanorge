/**
 * Utforsk-navigasjon — Feed/Biler-fanene ble fjernet i PR-I.1.
 * `EXPLORE_SECTION_NAV_HEIGHT_PX` beholdes som høyde for
 * `ExploreDetailBackBar` (bil-detalj «Tilbake»-stripe).
 */
export const EXPLORE_SECTION_NAV_HEIGHT_PX = 52;

export function isExploreSectionPath(pathname: string): boolean {
  return (
    pathname === "/hjem" ||
    pathname.startsWith("/hjem/") ||
    pathname === "/biler" ||
    pathname.startsWith("/biler/")
  );
}

export function isCarDetailPath(pathname: string): boolean {
  return /^\/biler\/[^/]+$/.test(pathname);
}

/** Aldri lenger — beholdt for bakoverkompatibilitet. */
export function shouldShowExploreSectionNav(_pathname: string): boolean {
  return false;
}

export function isUtforskNavActive(pathname: string): boolean {
  return isExploreSectionPath(pathname);
}

export type ExploreSectionTab = "feed" | "biler";

export function getExploreSectionTab(pathname: string): ExploreSectionTab | null {
  if (isCarDetailPath(pathname)) return null;
  if (pathname === "/hjem" || pathname.startsWith("/hjem/")) return "feed";
  if (pathname === "/biler") return "biler";
  return null;
}
