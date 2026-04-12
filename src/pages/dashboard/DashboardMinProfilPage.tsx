import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompleteProfileForm } from "@/components/profile/CompleteProfileForm";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { RequestPageAccessButton } from "@/components/profile/RequestPageAccessButton";
import { Layout } from "@/components/layout/Layout";
import { ArrowLeft, FileText, Pencil, User, CheckCircle2, Circle, AlertTriangle, ShoppingBag } from "lucide-react";
import { isSellerMinimumComplete, getSellerMinimumSteps } from "@/lib/sellerProfile";

const MIN_BIO_LENGTH = 30;

/* ─── Section A: Seller minimum checklist ─── */
function SellerReadinessCard({
  profile,
  onEdit,
}: {
  profile: any;
  onEdit: () => void;
}) {
  const sellerReady = isSellerMinimumComplete(profile);
  const steps = getSellerMinimumSteps(profile);

  return (
    <Card className={sellerReady ? "border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20" : "border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20"}>
      <CardContent className="p-5 space-y-3">
        <div className="flex items-start gap-3">
          <ShoppingBag className={`h-5 w-5 mt-0.5 shrink-0 ${sellerReady ? "text-green-600" : "text-amber-600"}`} />
          <div className="flex-1">
            <p className="font-medium text-sm">{sellerReady ? "Klar til å selge" : "Klar til å selge?"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {sellerReady
                ? "Du har alt du trenger for å opprette annonser. Annonser godkjennes av admin før publisering."
                : "Fyll ut disse feltene for å opprette annonser på markedsplassen:"}
            </p>
          </div>
          {sellerReady && (
            <Badge variant="secondary" className="shrink-0 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-3 w-3 mr-1" />Klar
            </Badge>
          )}
        </div>
        {!sellerReady && (
          <>
            <ul className="space-y-1.5 ml-8">
              {steps.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-sm">
                  {s.done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={s.done ? "text-muted-foreground line-through" : ""}>{s.label}</span>
                </li>
              ))}
            </ul>
            <Button size="sm" onClick={onEdit}>
              <Pencil className="w-4 h-4 mr-1.5" />
              Fyll ut manglende felter
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Section B: Public profile / page access ─── */
function ProfileCompletionCard({
  profile,
  onEdit,
}: {
  profile: any;
  onEdit: () => void;
}) {
  const checks = [
    { label: "Bio (minst 30 tegn)", done: !!profile.bio && profile.bio.trim().length >= MIN_BIO_LENGTH },
    { label: "Sted", done: !!profile.location },
    { label: "Offentlig profil", done: !!profile.is_public },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  const allDone = doneCount === checks.length;

  if (allDone) return null;

  return (
    <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-medium text-sm">Fullfør for offentlig profil & sidetilgang</p>
            <p className="text-xs text-muted-foreground mt-1">
              Disse feltene trengs for å gjøre profilen offentlig og søke om sidetilgang.
            </p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {doneCount}/{checks.length}
          </Badge>
        </div>
        <ul className="space-y-1.5 ml-8">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              {c.done ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              )}
              <span className={c.done ? "text-muted-foreground line-through" : ""}>{c.label}</span>
            </li>
          ))}
        </ul>
        <Button size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-1.5" />
          Fyll ut manglende felter
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DashboardMinProfilPage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useMyPersonProfile();
  const [searchParams] = useSearchParams();
  const shouldEdit = searchParams.get("rediger") === "1";
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (shouldEdit) {
      setEditing(true);
      return;
    }
    const incomplete =
      !profile.bio || profile.bio.trim().length < MIN_BIO_LENGTH || !profile.is_public;
    if (incomplete) {
      setEditing(true);
    }
  }, [profile, shouldEdit]);

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

        {/* Section A: Seller readiness */}
        <SellerReadinessCard profile={profile} onEdit={() => setEditing(true)} />

        {/* Section B: Public profile completion */}
        {!editing && (
          <ProfileCompletionCard
            profile={profile}
            onEdit={() => setEditing(true)}
          />
        )}

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
              <p className="text-sm text-muted-foreground">simcanorge.no/p/{profile.slug}</p>
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
              <EditProfileForm profile={profile as any} onSuccess={() => setEditing(false)} />
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
