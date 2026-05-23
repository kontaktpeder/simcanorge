import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Warehouse, Route, Compass, User } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFeatures } from "@/hooks/useFeatures";
import { useActivitySession } from "@/hooks/useActivitySession";
import { isUtforskNavActive } from "@/lib/exploreNav";

import { CaptureCameraButton } from "@/components/capture/CaptureCameraButton";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;


type Item = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};


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
            active ? "text-white" : "text-white/70 group-hover:text-white"
          }`}
        />
        {item.badge && (
          <span
            className="absolute -top-1.5 -right-3 px-1.5 py-[1px] rounded-full text-[8px] font-bold uppercase tracking-[0.08em] leading-none text-white"
            style={{ ...chakra, background: "#f08a24" }}
          >
            {item.badge}
          </span>
        )}
      </span>
      <span
        className={`text-[10px] tracking-[0.08em] uppercase font-bold transition-colors ${
          active ? "text-white" : "text-white/70 group-hover:text-white"
        }`}
        style={chakra}
      >
        {item.label}
      </span>
      {active && (
        <span
          aria-hidden="true"
          className="absolute bottom-1 h-[2px] w-7 rounded-full"
          style={{ background: "#f08a24" }}
        />
      )}
    </Link>
  );
}

export function BottomNav() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const features = useFeatures();
  const activitiesEnabled = !!features.activitySessions;
  const { activeSession } = useActivitySession({ enabled: activitiesEnabled });
  const effectiveActiveSession = activitiesEnabled ? activeSession : null;
  const [pickerOpen, setPickerOpen] = useState(false);
  const visible = true;

  // Hide entirely when no user, on auth/onboarding routes, or in focus mode (active session)
  const hidden =
    !user ||
    effectiveActiveSession ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/registrer") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/onboarding");

  if (hidden) return null;

  // Layout: Utforsk · Garasje · [Start] · Turer · Profil
  const left: Item[] = [
    { href: "/hjem", label: "Utforsk", Icon: Compass },
    { href: "/min-garasje", label: "Garasje", Icon: Warehouse },
  ];
  const right: Item[] = [
    { href: "/turer", label: "Turer", Icon: Route, badge: "Ny" },
    { href: "/dashboard/min-profil", label: "Profil", Icon: User },
  ];

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  const utforskActive = isUtforskNavActive(pathname);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t border-white/10 transition-transform duration-300 ease-out will-change-transform"
        style={{
          background: "#4a5560",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          boxShadow: "0 -2px 20px rgba(0,0,0,0.25)",
          transform: visible || pickerOpen ? "translateY(0)" : "translateY(110%)",
        }}
        aria-label="Hovednavigasjon"
        aria-hidden={!visible && !pickerOpen}
      >
        <div className="relative flex items-stretch h-16">
          <div className="flex flex-1">
            {left.map((it) => (
              <NavBtn
                key={it.href}
                item={it}
                active={it.href === "/hjem" ? utforskActive : isActive(it.href)}
              />
            ))}
          </div>

          {/* Center spacer for raised Start button */}
          <div className="w-20 flex-shrink-0" aria-hidden="true" />

          <div className="flex flex-1">
            {right.map((it) => (
              <NavBtn key={it.href} item={it} active={isActive(it.href)} />
            ))}
          </div>

          {/* Raised capture button — capture-first inngang */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-6 flex flex-col items-center pointer-events-none">
            <div className="pointer-events-auto">
              <CaptureCameraButton
                size="fab"
                screen="bottom_nav"
                onOpenChange={setPickerOpen}
              />
            </div>
            <span
              className="mt-1 text-[9px] uppercase tracking-[0.12em] font-bold text-white/70"
              style={chakra}
            >
              Fang
            </span>
          </div>
        </div>
      </nav>
    </>
  );
}
