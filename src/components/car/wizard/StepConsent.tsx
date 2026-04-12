import { Link } from "react-router-dom";
import { Send, Users, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { WizardData } from "./WizardTypes";

interface StepConsentProps {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

export function StepConsent({ data, onChange, onBack, onSubmit, isSubmitting, errors }: StepConsentProps) {
  const { data: clubs } = useQuery({
    queryKey: ["public-clubs-for-wizard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pages")
        .select("id, title, slug")
        .eq("page_type", "club")
        .eq("is_public", true)
        .eq("status", "active")
        .order("title");
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl text-foreground">Nesten ferdig!</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Godkjenn og send inn bilen din.
        </p>
      </div>

      {/* Consents */}
      <div className="space-y-2 p-3 bg-muted/30 rounded-xl border border-muted">
        <p className="font-display text-sm mb-1">GODKJENNING FOR REDIGERING *</p>
        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <input type="radio" name="w-edits" checked={data.allowEdits === true}
            onChange={() => onChange({ allowEdits: true })} className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
          <span className="text-sm font-medium">Ja, dere kan redigere og forbedre.</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <input type="radio" name="w-edits" checked={data.allowEdits === false}
            onChange={() => onChange({ allowEdits: false })} className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
          <span className="text-sm font-medium">Nei, publiser som den er.</span>
        </label>
        {errors.allowEdits && <p className="text-xs text-destructive">{errors.allowEdits}</p>}
      </div>

      {/* Club */}
      <div className="p-3 bg-muted/30 rounded-xl border border-muted space-y-2">
        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
          <input type="checkbox" checked={data.clubLinkRequested}
            onChange={e => onChange({ clubLinkRequested: e.target.checked, ...(!e.target.checked && { clubPageId: "", clubMessage: "" }) })}
            className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
          <span className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Knytt bilen til en klubb</span>
        </label>
        {data.clubLinkRequested && (
          <div className="pl-8 space-y-2">
            <select value={data.clubPageId} onChange={e => onChange({ clubPageId: e.target.value })}
              className={`w-full h-10 px-3 text-sm rounded-md border-2 bg-background ${errors.club_page ? "border-destructive" : "border-muted"}`}>
              <option value="">Velg klubb…</option>
              {clubs?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {errors.club_page && <p className="text-xs text-destructive">{errors.club_page}</p>}
            <Textarea value={data.clubMessage} onChange={e => onChange({ clubMessage: e.target.value })}
              placeholder="Melding til klubben (valgfritt)" maxLength={2000} rows={2} className="text-sm" />
          </div>
        )}
      </div>

      {/* Instagram + Privacy */}
      <div className="p-3 bg-muted/30 rounded-xl border border-muted space-y-2">
        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
          <input type="checkbox" checked={data.allowInstagram}
            onChange={e => onChange({ allowInstagram: e.target.checked })}
            className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
          <span className="text-sm font-medium">
            Godkjenn deling på{" "}
            <a href="https://www.instagram.com/simcanorge/" target="_blank" rel="noopener noreferrer"
              className="text-primary underline hover:text-accent">Instagram</a>
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <input type="checkbox" checked={data.privacyAccepted}
            onChange={e => onChange({ privacyAccepted: e.target.checked })}
            className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
          <span className="text-sm font-medium">
            Jeg har lest og godtar{" "}
            <Link to="/personvern" target="_blank" rel="noopener noreferrer"
              className="text-primary underline hover:text-accent">
              personvernerklæringen
            </Link> *
          </span>
        </label>
        {errors.privacyAccepted && <p className="text-xs text-destructive pl-8">{errors.privacyAccepted}</p>}
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack}
          className="px-6 py-3 rounded-lg font-display text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          ← Tilbake
        </button>
        <Button type="button" onClick={onSubmit}
          disabled={isSubmitting || data.allowEdits === null || !data.privacyAccepted}
          className="btn-enamel-blue text-base h-12 px-8 disabled:opacity-40">
          {isSubmitting ? "Sender…" : <><Send className="w-5 h-5 mr-2" /> Send inn</>}
        </Button>
      </div>
    </div>
  );
}
