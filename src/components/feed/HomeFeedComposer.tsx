import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useCreateFeedPost } from "@/hooks/useCreateFeedPost";
import { useAuth } from "@/hooks/useAuth";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

export function HomeFeedComposer() {
  const { user } = useAuth();
  const { data: profile } = useMyPersonProfile();
  const [body, setBody] = useState("");
  const [focused, setFocused] = useState(false);
  const { mutateAsync, isPending } = useCreateFeedPost();

  if (!user) {
    return (
      <div className="flex items-center justify-center py-8">
        <Link to="/login"
          className="text-[1.1rem] sm:text-[1.3rem] uppercase tracking-[0.18em] text-white/30 hover:text-white/60 transition-colors font-bold"
          style={oswald}>
          Logg inn for å dele en oppdatering →
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
    <div className="focus-within:border-[#c8102e]/30 transition-colors pb-5">
      <div className="flex items-start gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white/[0.06] flex-shrink-0 mt-1" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-white/[0.06] flex items-center justify-center flex-shrink-0 mt-1 ring-2 ring-white/[0.06]">
            <span className="text-[14px] font-bold text-white/40" style={oswald}>
              {profile?.display_name?.[0] ?? "?"}
            </span>
          </div>
        )}
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Del en oppdatering…"
            rows={focused ? 3 : 1}
            className="w-full bg-transparent text-white/80 placeholder:text-white/25 text-[16px] resize-none focus:outline-none leading-relaxed transition-all duration-200 py-2"
          />
        </div>
      </div>
      {focused && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.04]">
          <span className="text-[11px] text-white/15 uppercase tracking-[0.1em]" style={oswald}>
            {profile?.display_name}
          </span>
          <button
            onClick={handleSubmit}
            disabled={isPending || !body.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#c8102e] hover:bg-[#a00d24] text-white text-[12px] uppercase tracking-[0.15em] font-bold transition-colors disabled:opacity-25"
            style={oswald}
          >
            <Send className="w-3.5 h-3.5" />
            {isPending ? "Publiserer…" : "Publiser"}
          </button>
        </div>
      )}
    </div>
  );
}
