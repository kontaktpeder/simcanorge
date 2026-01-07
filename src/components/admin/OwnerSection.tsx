import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Copy, Check, Trash2, Users, Mail, Link as LinkIcon, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Owner {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  token: string;
  expires_at: string;
  created_at: string;
}

interface OwnerSectionProps {
  carId: string;
}

export function OwnerSection({ carId }: OwnerSectionProps) {
  const [ownerEmail, setOwnerEmail] = useState('');
  const [owners, setOwners] = useState<Owner[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  // Fetch owners
  useEffect(() => {
    const fetchOwners = async () => {
      if (!carId) return;
      
      const { data, error } = await supabase
        .from('car_owners')
        .select('*')
        .eq('car_id', carId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching owners:', error);
      } else {
        setOwners(data || []);
      }
    };
    
    fetchOwners();
  }, [carId]);

  // Fetch active invitations
  useEffect(() => {
    const fetchInvitations = async () => {
      if (!carId) return;
      
      const { data, error } = await supabase
        .from('car_invitations')
        .select('*')
        .eq('car_id', carId)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching invitations:', error);
      } else {
        setInvitations(data || []);
      }
      setIsLoading(false);
    };
    
    fetchInvitations();
  }, [carId]);

  // Generate invitation
  const generateInvitation = async () => {
    if (!ownerEmail || !carId || !user) {
      toast.error('Mangler informasjon');
      return;
    }

    // Normalize email FIRST
    const normalizedEmail = ownerEmail.trim().toLowerCase();
    
    if (!normalizedEmail) {
      toast.error('E-postadresse kan ikke være tom');
      return;
    }

    // Validate normalized email (supports + and modern TLDs)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      toast.error('Ugyldig e-postadresse');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Check if active invitation already exists for this email
      const { data: existingInvitation } = await supabase
        .from('car_invitations')
        .select('*')
        .eq('car_id', carId)
        .eq('email', normalizedEmail)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (existingInvitation) {
        // Use existing invitation
        const magicLink = `${window.location.origin}/accept-invitation?token=${existingInvitation.token}`;
        await navigator.clipboard.writeText(magicLink);
        setCopiedLink(existingInvitation.token);
        setTimeout(() => setCopiedLink(null), 3000);
        toast.success('Aktiv link finnes allerede – bruker den. Lenken er kopiert.');
        setOwnerEmail('');
        // Update state if invitation not already in list
        if (!invitations.find(inv => inv.id === existingInvitation.id)) {
          setInvitations(prev => [existingInvitation, ...prev]);
        }
        setIsGenerating(false);
        return;
      }

      // Generate token
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

      // Save invitation with normalized email
      const { data, error } = await supabase
        .from('car_invitations')
        .insert({
          car_id: carId,
          email: normalizedEmail,
          token: token,
          expires_at: expiresAt.toISOString(),
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update state
      setInvitations(prev => [data, ...prev]);
      
      // Generate magic link
      const magicLink = `${window.location.origin}/accept-invitation?token=${token}`;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(magicLink);
      setCopiedLink(token);
      setTimeout(() => setCopiedLink(null), 3000);
      
      toast.success('Invitasjon opprettet! Lenken er kopiert til utklippstavle.');
      setOwnerEmail('');
      
    } catch (error: any) {
      console.error('Error generating invitation:', error);
      toast.error('Kunne ikke opprette invitasjon');
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy link
  const copyLink = async (token: string) => {
    const magicLink = `${window.location.origin}/accept-invitation?token=${token}`;
    await navigator.clipboard.writeText(magicLink);
    setCopiedLink(token);
    setTimeout(() => setCopiedLink(null), 3000);
    toast.success('Lenke kopiert!');
  };

  // Delete invitation
  const deleteInvitation = async (invitationId: string) => {
    const { error } = await supabase
      .from('car_invitations')
      .delete()
      .eq('id', invitationId);
    
    if (error) {
      toast.error('Kunne ikke slette invitasjon');
    } else {
      setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      toast.success('Invitasjon slettet');
    }
  };

  // Remove owner
  const removeOwner = async (ownerId: string) => {
    if (!confirm('Er du sikker på at du vil fjerne denne eieren?')) return;
    
    const { error } = await supabase
      .from('car_owners')
      .delete()
      .eq('id', ownerId);
    
    if (error) {
      toast.error('Kunne ikke fjerne eier');
    } else {
      setOwners(prev => prev.filter(o => o.id !== ownerId));
      toast.success('Eier fjernet');
    }
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 md:p-6">
        <h3 className="font-display text-lg mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          EIERE & TILGANG
        </h3>
        <p className="text-muted-foreground text-sm">Laster...</p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-4 md:p-6">
      <h3 className="font-display text-lg mb-4 flex items-center gap-2">
        <Users className="w-5 h-5" />
        EIERE & TILGANG
      </h3>

      {/* Existing owners */}
      {owners.length > 0 && (
        <div className="mb-6">
          <p className="text-sm font-medium mb-2">Registrerte eiere:</p>
          <div className="space-y-2">
            {owners.map(owner => (
              <div key={owner.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{owner.email}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    {owner.role === 'owner' ? 'Eier' : 'Viewer'}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeOwner(owner.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate new invitation */}
      <div className="mb-6">
        <p className="text-sm font-medium mb-2">Send tilgang til ny eier:</p>
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="epost@eksempel.no"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && ownerEmail && !isGenerating) {
                e.preventDefault();
                generateInvitation();
              }
            }}
          />
          <Button onClick={generateInvitation} disabled={isGenerating || !ownerEmail}>
            {isGenerating ? 'Genererer...' : 'Generer invitasjon'}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Kopier lenken nedenfor og send den til e-posten manuelt
        </p>
      </div>

      {/* Active invitations */}
      {invitations.length > 0 && (
        <div>
          <p className="text-sm font-medium mb-2">Aktive invitasjoner:</p>
          <div className="space-y-3">
            {invitations.map(invitation => {
              const magicLink = `${window.location.origin}/accept-invitation?token=${invitation.token}`;
              const isCopied = copiedLink === invitation.token;
              const daysLeft = getDaysUntilExpiry(invitation.expires_at);
              
              return (
                <div key={invitation.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{invitation.email}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => deleteInvitation(invitation.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-background border rounded px-2 py-1">
                      <p className="text-xs truncate font-mono">{magicLink}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => copyLink(invitation.token)}
                      className="shrink-0"
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Kopiert
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 mr-1" />
                          Kopier
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      Send denne lenken til: {invitation.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Utløper om {daysLeft} {daysLeft === 1 ? 'dag' : 'dager'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No owners or invitations */}
      {owners.length === 0 && invitations.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Ingen eiere ennå. Generer en invitasjon for å gi tilgang.
        </p>
      )}
    </div>
  );
}
