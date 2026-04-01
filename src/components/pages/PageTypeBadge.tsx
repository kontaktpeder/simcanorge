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

export function PageTypeBadge({ type }: { type: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[type] ?? "bg-muted text-muted-foreground"}`}>
      {labels[type] ?? type}
    </span>
  );
}
