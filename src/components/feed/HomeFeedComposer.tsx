import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useCreateFeedPost } from "@/hooks/useCreateFeedPost";
import { useAuth } from "@/hooks/useAuth";

export function HomeFeedComposer() {
  const { user } = useAuth();
  const { data: profile } = useMyPersonProfile();
  const [body, setBody] = useState("");
  const [focused, setFocused] = useState(false);
  const { mutateAsync, isPending } = useCreateFeedPost();

  if (!user) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border border-white/[0.08] rounded-sm bg-[#1f2327]">
        <div className="flex-1">
          <p className="text-sm text-[#b0b7bd]/50">Hva skjer i garasjen din?</p>
        </div>
        <Link
          to="/login"
          className="text-[12px] uppercase tracking-[0.12em] text-[#d4af37]/70 hover:text-[#d4af37] transition-colors font-medium"
        >
          Logg inn
        </Link>
      </div>
    );
  }

  async function handleSubmit() {
    if (!body.trim()) return;
    try {
      await mutateAsync({ post_type: "manual", body });
      setBody("");
      setFocused(false);
      toast.success("Publisert!");
    } catch {
      toast.error("Noe gikk galt");
    }
  }

  return (
    <div className="border border-white/[0.08] rounded-sm bg-[#1f2327] transition-colors duration-200 focus-within:border-[#d4af37]/30">
      <div className="flex items-start gap-3 px-4 py-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-white/[0.08] flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[11px] text-[#b0b7bd]">
              {profile?.display_name?.[0] ?? "?"}
            </span>
          </div>
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Hva tenker du på i dag? Del din historie eller spørsmål..."
          rows={focused ? 3 : 1}
          className="flex-1 bg-transparent text-white placeholder:text-[#b0b7bd]/40 text-[15px] font-sans resize-none focus:outline-none leading-relaxed transition-all duration-200"
        />
      </div>
      {focused && (
        <div className="px-4 pb-4 flex justify-end border-t border-white/[0.06] pt-3">
          <button
            onClick={handleSubmit}
            disabled={isPending || !body.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-[#d4af37] text-[#111315] text-[12px] uppercase tracking-[0.12em] font-semibold font-sans hover:bg-[#e0bf4a] transition-colors disabled:opacity-30 rounded-sm"
          >
            <Send className="w-3 h-3" />
            {isPending ? "Publiserer…" : "Del"}
          </button>
        </div>
      )}
    </div>
  );
}
