import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Camera,
  Flag,
  Car,
  Footprints,
  Users,
  ChevronDown,
  Image as ImageIcon,
  StickyNote,
} from "lucide-react";
import { useActivitySession } from "@/hooks/useActivitySession";
import { useActivityMoments } from "@/hooks/useActivityMoments";
import { AddMomentDialog } from "@/components/activity/AddMomentDialog";
import { StopSessionDialog } from "@/components/activity/StopSessionDialog";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

const META = {
  drive: { label: "Kjøretur", Icon: Car, verb: "Du kjører" },
  walk_spotting: { label: "Spotting", Icon: Footprints, verb: "Du spotter biler" },
  meetup: { label: "Treff", Icon: Users, verb: "Du er på treff" },
} as const;

const MINIMIZED_KEY = "activity_focus_minimized_v1";

function formatDuration(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0) return `${h}t ${m.toString().padStart(2, "0")}m`;
  return `${m}m`;
}

/**
 * Dedicated full-page focus view for an active activity session.
 * Locks scroll and renders fullscreen so the user is fully immersed
 * in their trip/spotting. The "minimize" action takes them back to
 * the previous browsing context (a small pill stays via FocusModeOverlay).
 */
export default function AktivTur() {
  const { activeSession, elapsedMinutes } = useActivitySession();
  const { moments } = useActivityMoments(activeSession?.id);
  const navigate = useNavigate();

  const [stopOpen, setStopOpen] = useState(false);
  const [momentOpen, setMomentOpen] = useState(false);

  // Mark as not minimized whenever the user is on this page.
  useEffect(() => {
    try {
      window.localStorage.setItem(MINIMIZED_KEY, "0");
    } catch {
      /* ignore */
    }
  }, []);

  // Hard scroll lock — html + body + prevent touchmove on background.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevHtmlOverscroll = (html.style as CSSStyleDeclaration).overscrollBehavior;
    const prevBodyOverscroll = (body.style as CSSStyleDeclaration).overscrollBehavior;

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    (html.style as CSSStyleDeclaration).overscrollBehavior = "none";
    (body.style as CSSStyleDeclaration).overscrollBehavior = "none";

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      (html.style as CSSStyleDeclaration).overscrollBehavior = prevHtmlOverscroll;
      (body.style as CSSStyleDeclaration).overscrollBehavior = prevBodyOverscroll;
    };
  }, []);

  // If there is no session, this page has no purpose — bounce home.
  if (!activeSession) {
    return <Navigate to="/" replace />;
  }

  const meta = META[activeSession.type];
  const Icon = meta.Icon;

  const handleMinimize = () => {
    try {
      window.localStorage.setItem(MINIMIZED_KEY, "1");
    } catch {
      /* ignore */
    }
    navigate(-1);
  };

  const latestMoments = moments.slice(0, 3);

  return (
    <>
      <div
        className="fixed inset-0 z-[60] flex flex-col text-white overflow-hidden touch-none"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 0%, rgba(52,234,184,0.18) 0%, rgba(8,12,17,0.95) 45%, #050709 100%)",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          overscrollBehavior: "none",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`${meta.label} pågår`}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <button
            type="button"
            onClick={handleMinimize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/10 hover:bg-white/[0.1] transition-colors"
            aria-label="Minimer fokusmodus"
          >
            <ChevronDown className="w-4 h-4 text-white/70" />
            <span
              className="text-[10px] uppercase tracking-[0.14em] font-bold text-white/70"
              style={chakra}
            >
              Minimer
            </span>
          </button>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34eab8] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34eab8]" />
            </span>
            <span
              className="text-[10px] uppercase tracking-[0.18em] font-bold text-[#34eab8]"
              style={chakra}
            >
              Live
            </span>
          </div>
        </div>

        {/* Hero status */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(52,234,184,0.25) 0%, rgba(28,184,150,0.1) 100%)",
              boxShadow:
                "0 0 40px rgba(52,234,184,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
              border: "1px solid rgba(52,234,184,0.4)",
            }}
          >
            <Icon className="w-9 h-9 text-[#34eab8]" />
          </div>

          <div
            className="text-[11px] uppercase tracking-[0.22em] text-white/40 font-bold mb-2"
            style={chakra}
          >
            {meta.verb}
          </div>
          <h1
            className="text-[44px] sm:text-[56px] leading-none font-black tracking-tight mb-6"
            style={chakra}
          >
            {meta.label}
          </h1>

          <div
            className="text-[64px] sm:text-[80px] leading-none font-black tabular-nums tracking-tight"
            style={{
              ...chakra,
              background:
                "linear-gradient(180deg, #ffffff 0%, rgba(255,255,255,0.55) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {formatDuration(elapsedMinutes)}
          </div>
          <div
            className="mt-2 text-[11px] uppercase tracking-[0.2em] text-white/40 font-bold"
            style={chakra}
          >
            Varighet
          </div>

          <div className="grid grid-cols-2 gap-3 w-full max-w-[320px] mt-8">
            <StatTile
              icon={<ImageIcon className="w-4 h-4" />}
              label="Øyeblikk"
              value={String(moments.length)}
            />
            <StatTile
              icon={<StickyNote className="w-4 h-4" />}
              label="Notater"
              value={String(moments.filter((m) => m.data?.note).length)}
            />
          </div>

          {latestMoments.length > 0 && (
            <div className="w-full max-w-[320px] mt-6">
              <div
                className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-bold mb-2 text-left"
                style={chakra}
              >
                Siste øyeblikk
              </div>
              <div className="flex gap-2">
                {latestMoments.map((m) => {
                  const img = m.data?.image_url;
                  return (
                    <div
                      key={m.id}
                      className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-white/[0.04] flex items-center justify-center flex-shrink-0"
                    >
                      {img ? (
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <StickyNote className="w-5 h-5 text-white/30" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Bottom action dock */}
        <div
          className="px-4 pb-4 pt-2"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}
        >
          <div className="flex items-center justify-center gap-4 max-w-[480px] mx-auto">
            <button
              type="button"
              onClick={() => setMomentOpen(true)}
              className="flex-1 h-14 rounded-xl text-[#070b10] text-[12px] uppercase tracking-[0.14em] font-bold hover:scale-[1.01] active:scale-[0.99] transition-transform inline-flex items-center justify-center gap-2"
              style={{
                ...chakra,
                background:
                  "linear-gradient(135deg, #34eab8 0%, #2ab89a 60%, #1cb896 100%)",
                boxShadow:
                  "0 0 24px rgba(52,234,184,0.4), 0 6px 18px rgba(0,0,0,0.4)",
              }}
            >
              <Camera className="w-4 h-4" />
              Legg til øyeblikk
            </button>

            <button
              type="button"
              onClick={() => setStopOpen(true)}
              className="flex-1 h-14 rounded-xl text-[#070b10] text-[12px] uppercase tracking-[0.14em] font-bold hover:scale-[1.01] active:scale-[0.99] transition-transform inline-flex items-center justify-center gap-2"
              style={{
                ...chakra,
                background: "linear-gradient(135deg, #ff7a7a 0%, #e84a4a 100%)",
                boxShadow: "0 6px 18px rgba(232,74,74,0.35)",
              }}
            >
              <Flag className="w-4 h-4" />
              Avslutt
            </button>
          </div>
          <p
            className="text-center mt-3 text-[10px] uppercase tracking-[0.16em] text-white/30"
            style={oswald}
          >
            Trykk Minimer for å bruke appen mens turen pågår
          </p>
        </div>
      </div>

      <AddMomentDialog
        sessionId={activeSession.id}
        open={momentOpen}
        onOpenChange={setMomentOpen}
      />
      <StopSessionDialog
        open={stopOpen}
        onOpenChange={setStopOpen}
        onStopped={() => navigate("/turer", { replace: true })}
      />
    </>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="rounded-xl p-3 border border-white/[0.08] flex items-center gap-3"
      style={{ background: "rgba(255,255,255,0.03)" }}
    >
      <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/[0.05] text-[#34eab8]">
        {icon}
      </div>
      <div className="text-left">
        <div
          className="text-[9px] uppercase tracking-[0.16em] text-white/40 font-bold"
          style={chakra}
        >
          {label}
        </div>
        <div className="text-[20px] font-black text-white leading-none mt-0.5" style={chakra}>
          {value}
        </div>
      </div>
    </div>
  );
}
