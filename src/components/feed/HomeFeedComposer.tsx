import { useState } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Link } from "react-router-dom";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useCreateFeedPost } from "@/hooks/useCreateFeedPost";
import { useAuth } from "@/hooks/useAuth";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export function HomeFeedComposer() {
  const { user } = useAuth();
  const { data: profile } = useMyPersonProfile();
  const [body, setBody] = useState("");
  const [focused, setFocused] = useState(false);
  const { mutateAsync, isPending } = useCreateFeedPost();

  if (!user) {
    return (
      <div className="rounded-xl border border-[#c4962c]/15 bg-gradient-to-br from-[#f0e8da] to-[#ebe3d6] px-6 py-8 sm:py-10 text-center">
        <p className="text-[1rem] sm:text-[1.15rem] uppercase tracking-[0.06em] font-bold text-[#3a2e24]/60 leading-snug" style={chakra}>
          Del bilhistorier, oppdateringer<br className="hidden sm:block" /> og nyheter med fellesskapet
        </p>
        <Link
          to="/login"
          className="inline-block mt-4 px-6 py-2.5 text-[12px] uppercase tracking-[0.15em] font-bold text-[#0f0d0b] rounded-lg transition-all hover:brightness-110"
          style={{ ...chakra, background: 'linear-gradient(135deg, #d4a017, #e8c547, #c4962c)' }}
        >
          Logg inn for å starte
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
    <div className="rounded-xl border border-[#c4962c]/15 bg-gradient-to-br from-[#f0e8da] to-[#ebe3d6] p-5 sm:p-6 transition-all focus-within:border-[#c4962c]/30 focus-within:shadow-[0_4px_24px_rgba(196,150,44,0.1)]">
      <div className="flex items-start gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-[#c4962c]/20 flex-shrink-0 mt-0.5" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#c4962c]/10 flex items-center justify-center flex-shrink-0 mt-0.5 ring-2 ring-[#c4962c]/20">
            <span className="text-[14px] font-bold text-[#8b6914]" style={chakra}>
              {profile?.display_name?.[0] ?? "?"}
            </span>
          </div>
        )}
        <div className="flex-1">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Del en oppdatering med garasjen…"
            rows={focused ? 3 : 1}
            style={chakra}
            className="w-full bg-transparent text-[#3a2e24] placeholder:text-[#3a2e24]/35 text-[15px] sm:text-[16px] tracking-wide resize-none focus:outline-none leading-relaxed transition-all duration-200 py-2"
          />
        </div>
      </div>
      {focused && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#3a2e24]/[0.06]">
          <span className="text-[11px] text-[#8b6914] uppercase tracking-[0.1em] font-bold" style={chakra}>
            {profile?.display_name}
          </span>
          <button
            onClick={handleSubmit}
            disabled={isPending || !body.trim()}
            className="flex items-center gap-2 px-6 py-2.5 text-[#0f0d0b] text-[12px] uppercase tracking-[0.15em] font-bold rounded-lg transition-all disabled:opacity-25 hover:brightness-110"
            style={{ ...chakra, background: 'linear-gradient(135deg, #d4a017, #e8c547, #c4962c)' }}
          >
            <Send className="w-3.5 h-3.5" />
            {isPending ? "Publiserer…" : "Publiser"}
          </button>
        </div>
      )}
    </div>
  );
}
