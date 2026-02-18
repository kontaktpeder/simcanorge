import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import { supabase } from "@/integrations/supabase/client";
import { GarageLayout } from "@/components/ui/garage/GarageLayout";
import { EnamelCard } from "@/components/ui/garage/EnamelCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Inbox, Loader2, Mail, Phone, User, Package, MapPin, ExternalLink, Car } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";

type InquiryStatus = "pending" | "contacted" | "quote_sent" | "sold" | "not_available" | "cancelled";

const statusLabels: Record<InquiryStatus, string> = {
  pending: "Venter",
  contacted: "Kontaktet",
  quote_sent: "Tilbud sendt",
  sold: "Solgt",
  not_available: "Ikke tilgjengelig",
  cancelled: "Avbrutt",
};

const statusColors: Record<InquiryStatus, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  contacted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  quote_sent: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  sold: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  not_available: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function DashboardMineForesporsler() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile(user?.id);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["my-inquiries", ownerProfile?.id],
    queryFn: async () => {
      if (!ownerProfile?.id) return [];
      const { data, error } = await supabase
        .from("inquiries")
        .select(`
          *,
          inquiry_items(id, part_title, part_id, marketplace_item_id)
        `)
        .eq("recipient_owner_id", ownerProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!ownerProfile?.id,
  });

  const selected = inquiries?.find((i: any) => i.id === selectedId);

  // Collect all referenced item IDs from the selected inquiry for enrichment
  const selectedPartIds = useMemo(() =>
    selected?.inquiry_items?.filter((it: any) => it.part_id).map((it: any) => it.part_id) ?? [], [selected]);
  const selectedListingIds = useMemo(() =>
    selected?.inquiry_items?.filter((it: any) => it.marketplace_item_id).map((it: any) => it.marketplace_item_id) ?? [], [selected]);

  // Fetch enriched part data
  const { data: partsData } = useQuery({
    queryKey: ["inquiry-parts", selectedPartIds],
    queryFn: async () => {
      if (selectedPartIds.length === 0) return [];
      const { data } = await supabase
        .from("parts")
        .select(`id, title, description, price_min, price_max, price_note, condition, slug, part_images(image_url, sort_order)`)
        .in("id", selectedPartIds)
        .order("sort_order", { referencedTable: "part_images", ascending: true });
      return data ?? [];
    },
    enabled: selectedPartIds.length > 0,
  });

  // Fetch enriched listing data
  const { data: listingsData } = useQuery({
    queryKey: ["inquiry-listings", selectedListingIds],
    queryFn: async () => {
      if (selectedListingIds.length === 0) return [];
      const { data } = await supabase
        .from("marketplace_items")
        .select(`id, title, description, price, price_note, location, slug, marketplace_images(image_url, sort_order)`)
        .in("id", selectedListingIds)
        .order("sort_order", { referencedTable: "marketplace_images", ascending: true });
      return data ?? [];
    },
    enabled: selectedListingIds.length > 0,
  });

  // Build enriched map
  const enrichedMap = useMemo(() => {
    const map = new Map<string, {
      image?: string;
      price?: string;
      description?: string;
      slug?: string;
      type: "part" | "listing";
      condition?: string;
      location?: string;
    }>();
    partsData?.forEach((p: any) => {
      const img = p.part_images?.[0]?.image_url;
      let price = p.price_note || undefined;
      if (p.price_min != null && p.price_max != null) price = `${p.price_min.toLocaleString("nb-NO")} – ${p.price_max.toLocaleString("nb-NO")} kr`;
      else if (p.price_min != null) price = `fra ${p.price_min.toLocaleString("nb-NO")} kr`;
      map.set(p.id, { image: img, price, description: p.description, slug: p.slug, type: "part", condition: p.condition });
    });
    listingsData?.forEach((l: any) => {
      const img = l.marketplace_images?.[0]?.image_url;
      let price = l.price_note || undefined;
      if (l.price != null) price = `${Number(l.price).toLocaleString("nb-NO")} kr`;
      map.set(l.id, { image: img, price, description: l.description, slug: l.slug, type: "listing", location: l.location });
    });
    return map;
  }, [partsData, listingsData]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("inquiries")
        .update({ status, read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-inquiries"] });
    },
  });

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?returnUrl=/dashboard/mine-foresporsler");
  }, [user, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) return null;

  const unreadCount = inquiries?.filter((i: any) => !i.read).length || 0;

  return (
    <GarageLayout
      title="Mine forespørsler"
      subtitle="Selgerinnboks"
      description="Her ser du forespørsler fra kjøpere som er interessert i varene dine."
    >
      {!ownerProfile ? (
        <EnamelCard>
          <div className="text-center py-8">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Du må ha en Entusiastprofil for å motta forespørsler.</p>
          </div>
        </EnamelCard>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !inquiries?.length ? (
        <EnamelCard>
          <div className="text-center py-12">
            <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-display">Ingen forespørsler ennå</p>
            <p className="text-muted-foreground mt-2">Når noen sender en forespørsel på dine annonser, vil den dukke opp her.</p>
          </div>
        </EnamelCard>
      ) : (
        <div className="space-y-3">
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mb-2">
              {unreadCount} ulest{unreadCount !== 1 ? "e" : ""} forespørsel{unreadCount !== 1 ? "er" : ""}
            </p>
          )}
          {inquiries.map((inquiry: any) => (
            <EnamelCard
              key={inquiry.id}
              className={`cursor-pointer transition-colors hover:border-primary/50 ${!inquiry.read ? "border-l-4 border-l-primary" : ""}`}
              onClick={() => setSelectedId(inquiry.id)}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-display text-lg truncate">{inquiry.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {inquiry.inquiry_items?.length || 0} vare{(inquiry.inquiry_items?.length || 0) !== 1 ? "r" : ""} · {format(new Date(inquiry.created_at), "d. MMM yyyy", { locale: nb })}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={statusColors[(inquiry.status as InquiryStatus) || "pending"]}
                >
                  {statusLabels[(inquiry.status as InquiryStatus) || "pending"]}
                </Badge>
              </div>
            </EnamelCard>
          ))}
        </div>
      )}

      <Dialog open={!!selectedId} onOpenChange={() => setSelectedId(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Forespørsel fra {selected.customer_name}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selected.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                </p>
              </DialogHeader>

              <div className="space-y-6 pt-2">
                {/* === KJØPERINFO === */}
                <div className="border-2 border-border rounded-xl overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 border-b border-border">
                    <p className="font-display text-sm">KJØPER</p>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{selected.customer_name}</p>
                        <a href={`mailto:${selected.email}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {selected.email}
                        </a>
                      </div>
                    </div>
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 ml-[52px]">
                        <Phone className="h-3.5 w-3.5" />
                        {selected.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* === BIL === */}
                {selected.car_model && (
                  <div className="border-2 border-border rounded-xl overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b border-border">
                      <p className="font-display text-sm">KJØPERS BIL</p>
                    </div>
                    <div className="px-4 py-3 flex items-center gap-3">
                      <Car className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm">
                        {selected.car_model}{selected.car_year ? ` (${selected.car_year})` : ""}
                      </p>
                    </div>
                  </div>
                )}

                {/* === MELDING === */}
                {selected.message && (
                  <div className="border-2 border-border rounded-xl overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b border-border">
                      <p className="font-display text-sm">MELDING FRA KJØPER</p>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm whitespace-pre-wrap">{selected.message}</p>
                    </div>
                  </div>
                )}

                {/* === ETTERSPURTE VARER === */}
                <div className="border-2 border-border rounded-xl overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 border-b border-border">
                    <p className="font-display text-sm">ETTERSPURTE VARER ({selected.inquiry_items?.length || 0})</p>
                  </div>
                  <div className="divide-y divide-border">
                    {selected.inquiry_items?.map((it: any) => {
                      const itemId = it.part_id || it.marketplace_item_id;
                      const enriched = itemId ? enrichedMap.get(itemId) : null;
                      const slug = enriched?.slug;
                      const detailUrl = slug ? `/annonse/${slug}` : null;

                      return (
                        <div key={it.id} className="px-4 py-3">
                          <div className="flex gap-3">
                            {/* Thumbnail */}
                            <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                              {enriched?.image ? (
                                <img src={enriched.image} alt={it.part_title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>

                            {/* Item details */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{it.part_title}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                    {enriched?.price && (
                                      <span className="text-sm font-display text-primary">{enriched.price}</span>
                                    )}
                                    {enriched?.condition && (
                                      <Badge variant="secondary" className="text-xs">{enriched.condition}</Badge>
                                    )}
                                    {enriched?.type && (
                                      <span className="text-xs text-muted-foreground">
                                        {enriched.type === "listing" ? "Annonse" : "Bildel"}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {detailUrl && (
                                  <Link to={detailUrl} className="text-primary hover:text-primary/80 flex-shrink-0 p-1" title="Se annonse">
                                    <ExternalLink className="w-4 h-4" />
                                  </Link>
                                )}
                              </div>

                              {enriched?.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">{enriched.description}</p>
                              )}

                              {enriched?.location && (
                                <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {enriched.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* === DIN PROFIL (selger) === */}
                {ownerProfile && (
                  <div className="border-2 border-border rounded-xl overflow-hidden">
                    <div className="bg-muted/50 px-4 py-3 border-b border-border">
                      <p className="font-display text-sm">DIN SELGERPROFIL</p>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                          {ownerProfile.avatar_url ? (
                            <img src={ownerProfile.avatar_url} alt={ownerProfile.display_name} className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{ownerProfile.display_name}</p>
                          {ownerProfile.location && (
                            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {ownerProfile.location}
                            </p>
                          )}
                        </div>
                      </div>
                      {ownerProfile.visible_public && ownerProfile.slug && (
                        <Link
                          to={`/profil/${ownerProfile.slug}`}
                          className="mt-2 text-xs text-primary hover:underline inline-flex items-center gap-1 ml-[52px]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Se offentlig profil
                        </Link>
                      )}
                      {(ownerProfile as any).contact_email && (
                        <p className="text-xs text-muted-foreground mt-1 ml-[52px]">
                          Kontakt: {(ownerProfile as any).contact_email}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* === STATUS === */}
                <div className="border-2 border-border rounded-xl overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 border-b border-border">
                    <p className="font-display text-sm">STATUS</p>
                  </div>
                  <div className="px-4 py-3">
                    <Select
                      value={(selected.status as InquiryStatus) || "pending"}
                      onValueChange={(v) => {
                        updateStatus.mutate({ id: selected.id, status: v });
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(statusLabels) as InquiryStatus[]).map((s) => (
                          <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </GarageLayout>
  );
}
