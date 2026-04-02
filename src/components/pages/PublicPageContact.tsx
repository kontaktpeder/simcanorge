import type { Database } from "@/integrations/supabase/types";
import { Mail, Phone, Globe } from "lucide-react";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageContact({ page }: { page: Page }) {
  if (!page.contact_email && !page.contact_phone && !page.website) return null;

  return (
    <div>
      <h2
        className="text-[1.3rem] md:text-[1.5rem] uppercase text-white font-bold leading-[1] tracking-[0.06em] mb-6"
        style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
      >
        Kontakt
      </h2>
      <div className="space-y-4">
        {page.contact_email && (
          <a
            href={`mailto:${page.contact_email}`}
            className="flex items-center gap-3 text-[15px] text-white/55 hover:text-[hsl(var(--page-accent))] transition-colors duration-300 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-[hsl(var(--page-accent)/0.1)] transition-colors duration-300">
              <Mail className="w-4 h-4 text-[hsl(var(--page-accent)/0.7)] group-hover:text-[hsl(var(--page-accent))]" />
            </div>
            {page.contact_email}
          </a>
        )}
        {page.contact_phone && (
          <a
            href={`tel:${page.contact_phone}`}
            className="flex items-center gap-3 text-[15px] text-white/55 hover:text-[hsl(var(--page-accent))] transition-colors duration-300 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-[hsl(var(--page-accent)/0.1)] transition-colors duration-300">
              <Phone className="w-4 h-4 text-[hsl(var(--page-accent)/0.7)] group-hover:text-[hsl(var(--page-accent))]" />
            </div>
            {page.contact_phone}
          </a>
        )}
        {page.website && (
          <a
            href={page.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-[15px] text-white/55 hover:text-[hsl(var(--page-accent))] transition-colors duration-300 group"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center group-hover:bg-[hsl(var(--page-accent)/0.1)] transition-colors duration-300">
              <Globe className="w-4 h-4 text-[hsl(var(--page-accent)/0.7)] group-hover:text-[hsl(var(--page-accent))]" />
            </div>
            {page.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>
    </div>
  );
}
