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
  variant?: "dark" | "light";
}

export function CommentComposer({
  carId, eventId, marketplaceItemId, feedPostId,
  parentId, placeholder = "Skriv en kommentar…",
  onSuccess, onCancel, autoFocus = false, variant = "dark",
}: Props) {
  const { user } = useAuth();
  const { data: profile } = useMyPersonProfile();
  const [body, setBody] = useState("");
  const { mutateAsync, isPending } = useCreateComment();
  const light = variant === "light";

  if (!user) {
    return (
      <div className="flex items-center justify-between py-4">
        <p className={`text-[13px] ${light ? "text-neutral-400" : "text-white/30"}`}>Logg inn for å kommentere</p>
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
        <img src={profile.avatar_url} alt="" className={`w-7 h-7 rounded-full object-cover ring-1 flex-shrink-0 mt-1 ${light ? "ring-neutral-200" : "ring-white/[0.08]"}`} />
      ) : (
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${light ? "bg-neutral-200" : "bg-white/[0.06]"}`}>
          <span className={`text-[11px] ${light ? "text-neutral-500" : "text-white/40"}`} style={{ fontFamily: "'Oswald', sans-serif" }}>
            {profile?.display_name?.[0] ?? "?"}
          </span>
        </div>
      )}
      <div className="flex-1">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={placeholder}
          rows={3}
          autoFocus={autoFocus}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
            if (e.key === "Escape") onCancel?.();
          }}
          className={`w-full rounded-lg border px-3.5 py-3 resize-none focus:outline-none transition-all leading-relaxed text-[15px] ${
            light
              ? "bg-white border-neutral-200 focus:border-neutral-400 text-neutral-900 placeholder:text-neutral-400"
              : "bg-white/[0.025] border-white/[0.07] hover:border-white/[0.10] focus:border-[#34eab8]/40 text-white placeholder:text-white/35"
          }`}
        />
        <div className="flex items-center justify-between mt-2">
          <span className={`text-[10px] ${light ? "text-neutral-300" : "text-white/15"}`}>⌘↵</span>
          <div className="flex items-center gap-3">
            {onCancel && (
              <button onClick={onCancel} className={`text-[11px] transition-colors ${light ? "text-neutral-400 hover:text-neutral-600" : "text-white/25 hover:text-white/50"}`}>
                Avbryt
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={isPending || !body.trim()}
              className={`flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold transition-colors disabled:opacity-20 ${
                light ? "text-neutral-500 hover:text-neutral-800" : "text-white/50 hover:text-white"
              }`}
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
