import { Helmet } from "react-helmet-async";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompleteProfileForm } from "@/components/profile/CompleteProfileForm";

export default function DashboardMinProfilPage() {
  const { data: profile, isLoading } = useMyPersonProfile();

  if (isLoading) return <p className="p-8 text-muted-foreground">Laster…</p>;
  if (!profile) return <CompleteProfileForm />;

  return (
    <>
      <Helmet>
        <title>Min profil | Bilgarasjen</title>
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Min profil</h1>
          <p className="text-muted-foreground">Din offentlige profil på Bilgarasjen</p>
        </div>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xl font-bold text-muted-foreground">
                  {profile.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold">{profile.display_name}</h2>
              <p className="text-sm text-muted-foreground">bilgarasje.no/p/{profile.slug}</p>
              <div className="mt-1">
                <Badge variant={profile.is_public ? "default" : "secondary"}>
                  {profile.is_public ? "Offentlig" : "Privat"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {profile.bio && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-medium mb-1">Bio</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
