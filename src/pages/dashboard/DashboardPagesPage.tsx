import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useMyPages } from "@/hooks/useMyPages";
import { PageCard } from "@/components/pages/PageCard";
import { RequestPageAccessButton } from "@/components/profile/RequestPageAccessButton";
import { Button } from "@/components/ui/button";
import { useMyPersonProfile } from "@/hooks/useMyPersonProfile";
import { PlusIcon } from "lucide-react";

export default function DashboardPagesPage() {
  const { data: pages, isLoading } = useMyPages();
  const { data: profile } = useMyPersonProfile();

  return (
    <>
      <Helmet>
        <title>Mine sider | Bilgarasjen</title>
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mine sider</h1>
            <p className="text-muted-foreground">Klubber, verksteder og andre sider du er tilknyttet</p>
          </div>
          {profile?.can_create_pages ? (
            <Button asChild>
              <Link to="/dashboard/sider/ny">
                <PlusIcon className="w-4 h-4 mr-1" />
                Ny side
              </Link>
            </Button>
          ) : (
            <RequestPageAccessButton />
          )}
        </div>

        {isLoading && <p className="text-muted-foreground">Laster sider…</p>}

        {!isLoading && (!pages || pages.length === 0) && (
          <div className="text-center py-12 space-y-3">
            <p className="text-muted-foreground">Du er ikke tilknyttet noen sider ennå.</p>
            {profile?.can_create_pages && (
              <Button asChild variant="outline">
                <Link to="/dashboard/sider/ny">Opprett din første side</Link>
              </Button>
            )}
            {!profile?.can_create_pages && (
              <RequestPageAccessButton />
            )}
          </div>
        )}

        <div className="space-y-3">
          {pages?.map((page) => (
            <PageCard key={page.id} page={page} />
          ))}
        </div>
      </div>
    </>
  );
}
