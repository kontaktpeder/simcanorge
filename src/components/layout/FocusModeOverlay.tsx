import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Camera,
  Flag,
  Car,
  Footprints,
  Users,
  ChevronDown,
  ChevronUp,
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
 * Fullscreen focus mode shown while an activity session is active.
 * Replaces the bottom navbar with a dedicated, immersive view that
 * keeps the user's attention on the trip/spotting in progress.
 *
 * Can be minimized to a small pill so the user can browse other pages
 * (e.g. look up cars) and easily restore focus.
 */
export function FocusModeOverlay() {
  const { activeSession, elapsedMinutes } = useActivitySession();
  const { moments } = useActivityMoments(activeSession?.id);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const [minimized, setMinimized] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(MINIMIZED_KEY) === "1";
  });
  const [stopOpen, setStopOpen] = useState(false);
  const [momentOpen, setMomentOpen] = useState(false);

  // When a brand-new session starts, force fullscreen.
  useEffect(() => {
    if (!activeSession) return;
    if (elapsedMinutes <= 0) {
      setMinimized(false);
      try {
        window.localStorage.setItem(MINIMIZED_KEY, "0");
      } catch {
        /* ignore */
      }
    }
  }, [activeSession?.id, elapsedMinutes, activeSession]);

  // Lock body scroll when fullscreen is shown.
  useEffect(() => {
    if (!activeSession || minimized) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [activeSession, minimized]);

  if (!activeSession) return null;
  if (pathname.startsWith("/login") || pathname.startsWith("/registrer")) return null;

  const meta = META[activeSession.type];
  const Icon = meta.Icon;

  const persistMinimized = (v: boolean) => {
    setMinimized(v);
    try {
      window.localStorage.setItem(MINIMIZED_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const latestMoments = moments.slice(0, 3);

  return (
    <>
      {/* MINIMIZED PILL */}
      {minimized && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)" }}
          role="status"
        >
          <div
            className="flex items-center gap-2 pl-3 pr-2 py-2 rounded-full backdrop-blur-xl border"
            style={{
              background: "rgba(8,12,17,0.9)",
              borderColor: "rgba(52,234,184,0.4)",
              boxShadow:
                "0 8px 24px rgba(0,0,0,0.5), 0 0 24px rgba(52,234,184,0.2)",
            }}
          >
            <button
              type="button"
              onClick={() => persistMinimized(false)}
              className="flex items-center gap-2 pr-1"
              aria-label="Vis fokusmodus"
            >
              <span className="relative flex h-2 w-2 ml-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#34eab8] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34eab8]" />
              </span>
              <Icon className="w-3.5 h-3.5 text-[#34eab8]" />
              <span
                className="text-[11px] uppercase tracking-[0.12em] font-bold text-white/90"
                style={chakra}
              >
                {meta.label}
              </span>
              <span className="text-[11px] text-white/50 tabular-nums" style={chakra}>
                · {formatDuration(elapsedMinutes)}
                {moments.length > 0 ? ` · ${moments.length}` : ""}
              </span>
              <ChevronUp className="w-3.5 h-3.5 text-white/50 ml-0.5" />
            </button>

            <button
              type="button"
              onClick={() => setMomentOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-white/[0.08] hover:bg-white/[0.15] transition-colors"
              aria-label="Legg til øyeblikk"
            >
              <Camera className="w-3.5 h-3.5 text-white/80" />
            </button>

            <button
              type="button"
              onClick={() => setStopOpen(true)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#070b10] transition-all hover:scale-[1.05]"
              style={{
                background: "linear-gradient(135deg, #ff7a7a 0%, #e84a4a 100%)",
                boxShadow: "0 0 12px rgba(232,74,74,0.35)",
              }}
              aria-label="Avslutt aktivitet"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* FULLSCREEN FOCUS */}
      {!minimized && (
        <div
          className="fixed inset-0 z-[60] flex flex-col text-white"
          style={{
            background:
              "radial-gradient(120% 80% at 50% 0%, rgba(52,234,184,0.18) 0%, rgba(8,12,17,0.95) 45%, #050709 100%)",
            paddingTop: "env(safe-area-inset-top, 0px)",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label={`${meta.label} pågår`}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <button
              type="button"
              onClick={() => persistMinimized(true)}
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
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
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

            {/* Stats */}
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

            {/* Latest moments preview */}
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
                          // eslint-disable-next-line @next/next/no-img-element
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
            <div className="flex items-center gap-3 max-w-[480px] mx-auto">
              <button
                type="button"
                onClick={() => navigate("/biler")}
                className="flex-1 h-12 rounded-xl bg-white/[0.05] border border-white/10 text-[12px] uppercase tracking-[0.12em] font-bold text-white/70 hover:bg-white/[0.08] transition-colors"
                style={chakra}
              >
                Søk bil
              </button>

              <button
                type="button"
                onClick={() => setMomentOpen(true)}
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-[1.04] active:scale-[0.97]"
                style={{
                  background:
                    "linear-gradient(135deg, #34eab8 0%, #2ab89a 60%, #1cb896 100%)",
                  boxShadow:
                    "0 0 28px rgba(52,234,184,0.5), 0 6px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
                  border: "3px solid rgba(8,12,17,0.95)",
                }}
                aria-label="Legg til øyeblikk"
              >
                <Camera className="w-6 h-6 text-[#070b10]" />
              </button>

              <button
                type="button"
                onClick={() => setStopOpen(true)}
                className="flex-1 h-12 rounded-xl text-[#070b10] text-[12px] uppercase tracking-[0.14em] font-bold hover:scale-[1.01] active:scale-[0.99] transition-transform inline-flex items-center justify-center gap-2"
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
              Trykk Minimer for å se appen mens turen pågår
            </p>
          </div>
        </div>
      )}

      <AddMomentDialog
        sessionId={activeSession.id}
        open={momentOpen}
        onOpenChange={setMomentOpen}
      />
      <StopSessionDialog open={stopOpen} onOpenChange={setStopOpen} />
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
