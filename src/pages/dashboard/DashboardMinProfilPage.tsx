import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useOwnerProfile } from "@/hooks/useOwnerProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompleteProfileForm } from "@/components/profile/CompleteProfileForm";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { RequestPageAccessButton } from "@/components/profile/RequestPageAccessButton";
import { Layout } from "@/components/layout/Layout";
import { ArrowLeft, FileText, Pencil, User } from "lucide-react";

export default function DashboardMinProfilPage() {
  const { data: profile, isLoading } = useMyPersonProfile();
  const [editing, setEditing] = useState(false);

  if (isLoading) return <Layout><p className="p-8 text-muted-foreground">Laster…</p></Layout>;
  if (!profile) return <Layout><div className="max-w-lg mx-auto px-4 py-12"><CompleteProfileForm /></div></Layout>;

  return (
    <Layout>
      <Helmet>
        <title>Min profil | Bilgarasjen</title>
      </Helmet>
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Dashboard
            </Button>
          </Link>
        </div>

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
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{profile.display_name}</h2>
              <p className="text-sm text-muted-foreground">simcanorge.lovable.app/p/{profile.slug}</p>
              <div className="mt-1">
                <Badge variant={profile.is_public ? "default" : "secondary"}>
                  {profile.is_public ? "Offentlig" : "Privat"}
                </Badge>
              </div>
            </div>
            {!editing && (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="w-4 h-4 mr-1" />
                Rediger
              </Button>
            )}
          </CardContent>
        </Card>

        {editing ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rediger profil</CardTitle>
            </CardHeader>
            <CardContent>
              <EditProfileForm profile={profile} onSuccess={() => setEditing(false)} />
            </CardContent>
          </Card>
        ) : (
          <>
            {profile.bio && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-1">Bio</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{profile.bio}</p>
                </CardContent>
              </Card>
            )}

            {profile.location && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-medium mb-1">Sted</h3>
                  <p className="text-sm text-muted-foreground">{profile.location}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <RequestPageAccessButton />

        <div className="flex gap-3 pt-2">
          <Link to="/dashboard">
            <Button variant="outline">
              <User className="w-4 h-4 mr-2" />
              Til Dashboard
            </Button>
          </Link>
          <Link to="/dashboard/sider">
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Mine sider
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
