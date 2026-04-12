import { useState } from "react";
import { Link } from "react-router-dom";
import { Send, Users, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { WizardData } from "./WizardTypes";

interface StepSaveProps {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errors: Record<string, string>;
}

export function StepSave({ data, onChange, onBack, onSubmit, isSubmitting, errors }: StepSaveProps) {
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
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl text-foreground">Nesten ferdig!</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Fortell oss hvem du er, så tar vi vare på bilen din.
        </p>
      </div>

      {/* Contact */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="w-name" className="text-base font-display">DITT NAVN *</Label>
          <Input id="w-name" value={data.owner_name} onChange={e => onChange({ owner_name: e.target.value })}
            placeholder="Ola Nordmann" className={`h-12 text-base border-2 ${errors.owner_name ? "border-destructive" : "border-muted"}`} />
          {errors.owner_name && <p className="text-sm text-destructive">{errors.owner_name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="w-email" className="text-base font-display">E-POST *</Label>
            <Input id="w-email" type="email" value={data.email} onChange={e => onChange({ email: e.target.value })}
              placeholder="ola@eksempel.no" className={`h-12 text-base border-2 ${errors.email ? "border-destructive" : "border-muted"}`} />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="w-phone" className="text-base font-display">TELEFON</Label>
            <Input id="w-phone" type="tel" value={data.phone} onChange={e => onChange({ phone: e.target.value })}
              placeholder="123 45 678" className="h-12 text-base border-2 border-muted" />
          </div>
        </div>
      </div>

      {/* Consents */}
      <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-muted">
        <p className="font-display text-base mb-2">GODKJENNING FOR REDIGERING *</p>
        <p className="text-xs text-muted-foreground mb-3">
          Vi kan rette skrivefeil, tydeliggjøre detaljer og legge til teknisk info.
        </p>
        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <input type="radio" name="w-edits" checked={data.allowEdits === true}
            onChange={() => onChange({ allowEdits: true })} className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
          <span className="text-sm font-medium">Ja, dere kan redigere og forbedre innsendelsen min.</span>
        </label>
        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <input type="radio" name="w-edits" checked={data.allowEdits === false}
            onChange={() => onChange({ allowEdits: false })} className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
          <span className="text-sm font-medium">Nei, publiser som den er.</span>
        </label>
      </div>

      {/* Club */}
      <div className="p-4 bg-muted/30 rounded-xl border border-muted space-y-3">
        <p className="font-display text-base flex items-center gap-2"><Users className="w-5 h-5" /> KNYTTE TIL KLUBB</p>
        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
          <input type="checkbox" checked={data.clubLinkRequested}
            onChange={e => onChange({ clubLinkRequested: e.target.checked, ...(!e.target.checked && { clubPageId: "", clubMessage: "" }) })}
            className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
          <span className="text-sm font-medium">Ja, knytt bilen til en klubb</span>
        </label>
        {data.clubLinkRequested && (
          <div className="pl-8 space-y-3">
            <select value={data.clubPageId} onChange={e => onChange({ clubPageId: e.target.value })}
              className={`w-full h-12 px-3 text-base rounded-md border-2 bg-background ${errors.club_page ? "border-destructive" : "border-muted"}`}>
              <option value="">Velg klubb…</option>
              {clubs?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
            {errors.club_page && <p className="text-xs text-destructive">{errors.club_page}</p>}
            <Textarea value={data.clubMessage} onChange={e => onChange({ clubMessage: e.target.value })}
              placeholder="Melding til klubben (valgfritt)" maxLength={2000} rows={2} />
          </div>
        )}
      </div>

      {/* Instagram */}
      <div className="p-4 bg-muted/30 rounded-xl border border-muted">
        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50">
          <input type="checkbox" checked={data.allowInstagram}
            onChange={e => onChange({ allowInstagram: e.target.checked })}
            className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0" />
          <span className="text-sm font-medium">
            Jeg godkjenner deling på{" "}
            <a href="https://www.instagram.com/simcanorge/" target="_blank" rel="noopener noreferrer"
              className="text-primary underline hover:text-accent">Instagram</a>
          </span>
        </label>
      </div>

      {/* Privacy & login info */}
      <div className="p-4 bg-muted/30 rounded-xl border border-muted space-y-3">
        <p className="font-display text-base flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" /> HVA SKJER ETTER INNSENDING?
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Du mottar en <strong>innloggingslenke på e-post</strong> til adressen du oppga.
          Åpne lenken for å logge inn og jobbe videre med bilen din – redigere,
          følge godkjenning og publisering. Du kan også gjøre det senere og
          i mellomtiden utforske resten av Bilgarasjen.
        </p>
        <label className="flex items-start gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <input
            type="checkbox"
            checked={data.privacyAccepted}
            onChange={e => onChange({ privacyAccepted: e.target.checked })}
            className="w-5 h-5 mt-0.5 accent-primary flex-shrink-0"
          />
          <span className="text-sm font-medium">
            Jeg har lest og godtar{" "}
            <Link to="/personvern" target="_blank" rel="noopener noreferrer"
              className="text-primary underline hover:text-accent">
              personvernerklæringen
            </Link>
          </span>
        </label>
        {errors.privacyAccepted && (
          <p className="text-xs text-destructive pl-8">{errors.privacyAccepted}</p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack}
          className="px-6 py-3 rounded-lg font-display text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          ← Tilbake
        </button>
        <Button type="button" onClick={onSubmit}
          disabled={isSubmitting || data.allowEdits === null || !data.owner_name.trim() || !data.email.trim() || !data.privacyAccepted}
          className="btn-enamel-blue text-lg h-14 px-8 disabled:opacity-40">
          {isSubmitting ? "Sender…" : <><Send className="w-5 h-5 mr-2" /> Send inn</>}
        </Button>
      </div>
    </div>
  );
}
