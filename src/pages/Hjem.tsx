import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import RegistrerBil from "@/pages/RegistrerBil";

/**
 * Root entry "/" for bilgarasje.no.
 *
 * Always shows onboarding/registrer-flow — even for logged-in users.
 * The app entry lives at "/app" and is unaffected by this route.
 */
export default function Hjem() {
  useEffect(() => {
    document.title = "Bilgarasje.no";
  }, []);

  return <RegistrerBil />;
}

// Back-compat helper for places that explicitly want the old onboarding redirect.
export function LeggInnBilRedirect() {
  return <Navigate to="/legg-inn-bil" replace />;
}
