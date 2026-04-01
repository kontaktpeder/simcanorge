import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Car, Calendar, Check, Eye, Wrench, Trash2, User, Package, ExternalLink, ShieldAlert, UserX, UserPlus, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useAllAccountRequests, useUpdateAccountRequest, type AccountRequest, type AccountRequestStatus } from "@/hooks/useAccountRequests";
import { useAuth } from "@/hooks/useAuth";
import { useEmailGenerator } from "@/contexts/EmailGeneratorContext";

interface InquiryItem {
  id: string;
  part_title: string;
  part_id: string | null;
  marketplace_item_id: string | null;
  parts: {
    id: string;
    title: string;
    description: string | null;
    condition: string | null;
    price_min: number | null;
    price_max: number | null;
    price_note: string | null;
    image_url: string | null;
    part_images: { image_url: string; sort_order: number }[];
  } | null;
}

interface Inquiry {
  id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  car_model: string | null;
  car_year: number | null;
  message: string | null;
  read: boolean;
  status: string | null;
  admin_notes: string | null;
  created_at: string;
  recipient_owner_id: string | null;
  inquiry_items: InquiryItem[];
}

type InquiryStatus = 'pending' | 'contacted' | 'quote_sent' | 'sold' | 'not_available' | 'cancelled';

const statusLabels: Record<InquiryStatus, string> = {
  pending: "Venter",
  contacted: "Kontaktet",
  quote_sent: "Tilbud sendt",
  sold: "Solgt",
  not_available: "Ikke tilgjengelig",
  cancelled: "Avbrutt",
};

const statusColors: Record<InquiryStatus, string> = {
  pending: "bg-yellow-500",
  contacted: "bg-blue-500",
  quote_sent: "bg-purple-500",
  sold: "bg-green-500",
  not_available: "bg-gray-500",
  cancelled: "bg-red-500",
};

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  message: string | null;
  status: string;
  invite_sent_at: string | null;
  admin_note: string | null;
  created_at: string;
}

type ForesporselItem =
  | { kind: "inquiry"; data: Inquiry }
  | { kind: "account_request"; data: AccountRequest }
  | { kind: "access_request"; data: AccessRequest };

const accountRequestTypeLabels: Record<string, string> = {
  delete_account: "Slettingsforespørsel",
  anonymize: "Anonymiseringsforespørsel",
};

const accountRequestStatusLabels: Record<string, string> = {
  new: "Mottatt",
  in_progress: "Under behandling",
  done: "Fullført",
};

