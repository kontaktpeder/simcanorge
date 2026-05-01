import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Start from "@/pages/Start";
import RegistrerBil from "@/pages/RegistrerBil";
import { BrandLoader } from "@/components/brand/BrandLoader";

/**
 * Root entry "/" for bilgarasje.no.
 *
 * - Signed-in users land on Start (Hjem) — intent + last activity + previews.
 * - Visitors are routed to onboarding/registrer-flow.
 */
export default function Hjem() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    document.title = "Bilgarasje.no";
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#070b10]">
        <BrandLoader label="Bilgarasje" />
      </div>
    );
  }

  // Logged-in users get the real app entry. "/" stays as the public web/onboarding entry.
  if (user) return <Navigate to="/app" replace />;
  return <RegistrerBil />;
}

// Back-compat helper for places that explicitly want the old onboarding redirect.
export function LeggInnBilRedirect() {
  return <Navigate to="/legg-inn-bil" replace />;
}
