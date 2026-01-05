import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Car, Mail, Phone, Calendar, Eye, Trash2, MessageSquare, Image, Plus } from "lucide-react";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface CarSubmission {
  id: string;
  owner_name: string;
  email: string;
  phone: string | null;
  car_model: string;
  car_year: number | null;
  car_story: string | null;
  images: string[] | null;
  status: string;
  admin_notes: string | null;
  read: boolean;
  created_at: string;
}

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

export default function AdminInnsendinger() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedSubmission, setSelectedSubmission] = useState<CarSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const handleCreateCar = (submission: CarSubmission) => {
    // Navigate to AdminBiler with submission data in state
    navigate("/admin/biler", {
      state: {
        fromSubmission: {
          model: submission.car_model,
          year: submission.car_year,
          story: submission.car_story,
          images: submission.images,
          ownerName: submission.owner_name,
        }
      }
    });
  };

  const { data: submissions, isLoading } = useQuery({
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

  const markAsRead = useMutation({
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

  const updateStatus = useMutation({
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

  const updateNotes = useMutation({
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
      const { error } = await supabase
        .from("car_submissions")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["car-submissions"] });
      setSelectedSubmission(null);
      toast({ title: "Innsending slettet" });
    },
  });

  const openSubmission = (submission: CarSubmission) => {
    setSelectedSubmission(submission);
    setAdminNotes(submission.admin_notes || "");
    if (!submission.read) {
      markAsRead.mutate(submission.id);
    }
  };

  const unreadCount = submissions?.filter(s => !s.read).length || 0;

  return (
    <AdminLayout title="Bil-innsendinger">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display">Bil-innsendinger</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} ulest${unreadCount > 1 ? 'e' : ''}` : 'Ingen uleste'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">Laster...</div>
        ) : !submissions?.length ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ingen innsendinger ennå</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => (
              <Card 
                key={submission.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${!submission.read ? 'border-accent border-2' : ''}`}
                onClick={() => openSubmission(submission)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {!submission.read && (
                          <span className="w-2 h-2 bg-accent rounded-full" />
                        )}
                        <h3 className="font-display text-lg truncate">
                          {submission.car_year && `${submission.car_year} `}{submission.car_model}
                        </h3>
                        <Badge className={statusColors[submission.status]}>
                          {statusLabels[submission.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Fra: {submission.owner_name} • {format(new Date(submission.created_at), "d. MMM yyyy", { locale: nb })}
                      </p>
                      {submission.car_story && (
                        <p className="text-sm text-foreground/70 mt-2 line-clamp-2">
                          {submission.car_story}
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
        <Dialog open={!!selectedSubmission} onOpenChange={() => setSelectedSubmission(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedSubmission && (
              <>
                <DialogHeader>
                  <DialogTitle className="font-display text-2xl">
                    {selectedSubmission.car_year && `${selectedSubmission.car_year} `}
                    {selectedSubmission.car_model}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                  {/* Contact info */}
                  <div className="grid gap-3">
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="font-medium">{selectedSubmission.owner_name}</span>
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

                  {/* Images */}
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
                            <img 
                              src={imageUrl} 
                              alt={`Bilde ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Story */}
                  {selectedSubmission.car_story && (
                    <div>
                      <h4 className="font-display text-lg mb-2">Historien</h4>
                      <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">
                        {selectedSubmission.car_story}
                      </div>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <h4 className="font-display text-lg mb-2">Status</h4>
                    <Select
                      value={selectedSubmission.status}
                      onValueChange={(value) => updateStatus.mutate({ id: selectedSubmission.id, status: value })}
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

                  {/* Admin notes */}
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
                      onClick={() => updateNotes.mutate({ id: selectedSubmission.id, notes: adminNotes })}
                    >
                      Lagre notater
                    </Button>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t flex flex-wrap gap-3">
                    <Button
                      onClick={() => handleCreateCar(selectedSubmission)}
                      className="bg-primary"
                    >
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
      </div>
    </AdminLayout>
  );
}
