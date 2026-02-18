import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Send, ShoppingBag } from "lucide-react";
import toolboxIcon from "@/assets/toolbox-blue.png";

interface ToolboxAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addedItemTitle?: string;
  itemCount: number;
}

export function ToolboxAddModal({
  open,
  onOpenChange,
  addedItemTitle,
  itemCount,
}: ToolboxAddModalProps) {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 font-display text-xl">
            <img src={toolboxIcon} alt="" className="h-10 w-auto" />
            Lagt til i verktøykassen
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {addedItemTitle && (
            <p className="text-base text-muted-foreground">
              «{addedItemTitle}» er lagt til. Du har nå {itemCount} {itemCount === 1 ? "vare" : "varer"} i verktøykassen.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Send forespørsel til selger for å få svar på pris og tilgjengelighet –
            forespørselen havner i selgerens innboks.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              onClick={() => {
                onOpenChange(false);
                navigate("/foresporsel");
              }}
              className="flex-1 gap-2"
            >
              <Send className="h-4 w-4" />
              Send forespørsel til selger
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Fortsett å handle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
