import { useState } from "react";
import { Link } from "react-router-dom";
import { Camera } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useCreateFeedPost } from "@/hooks/useCreateFeedPost";
import { AddMomentDialog } from "@/components/activity/AddMomentDialog";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const MAX_LEN = 500;

export function ExploreInlineComposer() {
  const { user } = useAuth();
  const { data: profile } = useMyPersonProfile();
  const { mutateAsync, isPending } = useCreateFeedPost();

  const [textMode, setTextMode] = useState(false);
  const [body, setBody] = useState("");
  const [momentOpen, setMomentOpen] = useState(false);

  async function handlePublish() {
    const t = body.trim();
    if (!t) return;
    try {
      await mutateAsync({ post_type: "manual", body: t });
      setBody("");
      setTextMode(false);
      toast.success("Publisert i Utforsk");
    } catch {
      toast.error("Noe gikk galt");
    }
  }

  function handleCancelText() {
    setBody("");
    setTextMode(false);
  }

  if (!user) {
    return (
      <Link
        to="/login?returnUrl=/hjem"
        className="flex items-center justify-between gap-2 rounded-xl border border-white/[0.10] bg-white/[0.03] px-3 py-2.5 hover:bg-white/[0.06] transition-colors"
      >
        <span className="text-[13px] text-white/45 truncate" style={chakra}>
          Hva har du sett i dag?
        </span>
        <span
          className="shrink-0 px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] font-bold text-[#2dd4a8]"
          style={chakra}
        >
          Logg inn
        </span>
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.10] bg-white/[0.03]">
      {!textMode ? (
        <div className="flex items-stretch">
          <button
            type="button"
            onClick={() => setTextMode(true)}
            className="flex-1 text-left px-3 py-2.5 hover:bg-white/[0.04] transition-colors rounded-l-xl"
          >
            <span className="text-[13px] text-white/45" style={chakra}>
              Hva har du sett i dag?
            </span>
          </button>
          <div className="w-px bg-white/[0.08]" />
          <button
            type="button"
            onClick={() => setMomentOpen(true)}
            className="shrink-0 px-3.5 hover:bg-white/[0.06] text-[#2dd4a8] transition-colors rounded-r-xl flex items-center"
            aria-label="Del øyeblikk"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="px-3 py-2.5">
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
            placeholder="Skriv en oppdatering…"
            rows={3}
            maxLength={MAX_LEN}
            className="w-full resize-none bg-transparent text-[14px] text-white placeholder:text-white/30 focus:outline-none leading-snug"
            style={chakra}
          />
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[10px] text-white/25 truncate max-w-[50%]" style={chakra}>
              {profile?.display_name ?? ""}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCancelText}
                className="px-3 py-1.5 text-[11px] uppercase tracking-[0.12em] font-bold text-white/40 hover:text-white/70"
                style={chakra}
              >
                Avbryt
              </button>
              <button
                type="button"
                onClick={() => void handlePublish()}
                disabled={isPending || !body.trim()}
                className="px-4 py-1.5 rounded-lg text-[11px] uppercase tracking-[0.12em] font-bold text-[#070b10] disabled:opacity-30 transition hover:brightness-110"
                style={{ ...chakra, background: "linear-gradient(135deg, #34eab8, #2dd4a8)" }}
              >
                {isPending ? "…" : "Publiser"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AddMomentDialog
        sessionId={null}
        open={momentOpen}
        onOpenChange={setMomentOpen}
      />
    </div>
  );
}
