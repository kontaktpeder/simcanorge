import type { Database } from "@/integrations/supabase/types";

type Page = Database["public"]["Tables"]["pages"]["Row"];

export function PublicPageAbout({ page }: { page: Page }) {
  if (!page.about) return null;

  return (
    <div>
      <h2
        className="text-[1.5rem] md:text-[1.8rem] uppercase text-white font-bold leading-[1] tracking-[0.06em] mb-6"
        style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
      >
        Om oss
      </h2>

      <p className="text-[15px] sm:text-base text-white/60 whitespace-pre-wrap leading-[1.8] max-w-[680px]">
        {page.about}
      </p>
    </div>
  );
}
