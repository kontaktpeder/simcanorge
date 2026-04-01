import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";

interface Props {
  children: React.ReactNode;
}

export function RequirePersonProfile({ children }: Props) {
  const { user } = useAuth();
  const { data: profile, isLoading } = useMyPersonProfile();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user || isLoading) return;
    if (profile === null && location.pathname !== "/kom-i-gang") {
      navigate("/kom-i-gang", { replace: true });
    }
  }, [user, profile, isLoading, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Laster profil…</p>
      </div>
    );
  }

  return <>{children}</>;
}
