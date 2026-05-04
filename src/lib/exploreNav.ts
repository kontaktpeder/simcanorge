/** Height of ExploreSectionNav root — keep in sync with Tailwind h-* on the nav bar. */
export const EXPLORE_SECTION_NAV_HEIGHT_PX = 52;

export function isExploreSectionPath(pathname: string): boolean {
  return (
    pathname === "/hjem" ||
    pathname.startsWith("/hjem/") ||
    pathname === "/biler" ||
    pathname.startsWith("/biler/")
  );
}

export type ExploreSectionTab = "feed" | "biler";

export function getExploreSectionTab(pathname: string): ExploreSectionTab | null {
  if (pathname === "/hjem" || pathname.startsWith("/hjem/")) return "feed";
  if (pathname === "/biler" || pathname.startsWith("/biler/")) return "biler";
  return null;
}
