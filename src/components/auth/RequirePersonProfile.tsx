import { useAuth } from "@/hooks/useAuth";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { BrandLoader } from "@/components/brand/BrandLoader";

interface Props {
  children: React.ReactNode;
}

export function RequirePersonProfile({ children }: Props) {
  const { user } = useAuth();
  const { isLoading } = useMyPersonProfile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <BrandLoader label="Laster profil…" />
      </div>
    );
  }

  return <>{children}</>;
}
