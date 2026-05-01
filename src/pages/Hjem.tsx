import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import MinGarasje from "@/pages/MinGarasje";
import RegistrerBil from "@/pages/RegistrerBil";
import { BrandLoader } from "@/components/brand/BrandLoader";

/**
 * Root entry "/" for bilgarasje.no.
 *
 * - Signed-in users land in their garage (Min garasje) — this is "where it starts".
 * - Visitors are routed to the onboarding/registrer-flow at /legg-inn-bil.
 */
export default function Hjem() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) return;
    document.title = "Bilgarasje.no";
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#070b10]">
        <BrandLoader label="Bilgarasje" />
      </div>
    );
  }

  if (user) return <MinGarasje />;
  return <RegistrerBil />;
}

// Back-compat helper for places that explicitly want the old onboarding redirect.
export function LeggInnBilRedirect() {
  return <Navigate to="/legg-inn-bil" replace />;
}
