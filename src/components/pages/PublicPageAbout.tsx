import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Database } from "@/integrations/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageAbout({ page }: { page: Page }) {
  if (!page.about && !page.founded_year && !page.location) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Om oss</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {page.about && <p className="text-sm whitespace-pre-wrap">{page.about}</p>}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {page.location && (
            <span>📍 {page.location}</span>
          )}
          {page.founded_year && (
            <span>📅 Grunnlagt {page.founded_year}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
