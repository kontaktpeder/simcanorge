import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useSearchParams } from "react-router-dom";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CompleteProfileForm } from "@/components/profile/CompleteProfileForm";
import { EditProfileForm } from "@/components/profile/EditProfileForm";
import { RequestPageAccessButton } from "@/components/profile/RequestPageAccessButton";
import { Layout } from "@/components/layout/Layout";
import {
  GaragePageShell,
  GaragePanel,
  GarageChipLink,
  GARAGE_BG,
  garageBtn,
} from "@/components/layout/GaragePageShell";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/config/features";
import { SITE_NAME } from "@/config/site";
import {
  Pencil,
  Settings,
  CheckCircle2,
  Circle,
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";
import { isSellerMinimumComplete, getSellerMinimumSteps } from "@/lib/sellerProfile";

const MIN_BIO_LENGTH = 30;

function SellerReadinessCard({
  profile,
  onEdit,
}: {
  profile: { bio?: string | null; location?: string | null; is_public?: boolean | null; contact_email?: string | null; display_name?: string };
  onEdit: () => void;
}) {
  const sellerReady = isSellerMinimumComplete(profile);
  const steps = getSellerMinimumSteps(profile);

  return (
    <GaragePanel
      className={
        sellerReady
          ? "border-green-200 bg-green-50/60"
          : "border-amber-200 bg-amber-50/60"
      }
    >
      <div className="flex items-start gap-3">
        <ShoppingBag
          className={`h-5 w-5 mt-0.5 shrink-0 ${sellerReady ? "text-green-600" : "text-amber-600"}`}
        />
        <div className="flex-1">
          <p className="font-semibold text-sm">
            {sellerReady ? "Klar til å selge" : "Klar til å selge?"}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            {sellerReady
              ? "Du har alt du trenger for å opprette annonser. Annonser godkjennes av admin før publisering."
              : "Fyll ut disse feltene for å opprette annonser på markedsplassen:"}
          </p>
        </div>
        {sellerReady && (
          <Badge className="shrink-0 bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Klar
          </Badge>
        )}
      </div>
      {!sellerReady && (
        <>
          <ul className="space-y-1.5 mt-3 ml-8">
            {steps.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-sm">
                {s.done ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-neutral-300 shrink-0" />
                )}
                <span className={s.done ? "text-neutral-400 line-through" : ""}>{s.label}</span>
              </li>
            ))}
          </ul>
          <Button size="sm" className={cn("mt-3 rounded-xl", garageBtn.primary)} onClick={onEdit}>
            <Pencil className="w-4 h-4 mr-1.5" />
            Fyll ut manglende felter
          </Button>
        </>
      )}
    </GaragePanel>
  );
}

function ProfileCompletionCard({
  profile,
  onEdit,
}: {
  profile: { bio?: string | null; location?: string | null; is_public?: boolean | null };
  onEdit: () => void;
}) {
  const checks = [
    {
      label: "Bio (minst 30 tegn)",
      done: !!profile.bio && profile.bio.trim().length >= MIN_BIO_LENGTH,
    },
    { label: "Sted", done: !!profile.location },
    { label: "Offentlig profil", done: !!profile.is_public },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  const allDone = doneCount === checks.length;

  if (allDone) return null;

  return (
    <GaragePanel className="border-amber-200 bg-amber-50/60">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-sm">Fullfør for offentlig profil</p>
          <p className="text-xs text-neutral-600 mt-1">
            Disse feltene trengs for å gjøre profilen offentlig.
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {doneCount}/{checks.length}
        </Badge>
      </div>
      <ul className="space-y-1.5 mt-3 ml-8">
        {checks.map((c) => (
          <li key={c.label} className="flex items-center gap-2 text-sm">
            {c.done ? (
              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <Circle className="h-4 w-4 text-neutral-300 shrink-0" />
            )}
            <span className={c.done ? "text-neutral-400 line-through" : ""}>{c.label}</span>
          </li>
        ))}
      </ul>
      <Button size="sm" className={cn("mt-3 rounded-xl", garageBtn.primary)} onClick={onEdit}>
        <Pencil className="w-4 h-4 mr-1.5" />
        Fyll ut manglende felter
      </Button>
    </GaragePanel>
  );
}

export default function DashboardMinProfilPage() {
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

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[40vh] flex items-center justify-center" style={{ backgroundColor: GARAGE_BG }}>
          <p className="text-sm text-neutral-500">Laster…</p>
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <GaragePageShell title="Min profil">
          <CompleteProfileForm />
        </GaragePageShell>
      </Layout>
    );
  }

  return (
    <Layout>
      <Helmet>
        <title>Min profil | {SITE_NAME}</title>
      </Helmet>

      <GaragePageShell
        title="Min profil"
        actions={
          <GarageChipLink
            to="/konto"
            icon={<Settings className="w-3.5 h-3.5" />}
            label="Konto"
          />
        }
      >
        <div className="mb-5">
          <p className="text-[11px] uppercase tracking-[0.18em] font-semibold text-neutral-500">
            Profil
          </p>
          <h2 className="text-[26px] sm:text-[30px] font-bold leading-tight mt-1">
            {profile.display_name}
          </h2>
          <p className="text-sm text-neutral-600 mt-1">Din offentlige profil på {SITE_NAME}</p>
        </div>

        <div className="space-y-4">
          {!FEATURES.simpleLaunchMode && (
            <SellerReadinessCard profile={profile} onEdit={() => setEditing(true)} />
          )}

          {!editing && (
            <ProfileCompletionCard profile={profile} onEdit={() => setEditing(true)} />
          )}

          <GaragePanel>
            <div className="flex items-center gap-4">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center border border-black/[0.06]">
                  <span className="text-xl font-bold text-neutral-400">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-semibold truncate">{profile.display_name}</h3>
                <p className="text-sm text-neutral-500 truncate">/{profile.slug}</p>
                <div className="mt-1.5">
                  <Badge variant={profile.is_public ? "default" : "secondary"}>
                    {profile.is_public ? "Offentlig" : "Privat"}
                  </Badge>
                </div>
              </div>
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("rounded-xl shrink-0", garageBtn.outline)}
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="w-4 h-4 mr-1" />
                  Rediger
                </Button>
              )}
            </div>
          </GaragePanel>

          {editing ? (
            <GaragePanel>
              <h3 className="text-[15px] font-semibold mb-4">Rediger profil</h3>
              <EditProfileForm profile={profile as never} onSuccess={() => setEditing(false)} />
            </GaragePanel>
          ) : (
            <>
              {profile.bio && (
                <GaragePanel>
                  <h3 className="text-[13px] font-semibold text-neutral-500 mb-1">Bio</h3>
                  <p className="text-sm text-neutral-700 whitespace-pre-wrap">{profile.bio}</p>
                </GaragePanel>
              )}

              {profile.location && (
                <GaragePanel>
                  <h3 className="text-[13px] font-semibold text-neutral-500 mb-1">Sted</h3>
                  <p className="text-sm text-neutral-700">{profile.location}</p>
                </GaragePanel>
              )}
            </>
          )}

          {!FEATURES.simpleLaunchMode && <RequestPageAccessButton />}
        </div>
      </GaragePageShell>
    </Layout>
  );
}
