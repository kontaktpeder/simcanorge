import { useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';

/**
 * Registrer is now unified with Login (magic-link first).
 * Redirect to /login preserving any invite/returnUrl context.
 */
export default function RegistrerBruker() {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();

  useEffect(() => {
    document.title = 'Logg inn / Opprett konto';
  }, []);

  return <Navigate to={`/login${qs ? `?${qs}` : ''}`} replace />;
}
