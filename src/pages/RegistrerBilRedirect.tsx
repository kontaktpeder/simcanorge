import { Navigate, useLocation } from "react-router-dom";

/**
 * Client-side fallback redirect for /registrer-bil → /legg-inn-bil.
 * Production hosts (Netlify) also serve a 301 via public/_redirects, but this
 * ensures the SPA navigates correctly when the route is hit client-side.
 */
export default function RegistrerBilRedirect() {
  const location = useLocation();
  return <Navigate to={`/legg-inn-bil${location.search}${location.hash}`} replace />;
}
