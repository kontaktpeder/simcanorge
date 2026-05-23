export type FeedTheme = "light" | "dark";

export function feedThemeTokens(theme: FeedTheme) {
  const isLight = theme === "light";
  return {
    isLight,
    inter: { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" } as const,
    oswald: { fontFamily: "'Oswald', 'Impact', sans-serif" } as const,
    oswaldLight: { fontFamily: "'Oswald', sans-serif", fontWeight: 300 } as const,
    body: isLight ? "text-neutral-800" : "text-white/85",
    muted: isLight ? "text-neutral-500" : "text-white/40",
    subtle: isLight ? "text-neutral-400" : "text-white/30",
    author: isLight ? "text-neutral-900 hover:text-[#ff8a00]" : "text-white hover:text-[#34eab8]",
    titleColor: isLight ? "text-[#2b2b2b] hover:text-[#ff8a00]" : "text-white hover:text-[#2dd4a8]",
    cardBorder: isLight ? "border-black/[0.08]" : "border-white/[0.06]",
    draftChip: isLight
      ? "bg-neutral-100 text-neutral-500 border-neutral-200"
      : "bg-white/[0.06] text-white/40 border-white/[0.08]",
    badgeStyle: isLight
      ? { background: "#fcc419", color: "#2b2b2b" }
      : { background: "rgba(45,212,168,0.14)", color: "#2dd4a8" },
  };
}
