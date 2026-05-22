import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { FEATURES } from "@/config/features";
import { KnowledgeChipGrid } from "./KnowledgeChipGrid";
import { AddObservationSheet } from "./AddObservationSheet";
import { OwnerKnowledgeFlow } from "./flows/OwnerKnowledgeFlow";
import { StoryKnowledgeFlow } from "./flows/StoryKnowledgeFlow";
import { IdentifyKnowledgeFlow } from "./flows/IdentifyKnowledgeFlow";
import type { ContributionKind } from "@/lib/contributionKinds";
import type { RelationshipRequestSource } from "@/hooks/useCreateCarRelationshipRequest";

type Step = "menu" | ContributionKind;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  carTitle?: string;
  carSlug?: string | null;
  source?: RelationshipRequestSource;
  sourceEventId?: string | null;
}

export function CarKnowledgeDialog({
  open,
  onOpenChange,
  carId,
  carTitle,
  carSlug,
  source = "bil_detalj",
  sourceEventId = null,
}: Props) {
  const [step, setStep] = useState<Step>("menu");
  const [obsOpen, setObsOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      // reset shortly after close
      const t = window.setTimeout(() => setStep("menu"), 200);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  if (!FEATURES.knowledgeHubV1) return null;

  const handleSelect = (kind: ContributionKind) => {
    if (kind === "observation") {
      onOpenChange(false);
      setTimeout(() => setObsOpen(true), 150);
      return;
    }
    setStep(kind);
  };

  const close = () => onOpenChange(false);

  const titleByStep: Record<Step, string> = {
    menu: "Hva vet du om bilen?",
    observation: "Legg til et bilde",
    identification: "Vet du hvilken modell?",
    story: "Kjenner du historien?",
    ownership: "Din relasjon til bilen",
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {step !== "menu" && (
                <button
                  type="button"
                  onClick={() => setStep("menu")}
                  className="p-1 -ml-1 rounded hover:bg-muted/60"
                  aria-label="Tilbake"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <DialogTitle className="font-display text-xl">
                {titleByStep[step]}
              </DialogTitle>
            </div>
            {step === "menu" && (
              <DialogDescription>
                Du legger til det du vet — ingenting endres med en gang.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="mt-3">
            {step === "menu" && <KnowledgeChipGrid onSelect={handleSelect} />}
            {step === "identification" && (
              <IdentifyKnowledgeFlow carId={carId} onDone={close} />
            )}
            {step === "story" && (
              <StoryKnowledgeFlow carId={carId} source={source} sourceEventId={sourceEventId} onDone={close} />
            )}
            {step === "ownership" && (
              <OwnerKnowledgeFlow carId={carId} source={source} sourceEventId={sourceEventId} onDone={close} />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AddObservationSheet
        open={obsOpen}
        onOpenChange={setObsOpen}
        carId={carId}
        carSlug={carSlug ?? null}
      />
    </>
  );
}
