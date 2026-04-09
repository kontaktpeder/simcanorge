import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerProfile, useLegacyOwnerId } from "@/hooks/useOwnerProfile";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useMyPages } from "@/hooks/useMyPages";
import { supabase } from "@/integrations/supabase/client";
import { GarageLayout } from "@/components/ui/garage/GarageLayout";
import { EnamelCard } from "@/components/ui/garage/EnamelCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Inbox,
  Loader2,
  Mail,
  Phone,
  User,
  Package,
  MapPin,
  ExternalLink,
  Car,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";

/* ────────────────────────────────────────────
   Marketplace inquiry types / helpers
   ──────────────────────────────────────────── */

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

/* ════════════════════════════════════════════
   Main component
   ════════════════════════════════════════════ */

export default function DashboardInnboks() {
  const { user, isLoading: authLoading } = useAuth();
  const { data: ownerProfile, isLoading: profileLoading } = useOwnerProfile(user?.id);
  const { data: legacyOwnerId } = useLegacyOwnerId(user?.id);
  const { data: personProfile } = useMyPersonProfile();
  const { data: myPages } = useMyPages();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultTab = searchParams.get("tab") || "markedsplass";

  useEffect(() => {
    if (!authLoading && !user) navigate("/login?returnUrl=/dashboard/innboks");
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

  const myPageIds = (myPages ?? [])
    .filter((p) => p.role === "owner" || p.role === "admin")
    .map((p) => p.id);

  return (
    <GarageLayout
      title="Innboks"
      subtitle="Dashboard"
      description="Forespørsler fra kjøpere og klubbtilknytninger."
    >
      <Tabs
        defaultValue={defaultTab}
        onValueChange={(v) => setSearchParams({ tab: v }, { replace: true })}
      >
        <TabsList className="w-full mb-6">
          <TabsTrigger value="markedsplass" className="flex-1 gap-1.5">
            <Package className="w-4 h-4" />
            Markedsplass
          </TabsTrigger>
          <TabsTrigger value="klubb" className="flex-1 gap-1.5">
            <Users className="w-4 h-4" />
            Klubb
          </TabsTrigger>
        </TabsList>

        <TabsContent value="markedsplass">
          <MarkedsplassTab
            user={user}
            ownerProfile={ownerProfile}
            legacyOwnerId={legacyOwnerId}
            queryClient={queryClient}
          />
        </TabsContent>

        <TabsContent value="klubb">
          <KlubbTab pageIds={myPageIds} queryClient={queryClient} />
        </TabsContent>
      </Tabs>
    </GarageLayout>
  );
}

/* ════════════════════════════════════════════
   Tab: Markedsplass (inquiry inbox)
   ════════════════════════════════════════════ */

function MarkedsplassTab({
  user,
  ownerProfile,
  legacyOwnerId,
  queryClient,
}: {
  user: any;
  ownerProfile: any;
  legacyOwnerId: string | null | undefined;
  queryClient: any;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["my-inquiries", legacyOwnerId],
    queryFn: async () => {
      if (!legacyOwnerId) return [];
      const { data, error } = await supabase
        .from("inquiries")
        .select(`*, inquiry_items(id, part_title, part_id, marketplace_item_id)`)
        .eq("recipient_owner_id", legacyOwnerId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!legacyOwnerId,
  });

  const selected = inquiries?.find((i: any) => i.id === selectedId);

  const selectedPartIds = useMemo(
    () => selected?.inquiry_items?.filter((it: any) => it.part_id).map((it: any) => it.part_id) ?? [],
    [selected]
  );
  const selectedListingIds = useMemo(
    () => selected?.inquiry_items?.filter((it: any) => it.marketplace_item_id).map((it: any) => it.marketplace_item_id) ?? [],
    [selected]
  );

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
      const { error } = await supabase.from("inquiries").update({ status, read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-inquiries"] }),
  });

  const deleteInquiry = useMutation({
    mutationFn: async (id: string) => {
      await supabase.from("inquiry_items").delete().eq("inquiry_id", id);
      const { error } = await supabase.from("inquiries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      setSelectedId(null);
      queryClient.invalidateQueries({ queryKey: ["my-inquiries"] });
      toast.success("Forespørselen ble slettet");
    },
    onError: () => toast.error("Kunne ikke slette forespørselen"),
  });

  if (!ownerProfile) {
    return (
      <EnamelCard>
        <div className="text-center py-8">
          <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Du må ha en Entusiastprofil for å motta forespørsler.</p>
        </div>
      </EnamelCard>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!inquiries?.length) {
    return (
      <EnamelCard>
        <div className="text-center py-12">
          <Inbox className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-display">Ingen forespørsler ennå</p>
          <p className="text-muted-foreground mt-2">Når noen sender en forespørsel på dine annonser, vil den dukke opp her.</p>
        </div>
      </EnamelCard>
    );
  }

  const unreadCount = inquiries.filter((i: any) => !i.read).length;

  return (
    <>
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
              <Badge variant="secondary" className={statusColors[(inquiry.status as InquiryStatus) || "pending"]}>
                {statusLabels[(inquiry.status as InquiryStatus) || "pending"]}
              </Badge>
            </div>
          </EnamelCard>
        ))}
      </div>

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
                {/* Kjøperinfo */}
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
                          <Mail className="h-3.5 w-3.5" /> {selected.email}
                        </a>
                      </div>
                    </div>
                    {selected.phone && (
                      <a href={`tel:${selected.phone}`} className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 ml-[52px]">
                        <Phone className="h-3.5 w-3.5" /> {selected.phone}
                      </a>
                    )}
                  </div>
                </div>

                {/* Bil */}
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

                {/* Melding */}
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

                {/* Varer */}
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
                            <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                              {enriched?.image ? (
                                <img src={enriched.image} alt={it.part_title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate">{it.part_title}</p>
                                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                    {enriched?.price && <span className="text-sm font-display text-primary">{enriched.price}</span>}
                                    {enriched?.condition && <Badge variant="secondary" className="text-xs">{enriched.condition}</Badge>}
                                    {enriched?.type && <span className="text-xs text-muted-foreground">{enriched.type === "listing" ? "Annonse" : "Bildel"}</span>}
                                  </div>
                                </div>
                                {detailUrl && (
                                  <Link to={detailUrl} className="text-primary hover:text-primary/80 flex-shrink-0 p-1">
                                    <ExternalLink className="w-4 h-4" />
                                  </Link>
                                )}
                              </div>
                              {enriched?.description && <p className="text-xs text-muted-foreground line-clamp-2">{enriched.description}</p>}
                              {enriched?.location && (
                                <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {enriched.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Status */}
                <div className="border-2 border-border rounded-xl overflow-hidden">
                  <div className="bg-muted/50 px-4 py-3 border-b border-border">
                    <p className="font-display text-sm">STATUS</p>
                  </div>
                  <div className="px-4 py-3">
                    <Select
                      value={(selected.status as InquiryStatus) || "pending"}
                      onValueChange={(v) => updateStatus.mutate({ id: selected.id, status: v })}
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

                {/* Slett */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="w-full min-h-[48px] flex items-center justify-center gap-2 text-destructive hover:bg-destructive/10 border-2 border-destructive/30 rounded-xl font-display text-sm uppercase tracking-wider transition-colors">
                      <Trash2 className="w-4 h-4" /> Slett forespørsel
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Slett forespørsel?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Forespørselen fra {selected.customer_name} vil bli permanent slettet.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Avbryt</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteInquiry.mutate(selected.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleteInquiry.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Slett"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ════════════════════════════════════════════
   Tab: Klubb (page_car_link_requests)
   ════════════════════════════════════════════ */

function KlubbTab({ pageIds, queryClient }: { pageIds: string[]; queryClient: any }) {
  const { data: requests, isLoading } = useQuery({
    queryKey: ["club-link-requests", pageIds],
    queryFn: async () => {
      if (!pageIds.length) return [];
      const { data, error } = await supabase
        .from("page_car_link_requests")
        .select(`
          id, car_id, page_id, message, status, created_at, resolved_at,
          cars(id, title, slug, brand, model, year),
          pages!page_car_link_requests_page_id_fkey(id, title, slug)
        `)
        .in("page_id", pageIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: pageIds.length > 0,
  });

  const approve = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc("approve_page_car_link_request", { p_request_id: requestId });
      if (error) throw error;
      const result = data as { success?: boolean; message?: string } | null;
      if (result && !result.success) throw new Error(result.message || "Feil ved godkjenning");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-link-requests"] });
      toast.success("Bilen er nå knyttet til klubben");
    },
    onError: (e: Error) => toast.error(e.message || "Kunne ikke godkjenne"),
  });

  const reject = useMutation({
    mutationFn: async (requestId: string) => {
      const { data, error } = await supabase.rpc("reject_page_car_link_request", { p_request_id: requestId });
      if (error) throw error;
      const result = data as { success?: boolean; message?: string } | null;
      if (result && !result.success) throw new Error(result.message || "Feil ved avvisning");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["club-link-requests"] });
      toast.success("Forespørselen ble avvist");
    },
    onError: (e: Error) => toast.error(e.message || "Kunne ikke avvise"),
  });

  if (!pageIds.length) {
    return (
      <EnamelCard>
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-display">Du administrerer ingen klubbsider</p>
          <p className="text-muted-foreground mt-2">Opprett eller bli lagt til som eier/admin på en klubbside for å se forespørsler.</p>
        </div>
      </EnamelCard>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!requests?.length) {
    return (
      <EnamelCard>
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg font-display">Ingen forespørsler</p>
          <p className="text-muted-foreground mt-2">Når noen sender inn en bil og ønsker å knytte den til din klubb, dukker det opp her.</p>
        </div>
      </EnamelCard>
    );
  }

  const pending = requests.filter((r: any) => r.status === "pending");
  const resolved = requests.filter((r: any) => r.status !== "pending");

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">
            {pending.length} ventende forespørsel{pending.length !== 1 ? "er" : ""}
          </p>
          {pending.map((req: any) => (
            <ClubRequestCard key={req.id} req={req} onApprove={() => approve.mutate(req.id)} onReject={() => reject.mutate(req.id)} isPending={approve.isPending || reject.isPending} />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-medium">Tidligere behandlede</p>
          {resolved.map((req: any) => (
            <ClubRequestCard key={req.id} req={req} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClubRequestCard({
  req,
  onApprove,
  onReject,
  isPending,
}: {
  req: any;
  onApprove?: () => void;
  onReject?: () => void;
  isPending?: boolean;
}) {
  const car = req.cars;
  const page = req.pages;
  const isPendingStatus = req.status === "pending";

  return (
    <EnamelCard>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Car className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              {car ? (
                <Link to={`/biler/${car.slug}`} className="font-display text-base hover:text-primary transition-colors truncate">
                  {car.title || `${car.brand} ${car.model}`}
                </Link>
              ) : (
                <span className="font-display text-base text-muted-foreground">Ukjent bil</span>
              )}
            </div>
            {page && (
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Til: {page.title}
              </p>
            )}
            {req.message && (
              <p className="text-sm text-muted-foreground mt-2 italic">«{req.message}»</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(req.created_at), "d. MMM yyyy", { locale: nb })}
            </p>
          </div>

          <div className="flex-shrink-0">
            {req.status === "approved" && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                <CheckCircle className="w-3 h-3 mr-1" /> Godkjent
              </Badge>
            )}
            {req.status === "rejected" && (
              <Badge className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="w-3 h-3 mr-1" /> Avvist
              </Badge>
            )}
            {isPendingStatus && (
              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                Venter
              </Badge>
            )}
          </div>
        </div>

        {isPendingStatus && onApprove && onReject && (
          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={onApprove}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1.5" /> Godkjenn</>}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onReject}
              disabled={isPending}
              className="flex-1"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><XCircle className="w-4 h-4 mr-1.5" /> Avslå</>}
            </Button>
          </div>
        )}
      </div>
    </EnamelCard>
  );
}
