import { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { createSupportTicket } from '@/data/supportTickets';
import { compressImage } from '@/lib/imageCompression';
import type { SupportTicketType, SupportTicketSeverity } from '@/data/supportTickets';

interface ReportProblemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string;
}

export function ReportProblemModal({ open, onOpenChange, userId }: ReportProblemModalProps) {
  const { toast } = useToast();
  const [type, setType] = useState<SupportTicketType>('bug');
  const [severity, setSeverity] = useState<SupportTicketSeverity>('low');
  const [actionText, setActionText] = useState('');
  const [resultText, setResultText] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [includeDebugInfo, setIncludeDebugInfo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleScreenshotChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setScreenshot(compressed.file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(compressed.file);
    } catch {
      toast({
        title: 'Feil ved opplasting',
        description: 'Kunne ikke behandle bildet. Prøv igjen.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actionText.trim() || !resultText.trim()) {
      toast({
        title: 'Mangler informasjon',
        description: 'Vennligst fyll ut alle felter.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await createSupportTicket({
        type,
        severity,
        action_text: actionText,
        result_text: resultText,
        screenshot: screenshot || undefined,
        includeDebugInfo,
        userId,
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Takk!',
        description: 'Vi har mottatt meldingen din.',
      });

      // Reset form
      setType('bug');
      setSeverity('low');
      setActionText('');
      setResultText('');
      setScreenshot(null);
      setScreenshotPreview(null);
      setIncludeDebugInfo(true);

      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Noe gikk galt',
        description: error instanceof Error ? error.message : 'Kunne ikke sende melding. Prøv igjen senere.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rapporter et problem</DialogTitle>
          <DialogDescription>
            Hjelp oss å gjøre Bilgarasje.no bedre ved å rapportere problemer eller gi tilbakemelding.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Type */}
          <div className="space-y-3">
            <Label>Type</Label>
            <RadioGroup value={type} onValueChange={(v) => setType(v as SupportTicketType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bug" id="type-bug" />
                <Label htmlFor="type-bug" className="font-normal cursor-pointer">
                  Bug / noe funker ikke
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="suggestion" id="type-suggestion" />
                <Label htmlFor="type-suggestion" className="font-normal cursor-pointer">
                  Forslag til forbedring
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="content" id="type-content" />
                <Label htmlFor="type-content" className="font-normal cursor-pointer">
                  Innhold / tekst / bilder
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="type-other" />
                <Label htmlFor="type-other" className="font-normal cursor-pointer">
                  Annet
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Action text */}
          <div className="space-y-2">
            <Label htmlFor="action-text">Hva prøvde du å gjøre?</Label>
            <Textarea
              id="action-text"
              value={actionText}
              onChange={(e) => setActionText(e.target.value)}
              placeholder="Beskriv kort hva du prøvde å gjøre..."
              rows={3}
              required
            />
          </div>

          {/* Result text */}
          <div className="space-y-2">
            <Label htmlFor="result-text">Hva skjedde i stedet?</Label>
            <Textarea
              id="result-text"
              value={resultText}
              onChange={(e) => setResultText(e.target.value)}
              placeholder="Beskriv hva som faktisk skjedde..."
              rows={3}
              required
            />
          </div>

          {/* Severity */}
          <div className="space-y-3">
            <Label>Alvorlighet</Label>
            <RadioGroup value={severity} onValueChange={(v) => setSeverity(v as SupportTicketSeverity)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="low" id="severity-low" />
                <Label htmlFor="severity-low" className="font-normal cursor-pointer">
                  Irriterende
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medium" id="severity-medium" />
                <Label htmlFor="severity-medium" className="font-normal cursor-pointer">
                  Stopper meg
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="high" id="severity-high" />
                <Label htmlFor="severity-high" className="font-normal cursor-pointer">
                  Kritisk (får ikke brukt siden)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Screenshot */}
          <div className="space-y-2">
            <Label htmlFor="screenshot">Skjermbilde (valgfritt)</Label>
            <div className="flex items-center gap-4">
              <Input
                id="screenshot"
                type="file"
                accept="image/*"
                onChange={handleScreenshotChange}
                className="flex-1"
              />
              {screenshotPreview && (
                <div className="relative">
                  <img
                    src={screenshotPreview}
                    alt="Forhåndsvisning"
                    className="h-20 w-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setScreenshot(null);
                      setScreenshotPreview(null);
                    }}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Debug info checkbox */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="debug-info"
              checked={includeDebugInfo}
              onCheckedChange={(checked) => setIncludeDebugInfo(checked === true)}
            />
            <div className="space-y-1">
              <Label htmlFor="debug-info" className="font-normal cursor-pointer">
                Legg ved teknisk informasjon (anbefales)
              </Label>
              <p className="text-sm text-muted-foreground">
                Dette hjelper oss å finne feilen raskere. Vi sender ikke passord eller private data.
              </p>
            </div>
          </div>

          {/* Submit button */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Avbryt
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sender...' : 'Send melding'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
