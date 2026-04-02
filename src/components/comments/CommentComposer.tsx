import { useState } from "react";
import { Link } from "react-router-dom";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useCreateComment } from "@/hooks/useCreateComment";

interface Props {
  carId?: string;
  eventId?: string;
  marketplaceItemId?: string;
  feedPostId?: string;
  parentId?: string;
  placeholder?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentComposer({
  carId, eventId, marketplaceItemId, feedPostId,
  parentId, placeholder = "Skriv en kommentar…",
  onSuccess, onCancel, autoFocus = false,
}: Props) {
  const { user } = useAuth();
  const { data: profile } = useMyPersonProfile();
  const [body, setBody] = useState("");
  const { mutateAsync, isPending } = useCreateComment();

  if (!user) {
    return (
      <div className="flex items-center justify-between py-4">
        <p className="text-[13px] text-white/30">Logg inn for å kommentere</p>
        <Link
          to="/login"
          className="text-[11px] uppercase tracking-[0.15em] text-[#c8102e]/70 hover:text-[#c8102e] transition-colors font-semibold"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Logg inn
        </Link>
      </div>
    );
  }

  async function handleSubmit() {
    if (!body.trim()) return;
    try {
      await mutateAsync({ body, parentId, carId, eventId, marketplaceItemId, feedPostId });
      setBody("");
      onSuccess?.();
    } catch {
      toast.error("Noe gikk galt");
    }
  }

  return (
    <div className="flex gap-3">
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover ring-1 ring-white/[0.08] flex-shrink-0 mt-1" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-1">
          <span className="text-[11px] text-white/40" style={{ fontFamily: "'Oswald', sans-serif" }}>
            {profile?.display_name?.[0] ?? "?"}
          </span>
        </div>
      )}
      <div className="flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          rows={2}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            if (e.key === "Escape") onCancel?.();
          }}
          className="w-full bg-transparent border-b border-white/[0.08] focus:border-white/[0.20] text-white/70 placeholder:text-white/20 text-[14px] px-0 py-2 resize-none focus:outline-none transition-colors leading-relaxed"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-[10px] text-white/15">⌘↵</span>
          <div className="flex items-center gap-3">
            {onCancel && (
              <button onClick={onCancel} className="text-[11px] text-white/25 hover:text-white/50 transition-colors">
                Avbryt
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isPending || !body.trim()}
              className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold text-white/50 hover:text-white transition-colors disabled:opacity-20"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              <Send className="w-3 h-3" />
              {isPending ? "Sender…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
