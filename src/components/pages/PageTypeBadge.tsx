const labels: Record<string, string> = {
  club: "Klubb",
  dealer: "Forhandler",
  museum: "Museum",
  collection: "Samling",
  workshop: "Verksted",
  business: "Bedrift",
  garage: "Garasje",
};

const variants: Record<string, string> = {
  club: "bg-blue-100 text-blue-800",
  dealer: "bg-green-100 text-green-800",
  museum: "bg-amber-100 text-amber-800",
  collection: "bg-purple-100 text-purple-800",
  workshop: "bg-orange-100 text-orange-800",
  business: "bg-slate-100 text-slate-800",
  garage: "bg-zinc-100 text-zinc-800",
};

/**
 * Dark variants use the page-accent CSS variable so they automatically
 * adapt to the page-type theme (purple for samling, orange for business, etc.).
 */
const darkVariants: Record<string, string> = {
  club: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  dealer: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  museum: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  collection: "bg-[hsl(var(--page-accent)/0.12)] text-[hsl(var(--page-accent-light))] border border-[hsl(var(--page-accent)/0.25)]",
  workshop: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  business: "bg-[hsl(var(--page-accent)/0.12)] text-[hsl(var(--page-accent-light))] border border-[hsl(var(--page-accent)/0.25)]",
  garage: "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20",
};

export function PageTypeBadge({ type, dark = false }: { type: string; dark?: boolean }) {
  const style = dark
    ? (darkVariants[type] ?? "bg-white/8 text-white/60 border border-white/10")
    : (variants[type] ?? "bg-muted text-muted-foreground");

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.15em] uppercase ${style}`}>
      {labels[type] ?? type}
    </span>
  );
}
