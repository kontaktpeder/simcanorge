import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { useToast } from "@/hooks/use-toast";
import { 
  Car, Mail, Phone, Calendar, Eye, Trash2, MessageSquare, 
  Image, Plus, CheckCircle, XCircle, Inbox, Send 
} from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

// Types
interface Message {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface CarSubmission {
  id: string;
  title: string | null;
  brand: string | null;
  owner_name: string;
  email: string;
  phone: string | null;
  car_model: string;
  car_year: number | null;
  category: string;
  tags: string[] | null;
  car_story: string | null;
  images: string[] | null;
  status: string;
  admin_notes: string | null;
  read: boolean;
  allow_edits: boolean;
  created_at: string;
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
  created_at: string;
  inquiry_items: { part_title: string }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  registrert: "Registrerte biler",
  restaurering: "Restaureringsprosjekter",
  historisk: "Historiske biler",
  vrak: "Vrak",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500",
  reviewed: "bg-blue-500",
  published: "bg-green-500",
  rejected: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  pending: "Venter",
  reviewed: "Gjennomgått",
  published: "Publisert",
  rejected: "Avvist",
};

export default function AdminMeldinger() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("kontakt");
  
  // Dialog states
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<CarSubmission | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  // Fetch messages
  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ["messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Message[];
    },
  });

  // Fetch car submissions
  const { data: submissions, isLoading: loadingSubmissions } = useQuery({
    queryKey: ["car-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("car_submissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as CarSubmission[];
    },
  });

  // Fetch inquiries
  const { data: inquiries, isLoading: loadingInquiries } = useQuery({
    queryKey: ["inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inquiries")
        .select("*, inquiry_items(part_title)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Inquiry[];
    },
  });

  // Mutations for messages
  const markMessageAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      toast({ title: "Markert som lest" });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      setSelectedMessage(null);
      toast({ title: "Melding slettet" });
    },
  });

  // Mutations for submissions
  const markSubmissionAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("car_submissions")
        .update({ read: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car-submissions"] });
    },
  });

  const updateSubmissionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("car_submissions")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car-submissions"] });
      toast({ title: "Status oppdatert" });
    },
  });

  const updateSubmissionNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("car_submissions")
        .update({ admin_notes: notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car-submissions"] });
      toast({ title: "Notater lagret" });
    },
  });

  const deleteSubmission = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("car_submissions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car-submissions"] });
      setSelectedSubmission(null);
      toast({ title: "Innsending slettet" });
    },
  });

  // Mutations for inquiries
  const markInquiryAsRead = useMutation({
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

  // Counts
  const unreadMessages = messages?.filter((m) => !m.read).length || 0;
  const unreadSubmissions = submissions?.filter((s) => !s.read).length || 0;
  const unreadInquiries = inquiries?.filter((i) => !i.read).length || 0;

  const openMessage = (msg: Message) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      markMessageAsRead.mutate(msg.id);
    }
  };

  const openSubmission = (sub: CarSubmission) => {
    setSelectedSubmission(sub);
    setAdminNotes(sub.admin_notes || "");
    if (!sub.read) {
      markSubmissionAsRead.mutate(sub.id);
    }
  };

  const openInquiry = (inq: Inquiry) => {
    setSelectedInquiry(inq);
    if (!inq.read) {
      markInquiryAsRead.mutate(inq.id);
    }
  };

  const handleCreateCar = (submission: CarSubmission) => {
    navigate("/admin/biler", {
      state: {
        fromSubmission: {
          title: submission.title,
          brand: submission.brand,
          model: submission.car_model,
          year: submission.car_year,
          category: submission.category,
          tags: submission.tags,
          story: submission.car_story,
          images: submission.images,
          ownerName: submission.owner_name,
        },
      },
    });
  };

  return (
    <AdminLayout title="Meldinger">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kontakt" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Kontakt
              {unreadMessages > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                  {unreadMessages}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="biler" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Biler
              {unreadSubmissions > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                  {unreadSubmissions}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="foresporsel" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Forespørsler
              {unreadInquiries > 0 && (
                <Badge variant="destructive" className="ml-1 px-1.5 py-0.5 text-xs">
                  {unreadInquiries}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Kontakt Tab */}
          <TabsContent value="kontakt" className="mt-6">
            {loadingMessages ? (
              <div className="text-center py-12">Laster...</div>
            ) : !messages?.length ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen meldinger ennå</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {messages.map((msg) => (
                  <Card
                    key={msg.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${!msg.read ? "border-accent border-2" : ""}`}
                    onClick={() => openMessage(msg)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!msg.read && <span className="w-2 h-2 bg-accent rounded-full" />}
                            <h3 className="font-display text-lg truncate">{msg.subject}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Fra: {msg.name} • {format(new Date(msg.created_at), "d. MMM yyyy", { locale: nb })}
                          </p>
                          <p className="text-sm text-foreground/70 mt-2 line-clamp-2">{msg.message}</p>
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
          </TabsContent>

          {/* Biler Tab */}
          <TabsContent value="biler" className="mt-6">
            {loadingSubmissions ? (
              <div className="text-center py-12">Laster...</div>
            ) : !submissions?.length ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen bil-innsendinger ennå</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {submissions.map((sub) => (
                  <Card
                    key={sub.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${!sub.read ? "border-accent border-2" : ""}`}
                    onClick={() => openSubmission(sub)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!sub.read && <span className="w-2 h-2 bg-accent rounded-full" />}
                            <h3 className="font-display text-lg truncate">
                              {sub.title || `${sub.car_year ? sub.car_year + " " : ""}${sub.car_model}`}
                            </h3>
                            <Badge className={statusColors[sub.status]}>{statusLabels[sub.status]}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Fra: {sub.owner_name} • {format(new Date(sub.created_at), "d. MMM yyyy", { locale: nb })}
                          </p>
                          {sub.car_story && (
                            <p className="text-sm text-foreground/70 mt-2 line-clamp-2">{sub.car_story}</p>
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
          </TabsContent>

          {/* Forespørsler Tab */}
          <TabsContent value="foresporsel" className="mt-6">
            {loadingInquiries ? (
              <div className="text-center py-12">Laster...</div>
            ) : !inquiries?.length ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Inbox className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Ingen forespørsler ennå</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {inquiries.map((inq) => (
                  <Card
                    key={inq.id}
                    className={`cursor-pointer hover:shadow-md transition-shadow ${!inq.read ? "border-accent border-2" : ""}`}
                    onClick={() => openInquiry(inq)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!inq.read && <span className="w-2 h-2 bg-accent rounded-full" />}
                            <h3 className="font-display text-lg truncate">{inq.customer_name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(inq.created_at), "d. MMM yyyy", { locale: nb })}
                            {inq.inquiry_items?.length > 0 && ` • ${inq.inquiry_items.length} del(er)`}
                          </p>
                          {inq.message && (
                            <p className="text-sm text-foreground/70 mt-2 line-clamp-2">{inq.message}</p>
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
          </TabsContent>
        </Tabs>

        {/* Message Detail Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedMessage && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">{selectedMessage.subject}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      {selectedMessage.name}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${selectedMessage.email}`} className="hover:text-accent">
                        {selectedMessage.email}
                      </a>
                    </div>
                    {selectedMessage.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${selectedMessage.phone}`} className="hover:text-accent">
                          {selectedMessage.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(selectedMessage.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display text-lg mb-2">Melding</h4>
                    <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">{selectedMessage.message}</div>
                  </div>

                  <div className="pt-4 border-t flex flex-wrap gap-3">
                    {!selectedMessage.read && (
                      <Button onClick={() => markMessageAsRead.mutate(selectedMessage.id)}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marker som lest
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Er du sikker på at du vil slette denne meldingen?")) {
                          deleteMessage.mutate(selectedMessage.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Slett melding
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Submission Detail Dialog */}
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedSubmission && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">
                    {selectedSubmission.title ||
                      `${selectedSubmission.brand ? selectedSubmission.brand + " " : ""}${selectedSubmission.car_model}${selectedSubmission.car_year ? " " + selectedSubmission.car_year : ""}`}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="bg-muted/30 rounded-lg p-4 grid gap-2">
                    {selectedSubmission.brand && (
                      <div className="flex items-center gap-2">
                        <span className="font-display">Merke:</span>
                        <span>{selectedSubmission.brand}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-display">Modell:</span>
                      <span>{selectedSubmission.car_model}</span>
                      {selectedSubmission.car_year && <span>({selectedSubmission.car_year})</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-display">Kategori:</span>
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[selectedSubmission.category] || selectedSubmission.category}
                      </Badge>
                    </div>
                    {selectedSubmission.tags && selectedSubmission.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display">Stikkord:</span>
                        {selectedSubmission.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="font-display">Godkjenner redigering:</span>
                      {selectedSubmission.allow_edits ? (
                        <Badge className="bg-green-500 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Ja
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Nei
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      {selectedSubmission.owner_name}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${selectedSubmission.email}`} className="hover:text-accent">
                        {selectedSubmission.email}
                      </a>
                    </div>
                    {selectedSubmission.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${selectedSubmission.phone}`} className="hover:text-accent">
                          {selectedSubmission.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(selectedSubmission.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                    </div>
                  </div>

                  {selectedSubmission.images && selectedSubmission.images.length > 0 && (
                    <div>
                      <h4 className="font-display text-lg mb-2 flex items-center gap-2">
                        <Image className="w-4 h-4" />
                        Bilder ({selectedSubmission.images.length})
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedSubmission.images.map((imageUrl, index) => (
                          <a
                            key={index}
                            href={imageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square rounded-lg overflow-hidden border hover:opacity-80 transition-opacity"
                          >
                            <img src={imageUrl} alt={`Bilde ${index + 1}`} className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSubmission.car_story && (
                    <div>
                      <h4 className="font-display text-lg mb-2">Historien</h4>
                      <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                        {selectedSubmission.car_story}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-display text-lg mb-2">Status</h4>
                    <Select
                      value={selectedSubmission.status}
                      onValueChange={(value) =>
                        updateSubmissionStatus.mutate({ id: selectedSubmission.id, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Venter</SelectItem>
                        <SelectItem value="reviewed">Gjennomgått</SelectItem>
                        <SelectItem value="published">Publisert</SelectItem>
                        <SelectItem value="rejected">Avvist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <h4 className="font-display text-lg mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Admin-notater
                    </h4>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Interne notater..."
                      className="min-h-[100px]"
                    />
                    <Button
                      variant="outline"
                      className="mt-2"
                      onClick={() => updateSubmissionNotes.mutate({ id: selectedSubmission.id, notes: adminNotes })}
                    >
                      Lagre notater
                    </Button>
                  </div>

                  <div className="pt-4 border-t flex flex-wrap gap-3">
                    <Button onClick={() => handleCreateCar(selectedSubmission)} className="bg-primary">
                      <Plus className="w-4 h-4 mr-2" />
                      Opprett bil fra innsending
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Er du sikker på at du vil slette denne innsendingen?")) {
                          deleteSubmission.mutate(selectedSubmission.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Slett innsending
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Inquiry Detail Dialog */}
        <Dialog open={!!selectedInquiry} onOpenChange={() => setSelectedInquiry(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedInquiry && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">Forespørsel fra {selectedInquiry.customer_name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      <a href={`mailto:${selectedInquiry.email}`} className="hover:text-accent">
                        {selectedInquiry.email}
                      </a>
                    </div>
                    {selectedInquiry.phone && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <a href={`tel:${selectedInquiry.phone}`} className="hover:text-accent">
                          {selectedInquiry.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(selectedInquiry.created_at), "d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}
                    </div>
                  </div>

                  {selectedInquiry.car_model && (
                    <div className="bg-muted/30 rounded-lg p-4">
                      <span className="font-display">Bil:</span> {selectedInquiry.car_model}
                      {selectedInquiry.car_year && ` (${selectedInquiry.car_year})`}
                    </div>
                  )}

                  {selectedInquiry.inquiry_items && selectedInquiry.inquiry_items.length > 0 && (
                    <div>
                      <h4 className="font-display text-lg mb-2">Forespurte deler</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {selectedInquiry.inquiry_items.map((item, i) => (
                          <li key={i}>{item.part_title}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedInquiry.message && (
                    <div>
                      <h4 className="font-display text-lg mb-2">Melding</h4>
                      <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">{selectedInquiry.message}</div>
                    </div>
                  )}

                  <div className="pt-4 border-t flex flex-wrap gap-3">
                    {!selectedInquiry.read && (
                      <Button
                        onClick={() => {
                          markInquiryAsRead.mutate(selectedInquiry.id);
                          setSelectedInquiry({ ...selectedInquiry, read: true });
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marker som lest
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
