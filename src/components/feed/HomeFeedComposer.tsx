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
      <div className="flex items-center gap-3 px-4 py-3 border border-white/[0.06] rounded-sm">
        <div className="flex-1">
          <p className="text-xs text-white/20">Hva skjer i garasjen din?</p>
        </div>
        <Link
          to="/login"
          className="text-[11px] uppercase tracking-[0.15em] text-white/40 hover:text-white/70 transition-colors"
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
    <div className="border border-white/[0.06] rounded-sm bg-[#1c1916]/40">
      <div className="flex items-start gap-3 px-4 py-3">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-[10px] text-white/30">
              {profile?.display_name?.[0] ?? "?"}
            </span>
          </div>
        )}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Hva skjer i garasjen?"
          rows={focused ? 3 : 1}
          className="flex-1 bg-transparent text-white/70 placeholder:text-white/20 text-[14px] font-sans resize-none focus:outline-none leading-relaxed transition-all duration-200"
        />
      </div>
      {focused && (
        <div className="px-4 pb-4 flex justify-end border-t border-white/[0.04] pt-3">
          <button
            onClick={handleSubmit}
            disabled={isPending || !body.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-white text-[#0a0a0a] text-[11px] uppercase tracking-[0.15em] font-semibold font-sans hover:bg-white/90 transition-colors disabled:opacity-30"
          >
            <Send className="w-3 h-3" />
            {isPending ? "Publiserer…" : "Del"}
          </button>
        </div>
      )}
    </div>
  );
}
