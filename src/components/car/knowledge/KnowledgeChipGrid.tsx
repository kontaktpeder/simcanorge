import { KNOWLEDGE_CHIPS, type ContributionKind } from "@/lib/contributionKinds";
import { cn } from "@/lib/utils";

interface Props {
  onSelect: (kind: ContributionKind) => void;
}

export function KnowledgeChipGrid({ onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {KNOWLEDGE_CHIPS.map((chip) => {
        const primary = chip.emphasis === "primary";
        return (
          <button
            key={chip.kind}
            type="button"
            onClick={() => onSelect(chip.kind)}
            className={cn(
              "text-left rounded-xl px-3.5 py-3 transition-colors",
              "border bg-card hover:bg-muted/40",
              primary
                ? "border-[#34eab8] shadow-[0_0_0_1px_rgba(52,234,184,0.25)]"
                : "border-border",
            )}
          >
            <div className="text-sm font-semibold text-foreground leading-tight">
              {chip.label}
            </div>
            <div className="text-[12px] text-muted-foreground mt-1 leading-snug">
              {chip.subtitle}
            </div>
          </button>
        );
      })}
    </div>
  );
}
