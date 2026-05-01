import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Warehouse, Search, Users, User, Play, Car, Footprints, Route, Home } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useFeatures } from "@/hooks/useFeatures";
import { useActivitySession, type ActivityType } from "@/hooks/useActivitySession";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;
const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

type Item = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const TYPES: { value: ActivityType; label: string; desc: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "drive", label: "Kjøretur", desc: "Du kjører en bil", Icon: Car },
  { value: "walk_spotting", label: "Spotting", desc: "Til fots, ser biler", Icon: Footprints },
  { value: "meetup", label: "Treff", desc: "Du er på et arrangement", Icon: Users },
];

function NavBtn({ item, active }: { item: Item; active: boolean }) {
  const { Icon } = item;
  return (
    <Link
      to={item.href}
      className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors group relative"
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
    >
      <span className="relative">
        <Icon
          className={`w-[22px] h-[22px] transition-all ${
            active ? "text-[#34eab8]" : "text-white/45 group-hover:text-white/75"
          }`}
        />
        {item.badge && (
          <span
            className="absolute -top-1.5 -right-3 px-1.5 py-[1px] rounded-full text-[8px] font-bold uppercase tracking-[0.08em] leading-none text-[#070b10]"
            style={{
              ...chakra,
              background: "linear-gradient(135deg,#34eab8,#2ab89a)",
              boxShadow: "0 0 8px rgba(52,234,184,0.5)",
            }}
          >
            {item.badge}
          </span>
        )}
      </span>
      <span
        className={`text-[10px] tracking-[0.08em] uppercase font-bold transition-colors ${
          active ? "text-white" : "text-white/45 group-hover:text-white/70"
        }`}
        style={chakra}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const features = useFeatures();
  const activitiesEnabled = !!features.activitySessions;
  const { activeSession, startSession, isStarting } = useActivitySession();
  const effectiveActiveSession = activitiesEnabled ? activeSession : null;
  const [pickerOpen, setPickerOpen] = useState(false);
  const visible = useHideOnScroll(10);

  // Hide entirely when no user, on auth/onboarding routes, or in focus mode (active session)
  const hidden =
    !user ||
    effectiveActiveSession ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/registrer") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding");

  if (hidden) return null;

  // Layout: Hjem · Biler · [Start] · Turer · Garasje
  const left: Item[] = [
    { href: "/", label: "Hjem", Icon: Home },
    { href: "/biler", label: "Biler", Icon: Search },
  ];
  const right: Item[] = [
    { href: "/turer", label: "Turer", Icon: Route, badge: "Ny" },
    { href: "/min-garasje", label: "Garasje", Icon: Warehouse },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const navigate = useNavigate();
  const handleStart = async (type: ActivityType) => {
    const result = await startSession(type);
    if (result) navigate("/aktiv");
    setPickerOpen(false);
  };

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t border-white/[0.06] transition-transform duration-300 ease-out will-change-transform"
        style={{
          background: "rgba(8,12,17,0.92)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: "0 -2px 20px rgba(0,0,0,0.4)",
          transform: visible || pickerOpen ? "translateY(0)" : "translateY(110%)",
        }}
        aria-label="Hovednavigasjon"
        aria-hidden={!visible && !pickerOpen}
      >
        <div className="relative flex items-stretch h-16">
          <div className="flex flex-1">
            {left.map((it) => (
              <NavBtn key={it.href} item={it} active={isActive(it.href)} />
            ))}
          </div>

          {/* Center spacer for raised Start button */}
          <div className="w-20 flex-shrink-0" aria-hidden="true" />

          <div className="flex flex-1">
            {right.map((it) => (
              <NavBtn key={it.href} item={it} active={isActive(it.href)} />
            ))}
          </div>

          {/* Raised Start button */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 flex flex-col items-center pointer-events-none">
            <button
              type="button"
              onClick={() => activitiesEnabled && setPickerOpen(true)}
              disabled={!activitiesEnabled || isStarting}
              className="pointer-events-auto w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-[1.04] active:scale-[0.97] disabled:opacity-40"
              style={{
                background: "linear-gradient(135deg, #34eab8 0%, #2ab89a 60%, #1cb896 100%)",
                boxShadow:
                  "0 0 28px rgba(52,234,184,0.45), 0 6px 18px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
                border: "3px solid rgba(8,12,17,0.95)",
              }}
              aria-label={activitiesEnabled ? "Start tur eller spotting" : "Aktiviteter er ikke tilgjengelig"}
            >
              <Play className="w-6 h-6 text-[#070b10]" fill="#070b10" />
            </button>
            <span
              className="mt-1 text-[9px] uppercase tracking-[0.12em] font-bold text-white/70"
              style={chakra}
            >
              Start
            </span>
          </div>
        </div>
      </nav>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="border-white/10" style={{ background: "hsl(215 25% 10%)" }}>
          <DialogHeader>
            <DialogTitle className="text-white" style={chakra}>
              Hva gjør du nå?
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {TYPES.map((t) => {
              const Icon = t.Icon;
              return (
                <button
                  key={t.value}
                  type="button"
                  disabled={isStarting}
                  onClick={() => handleStart(t.value)}
                  className="w-full flex items-center gap-3 p-4 rounded-lg border border-white/[0.08] hover:border-[#2dd4a8]/40 transition-all text-left disabled:opacity-50"
                  style={{ background: "hsl(215 25% 8%)" }}
                >
                  <Icon className="w-5 h-5 text-[#2dd4a8]" />
                  <div>
                    <div
                      className="text-[13px] text-white font-bold uppercase tracking-[0.05em]"
                      style={chakra}
                    >
                      {t.label}
                    </div>
                    <div className="text-[11px] text-white/40" style={oswald}>
                      {t.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
