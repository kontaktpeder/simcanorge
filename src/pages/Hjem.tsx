import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import RegistrerBil from "@/pages/RegistrerBil";
import { useAuth } from "@/hooks/useAuth";
import { BrandLoader } from "@/components/brand/BrandLoader";

/**
 * Root entry "/" for bilgarasje.no.
 *
 * - Logged out: shows the public onboarding flow (RegistrerBil).
 * - Logged in: redirects straight into the app at /app, so returning users
 *   never have to manually click into the dashboard.
 *
 * The app entry lives at "/app" and is the canonical "home" for signed-in users.
 */
export default function Hjem() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    document.title = "Bilgarasje.no";
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#070b10]">
        <BrandLoader label="Bilgarasje" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <RegistrerBil />;
}

// Back-compat helper for places that explicitly want the old onboarding redirect.
export function LeggInnBilRedirect() {
  return <Navigate to="/legg-inn-bil" replace />;
}
