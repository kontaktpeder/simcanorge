import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Start from "@/pages/Start";
import { BrandLoader } from "@/components/brand/BrandLoader";

/**
 * App entry "/app".
 *
 * - This is the entry point for the installed PWA / home-screen shortcut.
 * - Logged in: shows the app home (Start).
 * - Logged out: redirects to /login with returnUrl back to /app.
 *   We never show the public onboarding here — /app must always feel like the app.
 */
export default function AppEntry() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    document.title = "Bilgarasje – Min app";
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#070b10]">
        <BrandLoader label="Bilgarasje" />
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent("/app")}&reason=app`}
        replace
      />
    );
  }

  return <Start />;
}
