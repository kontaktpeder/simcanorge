import { useState } from "react";
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
import { Mail, Phone, Car, Calendar, Check, Eye, Wrench, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface InquiryItem {
  id: string;
  part_title: string;
  part_id: string | null;
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

const AdminForesporsler = () => {
  const queryClient = useQueryClient();
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [status, setStatus] = useState<InquiryStatus>('pending');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { data: inquiries, isLoading } = useQuery({
    queryKey: ["inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select(`
          *,
          inquiry_items(id, part_title, part_id, parts(id, title, description, condition, price_min, price_max, price_note, image_url, part_images(image_url, sort_order)))
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Inquiry[];
    },
  });

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

  const unreadCount = inquiries?.filter((i) => !i.read).length || 0;

  return (
    <AdminLayout title="FORESPØRSLER">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {inquiries?.length || 0} forespørsel{inquiries?.length !== 1 ? "er" : ""} totalt
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-3">
                {unreadCount} ulest{unreadCount !== 1 ? "e" : ""}
              </Badge>
            )}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Laster...</div>
        ) : !inquiries?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen forespørsler ennå</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {inquiries.map((inquiry) => (
              <Card
                key={inquiry.id}
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
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedInquiry && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">
                    Forespørsel fra {selectedInquiry.customer_name}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Contact info */}
                  <div className="grid gap-3">
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

                  {/* Parts requested – visual cards */}
                  <div>
                    <h4 className="font-display text-lg mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Etterspurte deler ({selectedInquiry.inquiry_items.length})
                    </h4>
                    <div className="grid gap-4">
                      {selectedInquiry.inquiry_items.map((item) => {
                        const part = item.parts;
                        const imgUrl = part?.part_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.image_url || part?.image_url;
                        const price = part?.price_min
                          ? part.price_max && part.price_max !== part.price_min
                            ? `kr ${part.price_min} – ${part.price_max}`
                            : `kr ${part.price_min}`
                          : null;

                        return (
                          <div
                            key={item.id}
                            className="flex gap-5 bg-muted/40 border border-border/50 rounded-lg p-4 items-start"
                          >
                            {/* Thumbnail */}
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

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <h5 className="font-display text-lg md:text-xl font-semibold leading-tight">
                                {item.part_title}
                              </h5>
                              {price && (
                                <p className="font-serif text-base md:text-lg font-bold mt-1">{price}
                                  {part?.price_note && <span className="text-muted-foreground font-normal ml-2 text-sm">{part.price_note}</span>}
                                </p>
                              )}
                              {part?.condition && (
                                <Badge variant="outline" className="mt-1.5 text-sm">{part.condition}</Badge>
                              )}
                              {part?.description && (
                                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-3">{part.description}</p>
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
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminForesporsler;
