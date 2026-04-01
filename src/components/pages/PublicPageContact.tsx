import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageContact({ page }: { page: Page }) {
  if (!page.contact_email && !page.contact_phone && !page.website) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kontakt</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        {page.contact_email && (
          <div>
            <span className="text-muted-foreground">E-post: </span>
            <a href={`mailto:${page.contact_email}`} className="text-primary hover:underline">
              {page.contact_email}
            </a>
          </div>
        )}
        {page.contact_phone && (
          <div>
            <span className="text-muted-foreground">Telefon: </span>
            <a href={`tel:${page.contact_phone}`} className="text-primary hover:underline">
              {page.contact_phone}
            </a>
          </div>
        )}
        {page.website && (
          <div>
            <span className="text-muted-foreground">Nettside: </span>
            <a href={page.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {page.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
