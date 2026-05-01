import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MinGarasje from "@/pages/MinGarasje";
import RegistrerBil from "@/pages/RegistrerBil";
import { CarLineMark } from "@/components/brand/CarLineMark";

/**
 * Root entry "/" for bilgarasje.no.
 *
 * - Signed-in users land in their garage (Min garasje) — this is "where it starts".
 * - Visitors are routed to the onboarding/registrer-flow at /legg-inn-bil.
 *
 * Auth state is resolved server-side; while loading we render a small line-art
 * splash so the page never flashes the wrong destination.
 */
export default function Hjem() {
  const { user, isLoading } = useAuth();

  // Cheap analytics-friendly title bump while resolving (no flicker).
  useEffect(() => {
    if (!isLoading) return;
    document.title = "Bilgarasje.no";
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4 bg-[#070b10]">
        <CarLineMark
          animated
          color="#34eab8"
          strokeWidth={2.6}
          className="w-[180px] h-auto"
          style={{ filter: "drop-shadow(0 0 14px rgba(52,234,184,0.35))" }}
        />
        <p
          className="text-[10px] uppercase tracking-[0.32em] text-white/40"
          style={{ fontFamily: "'Chakra Petch', 'Oswald', sans-serif" }}
        >
          Bilgarasje
        </p>
      </div>
    );
  }

  if (user) return <MinGarasje />;

  // Visitors get the onboarding flow (formerly "/")
  // Render directly so the URL stays clean ("/" is still the canonical landing).
  return <RegistrerBil />;
}

// Back-compat helper for places that explicitly want the old onboarding redirect.
export function LeggInnBilRedirect() {
  return <Navigate to="/legg-inn-bil" replace />;
}
