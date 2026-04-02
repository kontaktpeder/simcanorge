import { useState } from "react";
import { Send, X, Share2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useCreateFeedPost, type CreateFeedPostInput } from "@/hooks/useCreateFeedPost";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";

interface Props {
  postType?: string;
  carId?: string;
  marketplaceItemId?: string;
  eventId?: string;
  snapshotTitle?: string;
  snapshotImageUrl?: string;
  snapshotEntityType?: string;
  compact?: boolean;
  onClose?: () => void;
}

export function PostComposer({
  postType = "manual",
  carId,
  marketplaceItemId,
  eventId,
  snapshotTitle,
  snapshotImageUrl,
  snapshotEntityType,
  compact = false,
  onClose,
}: Props) {
  const [open, setOpen] = useState(!compact);
  const [body, setBody] = useState("");
  const { data: profile } = useMyPersonProfile();
  const { mutateAsync, isPending } = useCreateFeedPost();

  async function handleSubmit() {
    if (!body.trim() && postType === "manual" && !carId && !eventId && !marketplaceItemId) {
      toast.error("Skriv noe først");
      return;
    }
    try {
      const input: CreateFeedPostInput = {
        post_type: postType,
        body: body || undefined,
        car_id: carId,
        marketplace_item_id: marketplaceItemId,
        event_id: eventId,
        snapshot_title: snapshotTitle,
        snapshot_image_url: snapshotImageUrl,
        snapshot_entity_type: snapshotEntityType,
      };
      await mutateAsync(input);
      toast.success("Publisert!");
      setBody("");
      setOpen(false);
      onClose?.();
    } catch {
      toast.error("Noe gikk galt");
    }
  }

  if (!profile) return null;

  if (compact && !open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3.5 px-4 py-3.5 border border-white/[0.10] hover:border-white/25 bg-[#161616] hover:bg-[#1b1b1b] transition-all group"
      >
        <div className="w-9 h-9 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0">
          <Share2 className="w-4 h-4 text-white/40 group-hover:text-white/70 transition-colors" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-[13px] text-white/50 group-hover:text-white/70 font-medium font-sans transition-colors">
            Del oppdatering til feed
          </p>
          <p className="text-[11px] text-white/25 font-sans">
            Vis dette til resten av bilsamfunnet
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors flex-shrink-0" />
      </button>
    );
  }

  const isLinked = !!(carId || marketplaceItemId || eventId);

  return (
    <div className="border border-white/[0.08] rounded-sm bg-[#1c1916]/60 p-4">
      {isLinked && snapshotTitle && (
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-white/[0.05]">
          {snapshotImageUrl && (
            <img src={snapshotImageUrl} alt="" className="w-12 h-12 rounded object-cover" />
          )}
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#a89880]/50">
              {snapshotEntityType === "car" && "Bil"}
              {snapshotEntityType === "marketplace" && "Markedsplass"}
              {snapshotEntityType === "event" && "Arrangement"}
            </p>
            <p className="text-[13px] text-white/70 font-medium">{snapshotTitle}</p>
          </div>
        </div>
      )}

      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={isLinked ? "Legg til en kommentar (valgfritt)…" : "Hva skjer i garasjen?"}
        rows={3}
        className="w-full bg-transparent text-white/70 placeholder:text-white/20 text-[14px] font-sans resize-none focus:outline-none leading-relaxed"
        autoFocus
      />
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/[0.05]">
        <span className="text-[10px] text-white/20 font-sans">
          {profile.display_name}
        </span>
        <div className="flex items-center gap-2">
          {compact && (
            <button
              onClick={() => { setOpen(false); onClose?.(); }}
              className="p-1.5 text-white/20 hover:text-white/50 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2 bg-white text-[#0a0a0a] text-[11px] uppercase tracking-[0.15em] font-semibold font-sans hover:bg-white/90 transition-colors disabled:opacity-40"
          >
            <Send className="w-3 h-3" />
            {isPending ? "Publiserer…" : "Publiser"}
          </button>
        </div>
      </div>
    </div>
  );
}
