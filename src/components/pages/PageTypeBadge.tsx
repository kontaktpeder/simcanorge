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

const darkVariants: Record<string, string> = {
  club: "bg-blue-900/40 text-blue-300 border border-blue-700/30",
  dealer: "bg-green-900/40 text-green-300 border border-green-700/30",
  museum: "bg-amber-900/40 text-amber-300 border border-amber-700/30",
  collection: "bg-purple-900/40 text-purple-300 border border-purple-700/30",
  workshop: "bg-orange-900/40 text-orange-300 border border-orange-700/30",
  business: "bg-[hsl(var(--page-accent)/0.15)] text-[hsl(var(--page-accent))] border border-[hsl(var(--page-accent)/0.3)]",
  garage: "bg-zinc-800/50 text-zinc-300 border border-zinc-700/30",
};

export function PageTypeBadge({ type, dark = false }: { type: string; dark?: boolean }) {
  const style = dark
    ? (darkVariants[type] ?? "bg-white/10 text-white/70 border border-white/10")
    : (variants[type] ?? "bg-muted text-muted-foreground");

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase ${style}`}>
      {labels[type] ?? type}
    </span>
  );
}
