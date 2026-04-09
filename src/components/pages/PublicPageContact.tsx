import type { Database } from "@/integrations/supabase/types";
import { Mail, Phone, Globe } from "lucide-react";

type Page = Database["public"]["Tables"]["pages"]["Row"];

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export function PublicPageContact({ page, light }: { page: Page; light?: boolean }) {
  if (!page.contact_email && !page.contact_phone && !page.website) return null;

  const heading = light ? "text-[#3a2e24]" : "text-white";
  const text = light ? "text-[#3a2e24]/55" : "text-white/55";
  const accent = light ? "text-[#c4962c]" : "text-[hsl(var(--page-accent))]";
  const accentMuted = light ? "text-[#c4962c]/70" : "text-[hsl(var(--page-accent)/0.7)]";
  const iconBg = light ? "bg-[#3a2e24]/[0.04]" : "bg-white/[0.04]";
  const iconBgHover = light ? "group-hover:bg-[#c4962c]/10" : "group-hover:bg-[hsl(var(--page-accent)/0.1)]";

  return (
    <div>
      <h2
        className={`text-[1.3rem] md:text-[1.5rem] uppercase font-bold leading-[1] tracking-[0.06em] mb-6 ${heading}`}
        style={light ? chakra : { fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
      >
        Kontakt
      </h2>
      <div className="space-y-4">
        {page.contact_email && (
          <a
            href={`mailto:${page.contact_email}`}
            className={`flex items-center gap-3 text-[15px] ${text} hover:${accent} transition-colors duration-300 group`}
          >
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center ${iconBgHover} transition-colors duration-300`}>
              <Mail className={`w-4 h-4 ${accentMuted} group-hover:${accent}`} />
            </div>
            {page.contact_email}
          </a>
        )}
        {page.contact_phone && (
          <a
            href={`tel:${page.contact_phone}`}
            className={`flex items-center gap-3 text-[15px] ${text} hover:${accent} transition-colors duration-300 group`}
          >
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center ${iconBgHover} transition-colors duration-300`}>
              <Phone className={`w-4 h-4 ${accentMuted} group-hover:${accent}`} />
            </div>
            {page.contact_phone}
          </a>
        )}
        {page.website && (
          <a
            href={page.website}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 text-[15px] ${text} hover:${accent} transition-colors duration-300 group`}
          >
            <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center ${iconBgHover} transition-colors duration-300`}>
              <Globe className={`w-4 h-4 ${accentMuted} group-hover:${accent}`} />
            </div>
            {page.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </div>
    </div>
  );
}
