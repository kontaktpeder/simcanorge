/** Height of ExploreSectionNav root — keep in sync with Tailwind h-* on the nav bar. */
export const EXPLORE_SECTION_NAV_HEIGHT_PX = 52;

/** Feed + archive list live under Utforsk; slug is depth, not a third tab. */
export function isExploreSectionPath(pathname: string): boolean {
  return (
    pathname === "/hjem" ||
    pathname.startsWith("/hjem/") ||
    pathname === "/biler" ||
    pathname.startsWith("/biler/")
  );
}

/** `/biler/:slug` — object depth from feed; no Feed|Biler switcher. */
export function isCarDetailPath(pathname: string): boolean {
  return /^\/biler\/[^/]+$/.test(pathname);
}

/** Section nav (Feed | Biler) — not on car detail pages. */
export function shouldShowExploreSectionNav(pathname: string): boolean {
  return isExploreSectionPath(pathname) && !isCarDetailPath(pathname);
}

/** Bottom nav + desktop Utforsk highlight: feed + archive + car depth. */
export function isUtforskNavActive(pathname: string): boolean {
  return (
    pathname === "/hjem" ||
    pathname.startsWith("/hjem/") ||
    pathname === "/biler" ||
    pathname.startsWith("/biler/")
  );
}

export type ExploreSectionTab = "feed" | "biler";

export function getExploreSectionTab(pathname: string): ExploreSectionTab | null {
  if (isCarDetailPath(pathname)) return null;
  if (pathname === "/hjem" || pathname.startsWith("/hjem/")) return "feed";
  if (pathname === "/biler") return "biler";
  return null;
}
