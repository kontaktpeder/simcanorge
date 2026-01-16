import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Copy, Mail, Check, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export function InviteEmailGenerator() {
  const { toast } = useToast();
  const [sender, setSender] = useState<'peder' | 'peter'>('peder');
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [carName, setCarName] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

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

  const copyAll = () => {
    const fullEmail = `Til: ${recipientEmail}\nEmne: ${emailSubject}\n\n${generateEmailBody()}`;
    copyToClipboard(fullEmail, 'alt');
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
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5" />
            Send tilgangslenke
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avsender */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Velg avsender *</Label>
            <RadioGroup value={sender} onValueChange={(v) => setSender(v as 'peder' | 'peter')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="peder" id="peder" />
                <Label htmlFor="peder" className="cursor-pointer">
                  Peder
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="peter" id="peter" />
                <Label htmlFor="peter" className="cursor-pointer">
                  Peter
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Mottaker navn */}
          <div className="space-y-2">
            <Label htmlFor="recipientName" className="text-sm font-medium">
              Mottakers navn *
            </Label>
            <Input
              id="recipientName"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="Ola Nordmann"
              className="h-11"
            />
          </div>

          {/* Mottaker e-post */}
          <div className="space-y-2">
            <Label htmlFor="recipientEmail" className="text-sm font-medium">
              Mottakers e-post *
            </Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="ola@eksempel.no"
              className={`h-11 ${!validateEmail(recipientEmail) && recipientEmail ? 'border-destructive' : ''}`}
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
              className={`h-11 font-mono text-sm ${!validateLink(inviteLink) && inviteLink ? 'border-destructive' : ''}`}
            />
            {!validateLink(inviteLink) && inviteLink && (
              <p className="text-xs text-destructive">Lenke må starte med http</p>
            )}
          </div>

          {/* Bilnavn (valgfritt) */}
          <div className="space-y-2">
            <Label htmlFor="carName" className="text-sm font-medium">
              Bilnavn / modell (valgfritt)
            </Label>
            <Input
              id="carName"
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="Simca 1000 Rallye"
              className="h-11"
            />
          </div>
        </CardContent>
      </Card>

      {/* Output panel */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Generert e-post</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Til: */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Til:</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={copyRecipient}
                disabled={!recipientEmail}
                className="h-8"
              >
                {copiedSection === 'mottaker' ? (
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
            <div className="bg-muted rounded-md p-3">
              <p className="text-sm font-mono break-all">{recipientEmail || <span className="text-muted-foreground italic">Mangler e-post</span>}</p>
            </div>
          </div>

          {/* Emne: */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Emne:</Label>
              <Button variant="outline" size="sm" onClick={copySubject} className="h-8">
                {copiedSection === 'emne' ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Kopiert
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Kopier emne
                  </>
                )}
              </Button>
            </div>
            <div className="bg-muted rounded-md p-3">
              <p className="text-sm">{emailSubject}</p>
            </div>
          </div>

          {/* Brødtekst */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Brødtekst:</Label>
              <Button variant="outline" size="sm" onClick={copyBody} className="h-8">
                {copiedSection === 'brødtekst' ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Kopiert
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Kopier brødtekst
                  </>
                )}
              </Button>
            </div>
            <div className="bg-muted rounded-md p-3 max-h-64 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans">{generateEmailBody()}</pre>
            </div>
          </div>

          {/* Kopier alt knapp */}
          <div className="pt-4 border-t">
            <Button
              onClick={copyAll}
              disabled={!isValid}
              className="w-full h-11"
              size="lg"
            >
              {copiedSection === 'alt' ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Alt kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Kopier alt
                </>
              )}
            </Button>
            {!isValid && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Fyll ut mottaker e-post og tilgangslenke for å kunne kopiere
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
