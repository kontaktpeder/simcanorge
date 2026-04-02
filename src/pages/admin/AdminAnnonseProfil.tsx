import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateMarketplaceItem, useDeleteMarketplaceItem } from "@/hooks/useMarketplace";
import { ArrowLeft, ExternalLink, Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ItemDetail {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number | null;
  price_note: string | null;
  location: string | null;
  contact_mode: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  marketplace_images?: { id: string; image_url: string; sort_order: number }[];
  categories?: { id: string; name: string; slug: string } | null;
  person_profiles?: { id: string; display_name: string | null; slug: string | null; user_id?: string } | null;
}

const statusLabels: Record<string, { label: string; className: string }> = {
  submitted: { label: "Innsendt", className: "bg-orange-100 text-orange-800" },
  draft: { label: "Kladd", className: "bg-muted text-muted-foreground" },
  published: { label: "Publisert", className: "bg-green-100 text-green-800" },
  archived: { label: "Arkivert", className: "bg-red-100 text-red-800" },
  sold: { label: "Solgt", className: "font-serif tracking-wider bg-amber-100 text-amber-900" },
};

const AdminAnnonseProfil = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const updateItem = useUpdateMarketplaceItem();
  const deleteItem = useDeleteMarketplaceItem();

  const { data: item, isLoading } = useQuery({
    queryKey: ["admin-marketplace-item", itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketplace_items")
        .select(`
          *,
          marketplace_images(id, image_url, sort_order, alt_text),
          categories(id, name, slug),
          person_profiles!marketplace_items_person_profile_id_fkey(id, display_name, slug, user_id)
        `)
        .eq("id", itemId!)
        .single();
      if (error) throw error;
      return data as unknown as ItemDetail;
    },
    enabled: !!itemId,
  });

  const publishItem = async () => {
    if (!item) return;
    await updateItem.mutateAsync({
      id: item.id,
      updates: { status: "published", published_at: new Date().toISOString() },
    });

    // Notify owner
    const owner = item.owners;
    if (owner?.user_id) {
      await supabase.from('notifications').insert({
        user_id: owner.user_id,
        type: 'marketplace_published',
        title: 'Annonse publisert',
        body: `Annonsen "${item.title}" er nå publisert på markedsplassen.`,
        link: item.slug ? `/annonse/${item.slug}` : null,
      });
    }

    queryClient.invalidateQueries({ queryKey: ["admin-marketplace-item", itemId] });
    queryClient.invalidateQueries({ queryKey: ["admin-marketplace-items"] });
  };

  const unpublishItem = async () => {
    if (!item) return;
    await updateItem.mutateAsync({
      id: item.id,
      updates: { status: "archived", published_at: null },
    });
    queryClient.invalidateQueries({ queryKey: ["admin-marketplace-item", itemId] });
    queryClient.invalidateQueries({ queryKey: ["admin-marketplace-items"] });
  };

  if (isLoading) {
    return (
      <AdminLayout title="Annonse">
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!item) {
    return (
      <AdminLayout title="Annonse">
        <p className="text-muted-foreground">Annonse ikke funnet.</p>
        <Button variant="outline" onClick={() => navigate("/admin/markedsplass")} className="mt-4">
          Tilbake til markedsplass
        </Button>
      </AdminLayout>
    );
  }

  const images = [...(item.marketplace_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const canPublish = item.status === "submitted" || item.status === "draft";
  const canUnpublish = item.status === "published";
  const owner = item.owners;
  const status = statusLabels[item.status] || statusLabels.draft;

  return (
    <AdminLayout title="Annonse">
      <div className="max-w-3xl">
        {/* Back link */}
        <Link
          to="/admin/markedsplass"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Tilbake til markedsplass
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h2 className="font-display text-2xl">{item.title}</h2>
              <Badge variant="secondary" className={status.className}>{status.label}</Badge>
            </div>
            {owner?.display_name && (
              <p className="text-sm text-muted-foreground">
                Av{" "}
                {owner.slug ? (
                  <Link to={`/profil/${owner.slug}`} className="underline hover:text-foreground">
                    {owner.display_name}
                  </Link>
                ) : (
                  owner.display_name
                )}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Opprettet{" "}
              {new Date(item.created_at).toLocaleDateString("nb-NO", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canPublish && (
              <Button onClick={publishItem} disabled={updateItem.isPending}>
                <Eye className="w-4 h-4 mr-1.5" />
                Godkjenn / Publiser
              </Button>
            )}
            {canUnpublish && (
              <Button variant="outline" onClick={unpublishItem} disabled={updateItem.isPending}>
                <EyeOff className="w-4 h-4 mr-1.5" />
                Avpubliser
              </Button>
            )}
            {item.published_at && item.slug && (
              <Button variant="outline" asChild>
                <Link to={`/annonse/${item.slug}`} target="_blank">
                  <ExternalLink className="w-4 h-4 mr-1.5" />
                  Se på nettsiden
                </Link>
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Slett
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Slett annonse?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Er du sikker på at du vil slette «{item.title}»? Dette kan ikke angres.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await deleteItem.mutateAsync(item.id);
                      navigate("/admin/markedsplass");
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Slett permanent
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Gallery */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
            {images.map((img) => (
              <img
                key={img.id}
                src={img.image_url}
                alt={item.title}
                className="w-full aspect-square object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        {/* Details */}
        <div className="space-y-4">
          {item.description && (
            <div>
              <h3 className="font-display text-sm text-muted-foreground mb-1">Beskrivelse</h3>
              <p className="whitespace-pre-wrap">{item.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {item.price != null && (
              <div>
                <h3 className="font-display text-sm text-muted-foreground mb-1">Pris</h3>
                <p className="font-display text-lg">{Number(item.price).toLocaleString("nb-NO")} kr</p>
                {item.price_note && <p className="text-xs text-muted-foreground">{item.price_note}</p>}
              </div>
            )}
            {item.categories?.name && (
              <div>
                <h3 className="font-display text-sm text-muted-foreground mb-1">Kategori</h3>
                <p>{item.categories.name}</p>
              </div>
            )}
            {item.location && (
              <div>
                <h3 className="font-display text-sm text-muted-foreground mb-1">Sted</h3>
                <p>{item.location}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnnonseProfil;
