import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/hooks/useAuth';
import { getSupportTickets, updateSupportTicket, getSupportTicketStats, type SupportTicket, type SupportTicketStatus } from '@/data/supportTickets';
import { deleteSupportTicket } from '@/data/supportTickets';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Copy, ChevronDown, Image as ImageIcon, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { nb } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type FilterType = 'new' | 'high' | 'recent' | 'all';

export default function AdminSupport() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [status, setStatus] = useState<SupportTicketStatus>('new');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [stats, setStats] = useState({ total: 0, new: 0, high: 0, recent: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) return;
    loadTickets();
    loadStats();
  }, [isAdmin, filter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const filters: { status?: SupportTicketStatus; severity?: 'high'; days?: number } = {};
      
      if (filter === 'new') filters.status = 'new';
      if (filter === 'high') filters.severity = 'high';
      if (filter === 'recent') filters.days = 7;

      const { data, error } = await getSupportTickets(filters);
      if (error) throw error;
      
      setTickets(data || []);
      if (selectedTicket && data) {
        const updated = data.find(t => t.id === selectedTicket.id);
        if (updated) setSelectedTicket(updated);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast({
        title: 'Feil',
        description: 'Kunne ikke laste tickets.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await getSupportTicketStats();
      if (statsData) setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleTicketClick = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setStatus(ticket.status);
    setAdminNotes(ticket.admin_notes || '');
  };

  const handleSave = async () => {
    if (!selectedTicket) return;

    setIsSaving(true);
    try {
      const { error } = await updateSupportTicket(selectedTicket.id, {
        status,
        admin_notes: adminNotes,
      });

      if (error) throw error;

      toast({
        title: 'Lagret',
        description: 'Ticket oppdatert.',
      });

      await loadTickets();
      await loadStats();
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke lagre endringer.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTicket) return;
    if (!confirm('Er du sikker på at du vil slette denne ticketen?')) return;

    setIsDeleting(true);
    try {
      const { error } = await deleteSupportTicket(selectedTicket.id);
      if (error) throw error;

      toast({
        title: 'Slettet',
        description: 'Ticket slettet.',
      });

      setSelectedTicket(null);
      await loadTickets();
      await loadStats();
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke slette ticket.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const copyDebugInfo = () => {
    if (!selectedTicket?.debug_payload) return;
    
    navigator.clipboard.writeText(JSON.stringify(selectedTicket.debug_payload, null, 2));
    toast({
      title: 'Kopiert',
      description: 'Teknisk logg kopiert til utklippstavle.',
    });
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return { label: 'Kritisk', variant: 'destructive' as const };
      case 'medium': return { label: 'Stopper meg', variant: 'default' as const };
      default: return { label: 'Irriterende', variant: 'secondary' as const };
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'bug': return 'Bug';
      case 'suggestion': return 'Forslag';
      case 'content': return 'Innhold';
      default: return 'Annet';
    }
  };

  return (
    <AdminLayout title="Support Tickets">
      <div className="space-y-4">
        {/* Filters - scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="shrink-0"
          >
            Alle ({stats.total})
          </Button>
          <Button
            variant={filter === 'new' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('new')}
            className="shrink-0"
          >
            Ny ({stats.new})
          </Button>
          <Button
            variant={filter === 'high' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('high')}
            className="shrink-0"
          >
            Kritisk ({stats.high})
          </Button>
          <Button
            variant={filter === 'recent' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('recent')}
            className="shrink-0"
          >
            Siste 7d ({stats.recent})
          </Button>
        </div>

        {/* Mobile: Ticket list only, tap to expand */}
        <div className="lg:hidden space-y-3">
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Laster...</p>
          ) : tickets.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Ingen tickets funnet.</p>
          ) : (
            tickets.map((ticket) => {
              const severity = getSeverityLabel(ticket.severity);
              const isSelected = selectedTicket?.id === ticket.id;
              return (
                <div key={ticket.id} className="border rounded-lg overflow-hidden">
                  <div
                    onClick={() => isSelected ? setSelectedTicket(null) : handleTicketClick(ticket)}
                    className={`p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant={severity.variant} className="text-[10px]">{severity.label}</Badge>
                        <Badge variant="outline" className="text-[10px]">{getTypeLabel(ticket.type)}</Badge>
                        {ticket.status === 'new' && (
                          <Badge variant="default" className="text-[10px]">Ny</Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(ticket.created_at), {
                          addSuffix: true,
                          locale: nb,
                        })}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">{ticket.action_text}</p>
                  </div>
                  
                  {/* Expanded details on mobile */}
                  {isSelected && (
                    <div className="border-t p-4 space-y-4 bg-muted/30">
                      <div className="space-y-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">Hva prøvde brukeren å gjøre?</Label>
                          <p className="text-sm mt-1">{selectedTicket.action_text}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Hva skjedde i stedet?</Label>
                          <p className="text-sm mt-1">{selectedTicket.result_text}</p>
                        </div>
                      </div>

                      {selectedTicket.screenshot_url && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <ImageIcon className="w-4 h-4" />
                            <span className="text-xs">Skjermbilde</span>
                          </div>
                          <img
                            src={selectedTicket.screenshot_url}
                            alt="Skjermbilde"
                            className="max-w-full rounded-lg border"
                          />
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        <p>Side: {selectedTicket.page}</p>
                      </div>

                      {/* Status & Save */}
                      <div className="space-y-3 pt-3 border-t">
                        <div className="space-y-2">
                          <Label className="text-xs">Status</Label>
                          <Select value={status} onValueChange={(v) => setStatus(v as SupportTicketStatus)}>
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-background">
                              <SelectItem value="new">Ny</SelectItem>
                              <SelectItem value="seen">Sett</SelectItem>
                              <SelectItem value="in_progress">Under arbeid</SelectItem>
                              <SelectItem value="resolved">Løst</SelectItem>
                              <SelectItem value="not_a_bug">Ikke en bug</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Admin notater</Label>
                          <Textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            rows={3}
                            placeholder="Interne notater..."
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                            {isSaving ? 'Lagrer...' : 'Lagre'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={handleDelete}
                            disabled={isDeleting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Desktop: Two-column layout */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-6">
          {/* Left: Ticket List */}
          <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Laster...</p>
            ) : tickets.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Ingen tickets funnet.</p>
            ) : (
              tickets.map((ticket) => {
                const severity = getSeverityLabel(ticket.severity);
                return (
                  <div
                    key={ticket.id}
                    onClick={() => handleTicketClick(ticket)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTicket?.id === ticket.id
                        ? 'border-primary bg-primary/5'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={severity.variant}>{severity.label}</Badge>
                        <Badge variant="outline">{getTypeLabel(ticket.type)}</Badge>
                        {ticket.status === 'new' && (
                          <Badge variant="default">Ny</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(ticket.created_at), {
                          addSuffix: true,
                          locale: nb,
                        })}
                      </span>
                    </div>
                    <p className="text-sm line-clamp-2">
                      {ticket.action_text}
                    </p>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Ticket Details */}
          <div>
            {selectedTicket ? (
              <div className="border rounded-lg p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="font-display text-lg">Ticket detaljer</h3>
                  
                  {/* Action & Result */}
                  <div className="space-y-4">
                    <div>
                      <Label className="text-muted-foreground">Hva prøvde brukeren å gjøre?</Label>
                      <p className="mt-1">{selectedTicket.action_text}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Hva skjedde i stedet?</Label>
                      <p className="mt-1">{selectedTicket.result_text}</p>
                    </div>
                  </div>

                  {/* Screenshot */}
                  {selectedTicket.screenshot_url && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <ImageIcon className="w-4 h-4" />
                        <span className="text-sm">Skjermbilde</span>
                      </div>
                      <img
                        src={selectedTicket.screenshot_url}
                        alt="Skjermbilde"
                        className="max-w-full rounded-lg border"
                      />
                    </div>
                  )}

                  {/* Context */}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Side: {selectedTicket.page}</p>
                    {selectedTicket.app_version && (
                      <p>Versjon: {selectedTicket.app_version}</p>
                    )}
                    {selectedTicket.created_at && (
                      <p>Opprettet: {new Date(selectedTicket.created_at).toLocaleString('nb-NO')}</p>
                    )}
                  </div>

                  {/* Debug Payload */}
                  {selectedTicket.debug_payload && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <span>Teknisk logg (skjult)</span>
                        <ChevronDown className="w-4 h-4" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 space-y-2">
                          <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto max-h-64">
                            {JSON.stringify(selectedTicket.debug_payload, null, 2)}
                          </pre>
                          <Button variant="outline" size="sm" onClick={copyDebugInfo}>
                            <Copy className="w-3 h-3 mr-2" />
                            Kopier
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}

                  {/* Status & Notes */}
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={status} onValueChange={(v) => setStatus(v as SupportTicketStatus)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background">
                          <SelectItem value="new">Ny</SelectItem>
                          <SelectItem value="seen">Sett</SelectItem>
                          <SelectItem value="in_progress">Under arbeid</SelectItem>
                          <SelectItem value="resolved">Løst</SelectItem>
                          <SelectItem value="not_a_bug">Ikke en bug</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Admin notater</Label>
                      <Textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={4}
                        placeholder="Interne notater om denne ticket..."
                      />
                    </div>

                    <Button onClick={handleSave} disabled={isSaving} className="w-full">
                      {isSaving ? 'Lagrer...' : 'Lagre'}
                    </Button>
                  </div>

                  {/* Delete */}
                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isDeleting ? 'Sletter...' : 'Slett ticket'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border rounded-lg p-12 text-center text-muted-foreground">
                Velg en ticket for å se detaljer
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
