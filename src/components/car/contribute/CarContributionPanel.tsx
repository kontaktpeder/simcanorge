import { Link } from "react-router-dom";
import { Camera, Car, FileEdit, Pencil, PenLine, Wrench } from "lucide-react";
import type { CarPageAudience, ContributionActionId } from "@/lib/carPageAudience";
import { CAR_PAGE_AUDIENCE_CONFIG } from "@/lib/carPageAudience";

const inter = { fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" } as const;

const ACTION_META: Record<
  ContributionActionId,
  { label: string; icon: React.ReactNode }
> = {
  photos: { label: "Legg til bilder", icon: <Camera className="w-5 h-5" strokeWidth={1.75} /> },
  model: { label: "Vet du modell?", icon: <Wrench className="w-5 h-5" strokeWidth={1.75} /> },
  story: { label: "Del historie", icon: <PenLine className="w-5 h-5" strokeWidth={1.75} /> },
  claim: { label: "Dette er min bil", icon: <Car className="w-5 h-5" strokeWidth={1.75} /> },
  correction: { label: "Foreslå endring", icon: <FileEdit className="w-5 h-5" strokeWidth={1.75} /> },
  edit: { label: "Rediger informasjon", icon: <Pencil className="w-5 h-5" strokeWidth={1.75} /> },
  post: { label: "Publiser innlegg", icon: <PenLine className="w-5 h-5" strokeWidth={1.75} /> },
};

type Props = {
  audience: CarPageAudience;
  stewardName?: string | null;
  carId: string;
  onAction: (action: ContributionActionId) => void;
};

export function CarContributionPanel({ audience, stewardName, carId, onAction }: Props) {
  const cfg = CAR_PAGE_AUDIENCE_CONFIG[audience];
  const contextLine =
    audience === "stewarded" && stewardName
      ? `Denne bilen forvaltes av ${stewardName}.`
      : cfg.contextLine;

  return (
    <section className="px-4 py-6 sm:py-8 flex justify-center">
      <div
        className="w-full max-w-xl rounded-2xl border border-black/10 bg-white p-5 sm:p-6 shadow-sm"
        style={inter}
      >
        {contextLine && (
          <p className="text-[13px] sm:text-sm text-neutral-600 mb-1.5">{contextLine}</p>
        )}
        <h2 className="text-[18px] sm:text-[20px] font-bold text-neutral-900 mb-4">
          {cfg.sectionTitle}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {cfg.actions.map((id) => {
            const meta = ACTION_META[id];
            const baseCls =
              "flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-left text-[14px] font-medium text-neutral-900 hover:bg-neutral-50 transition";

            if (id === "edit") {
              return (
                <Link key={id} to={`/dashboard/bil/${carId}`} className={baseCls}>
                  <span className="text-neutral-700">{meta.icon}</span>
                  <span>{meta.label}</span>
                </Link>
              );
            }
            return (
              <button
                key={id}
                type="button"
                onClick={() => onAction(id)}
                className={baseCls}
              >
                <span className="text-neutral-700">{meta.icon}</span>
                <span>{meta.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
