import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";

interface Props {
  children: React.ReactNode;
}

export function RequirePersonProfile({ children }: Props) {
  const { user } = useAuth();
  const { isLoading } = useMyPersonProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Laster profil…</p>
      </div>
    );
  }

  return <>{children}</>;
}
