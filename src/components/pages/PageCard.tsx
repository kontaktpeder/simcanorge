import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageTypeBadge } from "./PageTypeBadge";
import type { PageWithRole } from "@/hooks/useMyPages";

const roleLabels: Record<string, string> = {
  owner: "Eier",
  admin: "Admin",
  editor: "Redaktør",
  moderator: "Moderator",
  member: "Medlem",
};

export function PageCard({ page }: { page: PageWithRole }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {page.logo_url ? (
            <img src={page.logo_url} alt={page.title} className="w-12 h-12 rounded-lg object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              <span className="text-lg font-bold text-muted-foreground">
                {page.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold truncate">{page.title}</h3>
              <PageTypeBadge type={page.page_type} />
            </div>
            {page.tagline && (
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{page.tagline}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">{roleLabels[page.role] ?? page.role}</Badge>
              <Badge variant={page.status === "active" ? "default" : "secondary"} className="text-xs">
                {page.status === "active" ? "Aktiv" : page.status === "draft" ? "Utkast" : page.status}
              </Badge>
            </div>
          </div>
          <Link to={`/dashboard/sider/${page.id}`} className="text-sm text-primary hover:underline shrink-0">
            Rediger →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
