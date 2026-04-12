import { useState } from "react";
import { toast } from "sonner";
import { Send, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useCreateFeedPost } from "@/hooks/useCreateFeedPost";
import { useAuth } from "@/hooks/useAuth";
import heroCar from "@/assets/hero-car.jpg";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export function HomeFeedComposer() {
  const { user } = useAuth();
  const { data: profile } = useMyPersonProfile();
  const [body, setBody] = useState("");
  const [focused, setFocused] = useState(false);
  const { mutateAsync, isPending } = useCreateFeedPost();

  if (!user) {
    return (
      <div className="relative rounded-xl border border-white/[0.12] overflow-hidden">
        {/* Background image with heavy overlay */}
        <div className="absolute inset-0">
          <img src={heroCar} alt="" className="w-full h-full object-cover object-[50%_35%]" style={{ opacity: 0.12, filter: 'blur(1px) saturate(0.6)' }} />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(20,26,34,0.92) 0%, rgba(28,37,48,0.88) 100%)' }} />
        </div>
        <div className="relative px-5 py-8 sm:px-8 sm:py-12 text-center">
          <p className="text-[0.9rem] sm:text-[1.2rem] uppercase tracking-[0.06em] font-bold text-white/60 leading-snug" style={chakra}>
            Del bilhistorier, oppdateringer<br className="hidden sm:block" /> og nyheter med fellesskapet
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 mt-4 sm:mt-5 px-7 sm:px-8 py-3 sm:py-3.5 text-[12px] sm:text-[13px] uppercase tracking-[0.15em] font-bold text-[#0a0f14] rounded-lg transition-all hover:scale-[1.03] hover:brightness-110"
            style={{ ...chakra, background: 'linear-gradient(135deg, #34eab8 0%, #2dd4a8 40%, #1cb896 100%)', boxShadow: '0 0 28px rgba(45,212,168,0.35), 0 4px 12px rgba(0,0,0,0.3)' }}
          >
            Logg inn for å starte
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
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
    <div className="rounded-xl border border-white/[0.12] bg-white/[0.05] p-4 sm:p-6 transition-all duration-300 hover:bg-white/[0.07] hover:border-white/[0.18] focus-within:border-[#34eab8]/30 focus-within:bg-white/[0.07] focus-within:shadow-[0_4px_24px_rgba(45,212,168,0.08)]">
      <div className="flex items-start gap-4">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-[#2dd4a8]/20 flex-shrink-0 mt-0.5" />
        ) : (
          <div className="w-11 h-11 rounded-full bg-[#2dd4a8]/10 flex items-center justify-center flex-shrink-0 mt-0.5 ring-2 ring-[#2dd4a8]/20">
            <span className="text-[14px] font-bold text-[#2dd4a8]" style={chakra}>
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
            className="w-full bg-transparent text-white placeholder:text-white/30 text-[15px] sm:text-[16px] tracking-wide resize-none focus:outline-none leading-relaxed transition-all duration-200 py-2"
          />
        </div>
      </div>
      {focused && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
          <span className="text-[11px] text-[#2dd4a8] uppercase tracking-[0.1em] font-bold" style={chakra}>
            {profile?.display_name}
          </span>
          <button
            onClick={handleSubmit}
            disabled={isPending || !body.trim()}
            className="flex items-center gap-2 px-6 py-2.5 text-[#0c1117] text-[12px] uppercase tracking-[0.15em] font-bold rounded-lg transition-all disabled:opacity-25 hover:brightness-110 shadow-[0_0_20px_rgba(45,212,168,0.3)]"
            style={{ ...chakra, background: 'linear-gradient(135deg, #34eab8, #2dd4a8)' }}
          >
            <Send className="w-3.5 h-3.5" />
            {isPending ? "Publiserer…" : "Publiser"}
          </button>
        </div>
      )}
    </div>
  );
}
