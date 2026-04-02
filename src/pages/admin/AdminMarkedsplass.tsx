import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useAdminMarketplaceItems } from "@/hooks/useMarketplace";
import { Loader2, ShoppingBag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MarketplaceImage {
  id: string;
  image_url: string;
  sort_order: number;
}

interface MarketplaceCategory {
  id: string;
  name: string;
  slug: string;
}

interface Owner {
  id: string;
  display_name: string | null;
  slug: string | null;
}

interface AdminMarketplaceItem {
  id: string;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  created_at: string;
  price: number | null;
  marketplace_images?: MarketplaceImage[];
  categories?: MarketplaceCategory | null;
  person_profiles?: Owner | null;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  submitted: { label: "Innsendt", className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
  draft: { label: "Kladd", className: "bg-muted text-muted-foreground" },
  published: { label: "Publisert", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  archived: { label: "Arkivert", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  sold: { label: "Solgt", className: "font-serif tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" },
};

const AdminMarkedsplass = () => {
  const [statusFilter, setStatusFilter] = useState("alle");
  const { data: rawAll = [], isLoading } = useAdminMarketplaceItems();
  const allItems = rawAll as unknown as AdminMarketplaceItem[];

  const statusCounts = useMemo(() => ({
    alle: allItems.length,
    submitted: allItems.filter((i) => i.status === "submitted").length,
    draft: allItems.filter((i) => i.status === "draft").length,
    published: allItems.filter((i) => i.status === "published").length,
    archived: allItems.filter((i) => i.status === "archived").length,
    sold: allItems.filter((i) => i.status === "sold").length,
  }), [allItems]);

  const items = useMemo(() =>
    statusFilter === "alle" ? allItems : allItems.filter((i) => i.status === statusFilter),
  [allItems, statusFilter]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("nb-NO", { day: "numeric", month: "short", year: "numeric" });

  return (
    <AdminLayout title="Markedsplass">
      {/* Status alert */}
      {statusCounts.submitted > 0 && (
        <button
          onClick={() => setStatusFilter("submitted")}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg font-display text-sm flex items-center justify-center gap-3 transition-colors mb-4"
        >
          <span className="bg-white text-orange-600 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">
            {statusCounts.submitted}
          </span>
          Nye innsendte annonser venter på behandling
        </button>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: "alle", label: "Alle" },
          { id: "submitted", label: "Innsendt" },
          { id: "draft", label: "Kladd" },
          { id: "published", label: "Publisert" },
          { id: "sold", label: "Solgt" },
          { id: "archived", label: "Arkivert" },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setStatusFilter(id)}
            className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
              statusFilter === id ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            }`}
          >
            {label} ({statusCounts[id as keyof typeof statusCounts]})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
            {statusFilter === "alle" ? "Ingen annonser ennå" : `Ingen annonser med status «${statusFilter}»`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const images = [...(item.marketplace_images || [])].sort((a, b) => a.sort_order - b.sort_order);
            const mainImage = images[0];
            const owner = item.owners;
            const category = item.categories;
            const status = statusLabels[item.status] || statusLabels.draft;

            return (
              <Link
                key={item.id}
                to={`/admin/markedsplass/${item.id}`}
                className="flex items-center gap-4 p-3 rounded-xl border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {mainImage ? (
                    <img src={mainImage.image_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-display text-sm truncate">{item.title}</p>
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${status.className}`}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {owner?.display_name || "Ukjent"} · {formatDate(item.created_at)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.price != null && <span>{Number(item.price).toLocaleString("nb-NO")} kr</span>}
                    {category?.name && <span> · {category.name}</span>}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMarkedsplass;
