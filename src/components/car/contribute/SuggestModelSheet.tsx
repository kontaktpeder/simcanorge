import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { IdentifyKnowledgeFlow } from "@/components/car/knowledge/flows/IdentifyKnowledgeFlow";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  carId: string;
  carSlug: string;
  onApplied?: () => void;
};

export function SuggestModelSheet({ open, onOpenChange, carId, carSlug, onApplied }: Props) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>Vet du hvilken modell?</SheetTitle>
          <SheetDescription>
            Du kan sende flere forslag over tid — fyll inn det du vet nå.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-4">
          <IdentifyKnowledgeFlow
            carId={carId}
            onDone={() => {
              onOpenChange(false);
              navigate(`/bidrag-sendt?car=${encodeURIComponent(carSlug)}&type=model`);
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