const AdminForesporsler = () => {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const { openEmailGenerator } = useEmailGenerator();
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [selectedAccountRequest, setSelectedAccountRequest] = useState<AccountRequest | null>(null);
  const [selectedAccessRequest, setSelectedAccessRequest] = useState<AccessRequest | null>(null);
  const [status, setStatus] = useState<InquiryStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [accountRequestStatus, setAccountRequestStatus] = useState<AccountRequestStatus>('new');
  const [accountRequestAdminNote, setAccountRequestAdminNote] = useState('');
  const [accessRequestAdminNote, setAccessRequestAdminNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const handleConfirmDeleteUser = async () => {
    if (!selectedAccountRequest || selectedAccountRequest.type !== "delete_account") return;
    setIsDeletingUser(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: { user_id: selectedAccountRequest.user_id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Bruker er slettet og forespørselen er merket som fullført.");
      queryClient.invalidateQueries({ queryKey: ["all-account-requests"] });
      setSelectedAccountRequest(null);
      setShowDeleteUserConfirm(false);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : "Kunne ikke slette bruker");
    } finally {
      setIsDeletingUser(false);
    }
  };

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select(`
          *,
          inquiry_items(id, part_title, part_id, marketplace_item_id, parts(id, title, description, condition, price_min, price_max, price_note, image_url, part_images(image_url, sort_order)))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Inquiry[];
    },
  });

  const { data: accountRequests = [], isLoading: accountRequestsLoading } = useAllAccountRequests();
  const updateAccountRequest = useUpdateAccountRequest();

  const { data: accessRequests = [], isLoading: accessRequestsLoading } = useQuery({
    queryKey: ['access-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('access_requests' as any)
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AccessRequest[];
    },
  });

  // Collect unique owner IDs and marketplace_item IDs for enrichment
  const ownerIds = useMemo(() => {
    if (!inquiries) return [];
    return [...new Set(inquiries.map(i => i.recipient_owner_id).filter(Boolean))] as string[];
  }, [inquiries]);

  const marketplaceItemIds = useMemo(() => {
    if (!inquiries) return [];
    const ids: string[] = [];
    inquiries.forEach(i => i.inquiry_items.forEach(item => {
      if (item.marketplace_item_id) ids.push(item.marketplace_item_id);
    }));
    return [...new Set(ids)];
  }, [inquiries]);

  // Fetch owner profiles
  const { data: ownersData } = useQuery({
    queryKey: ["admin-inquiry-owners", ownerIds],
    queryFn: async () => {
      if (!ownerIds.length) return [];
      const { data, error } = await supabase
        .from("owners")
        .select("id, display_name, avatar_url, slug, location, contact_email")
        .in("id", ownerIds);
      if (error) throw error;
      return data;
    },
    enabled: ownerIds.length > 0,
  });

  // Fetch marketplace items with images
  const { data: marketplaceData } = useQuery({
    queryKey: ["admin-inquiry-marketplace", marketplaceItemIds],
    queryFn: async () => {
      if (!marketplaceItemIds.length) return [];
      const { data, error } = await supabase
        .from("marketplace_items")
        .select("id, title, slug, price, price_note, description, owner_id, marketplace_images(image_url, sort_order)")
        .in("id", marketplaceItemIds);
      if (error) throw error;
      return data;
    },
    enabled: marketplaceItemIds.length > 0,
  });

  const ownersMap = useMemo(() => {
    const map = new Map<string, typeof ownersData extends (infer T)[] ? T : never>();
    ownersData?.forEach(o => map.set(o.id, o));
    return map;
  }, [ownersData]);

  const marketplaceMap = useMemo(() => {
    const map = new Map<string, NonNullable<typeof marketplaceData>[number]>();
    marketplaceData?.forEach(m => map.set(m.id, m));
    return map;
  }, [marketplaceData]);

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inquiries")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
    },
  });

  const updateInquiry = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from("inquiries")
        .update({ status, admin_notes: notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast.success("Status oppdatert");
    },
  });

  const deleteInquiry = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inquiries")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      setSelectedInquiry(null);
      toast.success("Forespørsel slettet");
    },
  });

  const openInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setStatus((inquiry.status as InquiryStatus) || 'pending');
    setAdminNotes(inquiry.admin_notes || '');
    if (!inquiry.read) {
      markAsRead.mutate(inquiry.id);
    }
  };

  const handleSave = async () => {
    if (!selectedInquiry) return;
    setIsSaving(true);
    updateInquiry.mutate({ 
      id: selectedInquiry.id, 
      status, 
      notes: adminNotes 
    });
    setIsSaving(false);
  };

  const getRecipientLabel = (inquiry: Inquiry) => {
    if (!inquiry.recipient_owner_id) return "Simca Norge";
    const owner = ownersMap.get(inquiry.recipient_owner_id);
    return owner?.display_name || "Ukjent selger";
  };

  const unreadCount = inquiries?.filter((i) => !i.read).length || 0;

  const getItemImage = (item: InquiryItem) => {
    // Parts image
    if (item.parts) {
      return item.parts.part_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url || item.parts.image_url;
    }
    // Marketplace item image
    if (item.marketplace_item_id) {
      const mi = marketplaceMap.get(item.marketplace_item_id);
      if (mi?.marketplace_images?.length) {
        return [...mi.marketplace_images].sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url;
      }
    }
    return null;
  };

  const getItemDetails = (item: InquiryItem) => {
    if (item.parts) {
      const part = item.parts;
      const price = part.price_min
        ? part.price_max && part.price_max !== part.price_min
          ? `kr ${part.price_min} – ${part.price_max}`
          : `kr ${part.price_min}`
        : null;
      return { price, priceNote: part.price_note, condition: part.condition, description: part.description, type: "part" as const, slug: null };
    }
    if (item.marketplace_item_id) {
      const mi = marketplaceMap.get(item.marketplace_item_id);
      if (mi) {
        const price = mi.price ? `kr ${mi.price}` : null;
        return { price, priceNote: mi.price_note, condition: null, description: mi.description, type: "listing" as const, slug: mi.slug };
      }
    }
    return { price: null, priceNote: null, condition: null, description: null, type: "unknown" as const, slug: null };
  };

  // Combined list sorted by date
  const allItems: ForesporselItem[] = useMemo(() => {
    const inquiryItems: ForesporselItem[] = (inquiries || []).map((data) => ({ kind: "inquiry", data }));
    const accountItems: ForesporselItem[] = (accountRequests || []).map((data) => ({ kind: "account_request", data }));
    const accessItems: ForesporselItem[] = (accessRequests || []).map((data) => ({ kind: "access_request", data }));
    return [...inquiryItems, ...accountItems, ...accessItems].sort(
      (a, b) => new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
    );
  }, [inquiries, accountRequests]);

  return (
    <AdminLayout title="FORESPØRSLER">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {allItems.length} forespørsel{allItems.length !== 1 ? "er" : ""} totalt
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-3">
                {unreadCount} ulest{unreadCount !== 1 ? "e" : ""} henvendelser
              </Badge>
            )}
          </p>
        </div>

        {isLoading || accountRequestsLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laster...</div>
        ) : !allItems.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen forespørsler ennå</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {allItems.map((item) => {
              if (item.kind === "account_request") {
                const ar = item.data;
                const isDelete = ar.type === "delete_account";
                return (
                  <Card
                    key={`ar-${ar.id}`}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      ar.status === "new" ? "border-destructive/50 border-2" : ""
                    }`}
                    onClick={() => {
                      setSelectedAccountRequest(ar);
                      setAccountRequestStatus(ar.status as AccountRequestStatus);
                      setAccountRequestAdminNote(ar.admin_note || '');
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {ar.status === "new" && (
                              <span className="w-2 h-2 bg-destructive rounded-full flex-shrink-0" />
                            )}
                            <h3 className="font-display text-lg truncate flex items-center gap-2">
                              {isDelete ? <Trash2 className="w-4 h-4 text-destructive" /> : <UserX className="w-4 h-4 text-amber-600" />}
                              {isDelete ? "Slettingsforespørsel" : "Anonymiseringsforespørsel"}
                            </h3>
                            <Badge
                              variant="outline"
                              className={
                                ar.status === "new"
                                  ? "border-destructive/50 text-destructive"
                                  : ar.status === "in_progress"
                                  ? "border-amber-500/50 text-amber-700"
                                  : "border-green-500/50 text-green-700"
                              }
                            >
                              {accountRequestStatusLabels[ar.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(ar.created_at), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            Bruker-ID: {ar.user_id.slice(0, 8)}…
                          </p>
                          {ar.message && (
                            <p className="text-sm text-foreground/70 mt-2 line-clamp-2">
                              {ar.message}
                            </p>
                          )}
                        </div>
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              const inquiry = item.data;
              const recipientLabel = getRecipientLabel(inquiry);
              return (
                <Card
                  key={`inq-${inquiry.id}`}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    !inquiry.read ? "border-accent border-2" : ""
                  }`}
                  onClick={() => openInquiry(inquiry)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          {!inquiry.read && (
                            <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                          )}
                          <h3 className="font-display text-lg truncate">
                            {inquiry.customer_name}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            → {recipientLabel}
                          </Badge>
                          <Badge className="bg-primary">
                            {inquiry.inquiry_items.length} del{inquiry.inquiry_items.length !== 1 ? "er" : ""}
                          </Badge>
                          {inquiry.status && (
                            <Badge className={statusColors[inquiry.status as InquiryStatus] || "bg-gray-500"}>
                              {statusLabels[inquiry.status as InquiryStatus] || inquiry.status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(inquiry.created_at), "d. MMM yyyy 'kl.' HH:mm", { locale: nb })}
                        </p>
                        {inquiry.car_model && (
                          <p className="text-sm text-foreground/70 mt-1 flex items-center gap-1">
                            <Car className="w-4 h-4" />
                            {inquiry.car_model} {inquiry.car_year && `(${inquiry.car_year})`}
                          </p>
                        )}
                        {inquiry.message && (
                          <p className="text-sm text-foreground/70 mt-2 line-clamp-2">
                            {inquiry.message}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Detail Dialog for inquiries */}
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedInquiry && (() => {
              const recipientOwner = selectedInquiry.recipient_owner_id
                ? ownersMap.get(selectedInquiry.recipient_owner_id)
                : null;
              const isSellerInquiry = !!selectedInquiry.recipient_owner_id;

              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl">
                      Forespørsel fra {selectedInquiry.customer_name}
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Recipient / Seller info */}
                    <div className="bg-muted/60 border border-border rounded-lg p-4">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Sendt til
                      </p>
                      {isSellerInquiry && recipientOwner ? (
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={recipientOwner.avatar_url || undefined} />
                            <AvatarFallback><User className="w-5 h-5" /></AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-display text-lg font-semibold">{recipientOwner.display_name}</p>
                            {recipientOwner.location && (
                              <p className="text-sm text-muted-foreground">{recipientOwner.location}</p>
                            )}
                            {recipientOwner.contact_email && (
                              <p className="text-sm text-muted-foreground">{recipientOwner.contact_email}</p>
                            )}
                          </div>
                          {recipientOwner.slug && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={`/profil/${recipientOwner.slug}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Package className="w-5 h-5 text-primary" />
                          </div>
                          <p className="font-display text-lg font-semibold">Simca Norge (admin)</p>
                        </div>
                      )}
                    </div>

                    {/* Contact info */}
                    <div className="grid gap-3">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Kjøper</p>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(selectedInquiry.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a href={`mailto:${selectedInquiry.email}`} className="text-primary hover:underline">
                          {selectedInquiry.email}
                        </a>
                      </div>
                      {selectedInquiry.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <a href={`tel:${selectedInquiry.phone}`} className="text-primary hover:underline">
                            {selectedInquiry.phone}
                          </a>
                        </div>
                      )}
                      {selectedInquiry.car_model && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Car className="w-4 h-4" />
                          {selectedInquiry.car_model}
                          {selectedInquiry.car_year && ` (${selectedInquiry.car_year})`}
                        </div>
                      )}
                    </div>

                    {/* Parts requested */}
                    <div>
                      <h4 className="font-display text-lg mb-3 flex items-center gap-2">
                        <Wrench className="w-4 h-4" />
                        Etterspurte varer ({selectedInquiry.inquiry_items.length})
                      </h4>
                      <div className="grid gap-4">
                        {selectedInquiry.inquiry_items.map((item) => {
                          const imgUrl = getItemImage(item);
                          const details = getItemDetails(item);

                          return (
                            <div
                              key={item.id}
                              className="flex gap-5 bg-muted/40 border border-border/50 rounded-lg p-4 items-start"
                            >
                              {imgUrl ? (
                                <img
                                  src={imgUrl}
                                  alt={item.part_title}
                                  className="w-32 h-32 rounded-md object-cover flex-shrink-0 border border-border/30"
                                />
                              ) : (
                                <div className="w-32 h-32 rounded-md bg-muted flex items-center justify-center flex-shrink-0 border border-border/30">
                                  <Wrench className="w-8 h-8 text-muted-foreground/40" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h5 className="font-display text-lg md:text-xl font-semibold leading-tight">
                                    {item.part_title}
                                  </h5>
                                  <Badge variant="secondary" className="text-[10px] uppercase">
                                    {details.type === "part" ? "Bildel" : details.type === "listing" ? "Annonse" : "—"}
                                  </Badge>
                                </div>
                                {details.price && (
                                  <p className="font-serif text-base md:text-lg font-bold mt-1">{details.price}
                                    {details.priceNote && <span className="text-muted-foreground font-normal ml-2 text-sm">{details.priceNote}</span>}
                                  </p>
                                )}
                                {details.condition && (
                                  <Badge variant="outline" className="mt-1.5 text-sm">{details.condition}</Badge>
                                )}
                                {details.description && (
                                  <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3">{details.description}</p>
                                )}
                                {details.slug && (
                                  <a href={`/annonse/${details.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" /> Se annonse
                                  </a>
                                )}
                              </div>

                              <Check className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Message */}
                    {selectedInquiry.message && (
                      <div>
                        <h4 className="font-display text-lg mb-2">Melding</h4>
                        <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                          {selectedInquiry.message}
                        </div>
                      </div>
                    )}

                    {/* Status & Notes */}
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select value={status} onValueChange={(v) => setStatus(v as InquiryStatus)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Venter</SelectItem>
                            <SelectItem value="contacted">Kontaktet</SelectItem>
                            <SelectItem value="quote_sent">Tilbud sendt</SelectItem>
                            <SelectItem value="sold">Solgt</SelectItem>
                            <SelectItem value="not_available">Ikke tilgjengelig</SelectItem>
                            <SelectItem value="cancelled">Avbrutt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Admin notater</Label>
                        <Textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          rows={4}
                          placeholder="Interne notater om denne forespørselen..."
                        />
                      </div>

                      <Button onClick={handleSave} disabled={isSaving} className="w-full">
                        {isSaving ? 'Lagrer...' : 'Lagre'}
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 border-t flex flex-wrap gap-3">
                      <Button asChild>
                        <a href={`mailto:${selectedInquiry.email}?subject=Re: Din forespørsel hos Simca Norge`}>
                          <Mail className="w-4 h-4 mr-2" />
                          Svar på e-post
                        </a>
                      </Button>
                      {selectedInquiry.phone && (
                        <Button variant="outline" asChild>
                          <a href={`tel:${selectedInquiry.phone}`}>
                            <Phone className="w-4 h-4 mr-2" />
                            Ring
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Er du sikker på at du vil slette denne forespørselen?")) {
                            deleteInquiry.mutate(selectedInquiry.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Slett forespørsel
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Dialog for account request (sletting / anonymisering) */}
        <Dialog open={!!selectedAccountRequest} onOpenChange={() => setSelectedAccountRequest(null)}>
          <DialogContent className="max-w-lg">
            {selectedAccountRequest && (() => {
              const ar = selectedAccountRequest;
              const isDelete = ar.type === "delete_account";
              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl flex items-center gap-2">
                      {isDelete ? <Trash2 className="w-5 h-5 text-destructive" /> : <UserX className="w-5 h-5 text-amber-600" />}
                      {accountRequestTypeLabels[ar.type]}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-5">
                    <div className="text-sm text-muted-foreground">
                      Bruker-ID: <span className="font-mono text-foreground">{ar.user_id}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Innsendt: {format(new Date(ar.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                    </div>
                    {ar.message && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Melding fra bruker</p>
                        <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                          {ar.message}
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={accountRequestStatus} onValueChange={(v) => setAccountRequestStatus(v as AccountRequestStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">Mottatt</SelectItem>
                          <SelectItem value="in_progress">Under behandling</SelectItem>
                          <SelectItem value="done">Fullført</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Admin notater</Label>
                      <Textarea
                        value={accountRequestAdminNote}
                        onChange={(e) => setAccountRequestAdminNote(e.target.value)}
                        rows={3}
                        placeholder="Notater om behandlingen..."
                      />
                    </div>
                    <Button
                      className="w-full"
                      disabled={updateAccountRequest.isPending}
                      onClick={() => {
                        updateAccountRequest.mutate(
                          {
                            id: ar.id,
                            status: accountRequestStatus,
                            admin_note: accountRequestAdminNote,
                            resolved_by: accountRequestStatus === "done" ? authUser?.id : undefined,
                          },
                          {
                            onSuccess: () => setSelectedAccountRequest(null),
                          }
                        );
                      }}
                    >
                      {updateAccountRequest.isPending ? "Lagrer..." : "Lagre status"}
                    </Button>

                    {isDelete && (
                      <>
                        <div className="pt-4 border-t">
                          <Button
                            variant="destructive"
                            className="w-full"
                            disabled={isDeletingUser}
                            onClick={() => setShowDeleteUserConfirm(true)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isDeletingUser ? "Sletter..." : "Slett bruker helt"}
                          </Button>
                        </div>

                        <AlertDialog open={showDeleteUserConfirm} onOpenChange={setShowDeleteUserConfirm}>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Slett bruker permanent?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Brukeren slettes fra systemet og kan ikke gjenopprettes. Forespørselen markeres som fullført med «Bruker slettet». Er du sikker?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleConfirmDeleteUser();
                                }}
                                disabled={isDeletingUser}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                {isDeletingUser ? "Sletter..." : "Ja, slett bruker"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminForesporsler;
