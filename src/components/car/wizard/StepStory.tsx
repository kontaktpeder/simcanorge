import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WizardData } from "./WizardTypes";

interface StepStoryProps {
  data: WizardData;
  onChange: (patch: Partial<WizardData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepStory({ data, onChange, onNext, onBack }: StepStoryProps) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="font-display text-2xl sm:text-3xl text-foreground">Fortell historien</h2>
        <p className="text-muted-foreground text-sm sm:text-base">
          Hva gjør denne bilen spesiell? Alt fra funn i en låve til drømmeprosjektet.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="w-story" className="text-base font-display">HISTORIEN BAK BILEN</Label>
          <Textarea
            id="w-story"
            value={data.car_story}
            onChange={e => onChange({ car_story: e.target.value })}
            placeholder="Fortell oss om bilen din – hvordan du fant den, restaureringen, minner, planer…"
            className="text-base min-h-[180px] border-2 border-muted"
            maxLength={5000}
          />
          <p className="text-xs text-muted-foreground text-right">{data.car_story.length}/5000</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="w-tags" className="text-base font-display">STIKKORD</Label>
          <Input
            id="w-tags"
            value={data.tags}
            onChange={e => onChange({ tags: e.target.value })}
            placeholder="f.eks. original, veteran, rally"
            className="h-12 text-base border-2 border-muted"
          />
          <p className="text-xs text-muted-foreground">Skill med komma</p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button type="button" onClick={onBack}
          className="px-6 py-3 rounded-lg font-display text-sm uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">
          ← Tilbake
        </button>
        <button type="button" onClick={onNext}
          className="px-8 py-3 rounded-lg font-display text-base uppercase tracking-wider transition-all hover:brightness-110"
          style={{ background: "linear-gradient(135deg, #1F66B5, #2B7BD4)", color: "#fff" }}>
          {data.car_story.trim() ? "Neste →" : "Hopp over →"}
        </button>
      </div>
    </div>
  );
}
