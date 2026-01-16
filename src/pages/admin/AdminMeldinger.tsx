import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Mail, Phone, Calendar, Trash2, MessageSquare, 
  CheckCircle, AlertTriangle
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
  message_type: string | null;
  read: boolean;
  created_at: string;
}

export default function AdminMeldinger() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Dialog states
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

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

  // Counts
  const unreadMessages = messages?.filter((m) => !m.read).length || 0;

  const openMessage = (msg: Message) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      markMessageAsRead.mutate(msg.id);
    }
  };

  return (
    <AdminLayout title="Meldinger">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {messages?.length || 0} melding{messages?.length !== 1 ? "er" : ""} totalt
            {unreadMessages > 0 && (
              <Badge variant="destructive" className="ml-3">
                {unreadMessages} ulest{unreadMessages !== 1 ? "e" : ""}
              </Badge>
            )}
          </p>
        </div>

        {/* Message List */}
        {loadingMessages ? (
          <div className="text-center py-12">Laster...</div>
        ) : !messages?.length ? (
          <div className="bg-card border border-border rounded-xl py-12 text-center text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Ingen meldinger ennå</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-card border rounded-xl p-3 cursor-pointer hover:shadow-md transition-shadow ${!msg.read ? "border-accent border-2" : "border-border"}`}
                onClick={() => openMessage(msg)}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    {msg.message_type === 'report_problem' ? (
                      <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
                    ) : (
                      <MessageSquare className="w-5 h-5 md:w-6 md:h-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {!msg.read && <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />}
                          <span className="font-medium text-sm truncate block">{msg.subject}</span>
                          {msg.message_type === 'report_problem' && (
                            <Badge variant="destructive" className="text-xs">Problem</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {msg.name} · {format(new Date(msg.created_at), "d. MMM", { locale: nb })}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-foreground/70 mt-1.5 line-clamp-1 md:line-clamp-2">{msg.message}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Message Detail Dialog */}
        <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedMessage && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <DialogTitle className="font-display text-2xl">{selectedMessage.subject}</DialogTitle>
                    {selectedMessage.message_type === 'report_problem' && (
                      <Badge variant="destructive">Problem</Badge>
                    )}
                  </div>
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
                    <Button asChild>
                      <a href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`}>
                        <Mail className="w-4 h-4 mr-2" />
                        Svar på e-post
                      </a>
                    </Button>
                    {!selectedMessage.read && (
                      <Button variant="outline" onClick={() => markMessageAsRead.mutate(selectedMessage.id)}>
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
      </div>
    </AdminLayout>
  );
}
