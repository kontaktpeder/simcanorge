import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Copy, Mail, Check, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SenderInfo {
  name: string;
  email: string;
  roleText: string;
}

const SENDER_INFO: Record<'peder' | 'peter', SenderInfo> = {
  peder: {
    name: 'Peder August Halvorsen',
    email: 'kontaktpeder@gmail.com',
    roleText: 'sønn av Peter, eier av nettsiden Simca Norge',
  },
  peter: {
    name: 'Peter Arnt Halvorsen',
    email: 'p-ahalvo@online.no',
    roleText: 'eier av nettsiden Simca Norge',
  },
};

interface InviteEmailGeneratorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientEmail?: string;
  recipientName?: string;
  inviteLink?: string;
  carName?: string;
}

export function InviteEmailGenerator({
  open,
  onOpenChange,
  recipientEmail: initialEmail = '',
  recipientName: initialName = '',
  inviteLink: initialLink = '',
  carName: initialCarName = '',
}: InviteEmailGeneratorProps) {
  const { toast } = useToast();
  const [sender, setSender] = useState<'peder' | 'peter'>('peder');
  const [recipientName, setRecipientName] = useState(initialName);
  const [recipientEmail, setRecipientEmail] = useState(initialEmail);
  const [inviteLink, setInviteLink] = useState(initialLink);
  const [carName, setCarName] = useState(initialCarName);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Update state when props change (when modal opens with new data)
  useEffect(() => {
    if (open) {
      setRecipientName(initialName);
      setRecipientEmail(initialEmail);
      setInviteLink(initialLink);
      setCarName(initialCarName);
    }
  }, [open, initialName, initialEmail, initialLink, initialCarName]);

  const senderInfo = SENDER_INFO[sender];

  const validateEmail = (email: string): boolean => {
    return email.includes('@') && email.trim().length > 0;
  };

  const validateLink = (link: string): boolean => {
    return link.trim().startsWith('http') && link.trim().length > 0;
  };

  const isValid = validateEmail(recipientEmail) && validateLink(inviteLink);

  const generateEmailBody = (): string => {
    const carText = carName.trim() 
      ? `Utrolig kul ${carName.trim()}!` 
      : 'Utrolig kul bil!';

    return `Hei ${recipientName.trim() || 'der'}!

Dette er ${senderInfo.roleText}.

Jeg er teknisk ansvarlig for siden. ${carText}

Denne lenken gir deg tilgang til bilen din hvor du kan legge til bilder og redigere tekst:
${inviteLink.trim()}

Du finner "Min side / Bilgarasje" oppe til høyre på nettsiden når du er logget inn.

Mvh
${senderInfo.name}
${senderInfo.email}`;
  };

  const emailSubject = 'Tilgang til bilen din på Simca Norge';

  const copyToClipboard = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 2000);
      toast({
        title: 'Kopiert!',
        description: `${section} er kopiert til utklippstavle.`,
      });
    } catch (error) {
      toast({
        title: 'Feil',
        description: 'Kunne ikke kopiere til utklippstavle.',
        variant: 'destructive',
      });
    }
  };

  const copyAllBody = () => {
    // Mobile e-post-apper kan oppføre seg rart hvis du limer flerlinjet tekst inn i "Til"-feltet.
    // Denne varianten kopierer kun brødteksten, som er trygg å lime rett inn i meldingsfeltet.
    copyToClipboard(generateEmailBody(), 'alt');
  };

  const copyAllFull = () => {
    // Full e-post (Til + Emne + brødtekst). Tips: lim dette i brødtekst/Notater, ikke i "Til"-feltet.
    const fullEmail = `Til: ${recipientEmail}\nEmne: ${emailSubject}\n\n${generateEmailBody()}`;
    copyToClipboard(fullEmail, 'alt_full');
  };

  const copySubject = () => {
    copyToClipboard(emailSubject, 'emne');
  };

  const copyBody = () => {
    copyToClipboard(generateEmailBody(), 'brødtekst');
  };

  const copyRecipient = () => {
    copyToClipboard(recipientEmail, 'mottaker');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Send tilgangslenke
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Avsender */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Velg avsender *</Label>
            <RadioGroup value={sender} onValueChange={(v) => setSender(v as 'peder' | 'peter')} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="peder" id="peder" />
                <Label htmlFor="peder" className="cursor-pointer">Peder</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="peter" id="peter" />
                <Label htmlFor="peter" className="cursor-pointer">Peter</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mottaker navn */}
          <div className="space-y-2">
            <Label htmlFor="recipientName" className="text-sm font-medium">Mottakers navn</Label>
            <Input
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ola Nordmann"
            />
          </div>

          {/* Mottaker e-post */}
          <div className="space-y-2">
            <Label htmlFor="recipientEmail" className="text-sm font-medium">Mottakers e-post *</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="ola@eksempel.no"
              className={!validateEmail(recipientEmail) && recipientEmail ? 'border-destructive' : ''}
            />
            {!validateEmail(recipientEmail) && recipientEmail && (
              <p className="text-xs text-destructive">E-post må inneholde @</p>
            )}
          </div>

          {/* Tilgangslenke */}
          <div className="space-y-2">
            <Label htmlFor="inviteLink" className="text-sm font-medium flex items-center gap-1">
              <LinkIcon className="w-3 h-3" />
              Tilgangslenke *
            </Label>
            <Input
              id="inviteLink"
              value={inviteLink}
              onChange={(e) => setInviteLink(e.target.value)}
              placeholder="https://simcanorge.lovable.app/i/5f78fd57"
              className={`font-mono text-sm ${!validateLink(inviteLink) && inviteLink ? 'border-destructive' : ''}`}
            />
            {!validateLink(inviteLink) && inviteLink && (
              <p className="text-xs text-destructive">Lenke må starte med http</p>
            )}
          </div>

          {/* Bilnavn */}
          <div className="space-y-2">
            <Label htmlFor="carName" className="text-sm font-medium">Bilnavn / modell</Label>
            <Input
              id="carName"
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="Simca 1000 Rallye"
            />
          </div>

          {/* Forhåndsvisning */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Til:</Label>
              <Button variant="outline" size="sm" onClick={copyRecipient} disabled={!recipientEmail}>
                {copiedSection === 'mottaker' ? <><Check className="w-3 h-3 mr-1" />Kopiert</> : <><Copy className="w-3 h-3 mr-1" />Kopier</>}
              </Button>
            </div>
            <div className="bg-muted rounded-md p-2">
              <p className="text-sm font-mono break-all">{recipientEmail || <span className="text-muted-foreground italic">Mangler e-post</span>}</p>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Emne:</Label>
              <Button variant="outline" size="sm" onClick={copySubject}>
                {copiedSection === 'emne' ? <><Check className="w-3 h-3 mr-1" />Kopiert</> : <><Copy className="w-3 h-3 mr-1" />Kopier</>}
              </Button>
            </div>
            <div className="bg-muted rounded-md p-2">
              <p className="text-sm">{emailSubject}</p>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Brødtekst:</Label>
              <Button variant="outline" size="sm" onClick={copyBody}>
                {copiedSection === 'brødtekst' ? <><Check className="w-3 h-3 mr-1" />Kopiert</> : <><Copy className="w-3 h-3 mr-1" />Kopier</>}
              </Button>
            </div>
            <div className="bg-muted rounded-md p-3 max-h-48 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans">{generateEmailBody()}</pre>
            </div>
          </div>

          {/* Kopier */}
          <div className="grid gap-2">
            <Button onClick={copyAllBody} disabled={!isValid} className="w-full" size="lg">
              {copiedSection === 'alt' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />Brødtekst kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />Kopier brødtekst
                </>
              )}
            </Button>

            <Button
              onClick={copyAllFull}
              disabled={!isValid}
              className="w-full"
              size="lg"
              variant="outline"
            >
              {copiedSection === 'alt_full' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />Alt kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />Kopier alt (Til + Emne + tekst)
                </>
              )}
            </Button>
          </div>
          {!isValid && (
            <p className="text-xs text-muted-foreground text-center">
              Fyll ut mottaker e-post og tilgangslenke for å kunne kopiere
            </p>
          )}
          {isValid && (
            <p className="text-xs text-muted-foreground text-center">
              Tips på mobil: Lim inn i brødtekstfeltet (ikke i «Til»-feltet).
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
