import type { Database } from "@/integrations/supabase/types";
import { Mail, Phone, Globe } from "lucide-react";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageContact({ page }: { page: Page }) {
  if (!page.contact_email && !page.contact_phone && !page.website) return null;

  return (
    <div className="rounded-2xl border border-[hsl(var(--page-card-border))] bg-[hsl(var(--page-card))] p-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[hsl(var(--page-accent))] mb-4">
        Kontakt
      </h2>
      <div className="space-y-3 text-sm">
        {page.contact_email && (
          <a
            href={`mailto:${page.contact_email}`}
            className="flex items-center gap-2.5 text-[hsl(var(--page-text)/0.85)] hover:text-[hsl(var(--page-accent))] transition-colors"
          >
            <Mail className="w-4 h-4 text-[hsl(var(--page-accent)/0.7)]" />
            {page.contact_email}
          </a>
        )}
        {page.contact_phone && (
          <a
            href={`tel:${page.contact_phone}`}
            className="flex items-center gap-2.5 text-[hsl(var(--page-text)/0.85)] hover:text-[hsl(var(--page-accent))] transition-colors"
          >
            <Phone className="w-4 h-4 text-[hsl(var(--page-accent)/0.7)]" />
            {page.contact_phone}
          </a>
        )}
        {page.website && (
          <a
            href={page.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2.5 text-[hsl(var(--page-text)/0.85)] hover:text-[hsl(var(--page-accent))] transition-colors"
          >
            <Globe className="w-4 h-4 text-[hsl(var(--page-accent)/0.7)]" />
            {page.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>
    </div>
  );
}
