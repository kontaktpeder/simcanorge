import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export function RequirePersonProfile({ children }: Props) {
  const { user } = useAuth();
  const { data: profile, isLoading } = useMyPersonProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Laster profil…</p>
      </div>
    );
  }

  return (
    <>
      {user && !isLoading && profile === null && (
        <div className="max-w-3xl mx-auto px-4 pt-6">
          <Alert className="border-primary/30 bg-primary/5">
            <UserPlus className="h-4 w-4" />
            <AlertTitle>Fullfør profilen din</AlertTitle>
            <AlertDescription className="flex items-center justify-between gap-4 flex-wrap">
              <span>Sett opp profilen din for å få tilgang til alle funksjoner.</span>
              <Link to="/kom-i-gang">
                <Button size="sm">Kom i gang</Button>
              </Link>
            </AlertDescription>
          </Alert>
        </div>
      )}
      {children}
    </>
  );
}
