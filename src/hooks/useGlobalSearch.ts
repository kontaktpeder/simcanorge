import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  thumbnail?: string | null;
  href: string;
  section: "biler" | "arrangement" | "markedsplass" | "sider";
  sectionLabel: string;
}

function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, "\\$&");
}

export function useGlobalSearch(debouncedQuery: string) {
  const q = debouncedQuery.trim();
  const active = q.length >= 2;
  const safe = escapeLike(q);

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", q],
    queryFn: async () => {
      const [carsRes, eventsRes, marketRes, pagesRes, partsRes] = await Promise.allSettled([
        supabase
          .from("cars")
          .select("id, title, slug, year, brand, model, car_images(image_url, sort_order)")
          .eq("status", "published")
          .or(`title.ilike.%${safe}%,model.ilike.%${safe}%,brand.ilike.%${safe}%`)
          .limit(5),
        supabase
          .from("events")
          .select("id, title, slug, starts_at, location, event_images(image_url, sort_order)")
          .eq("status", "published")
          .or(`title.ilike.%${safe}%,location.ilike.%${safe}%,short_description.ilike.%${safe}%`)
          .limit(5),
        supabase
          .from("marketplace_items")
          .select("id, title, slug, price, marketplace_images(image_url, sort_order)")
          .not("published_at", "is", null)
          .or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
          .limit(5),
        supabase
          .from("pages")
          .select("id, title, slug, tagline, logo_url")
          .eq("is_public", true)
          .or(`title.ilike.%${safe}%,tagline.ilike.%${safe}%`)
          .limit(3),
        supabase
          .from("parts")
          .select("id, title, slug, price_note, part_images(image_url, sort_order)")
          .eq("published", true)
          .or(`title.ilike.%${safe}%,description.ilike.%${safe}%`)
          .limit(5),
      ]);

      return {
        cars: carsRes.status === "fulfilled" ? (carsRes.value.data ?? []) : [],
        events: eventsRes.status === "fulfilled" ? (eventsRes.value.data ?? []) : [],
        marketplace: marketRes.status === "fulfilled" ? (marketRes.value.data ?? []) : [],
        pages: pagesRes.status === "fulfilled" ? (pagesRes.value.data ?? []) : [],
        parts: partsRes.status === "fulfilled" ? (partsRes.value.data ?? []) : [],
      };
    },
    enabled: active,
    staleTime: 10000,
  });

  const results: SearchResult[] = useMemo(() => {
    if (!data) return [];
    const all: SearchResult[] = [];

    for (const car of data.cars) {
      const imgs = [...((car as any).car_images ?? [])].sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
      all.push({
        id: car.id,
        title: car.title,
        subtitle: [car.year, car.brand, car.model].filter(Boolean).join(" · "),
        thumbnail: imgs[0]?.image_url ?? null,
        href: `/biler/${car.slug}`,
        section: "biler",
        sectionLabel: "Biler",
      });
    }

    for (const event of data.events) {
      const imgs = [...((event as any).event_images ?? [])].sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
      const d = new Date(event.starts_at);
      all.push({
        id: event.id,
        title: event.title,
        subtitle: `${d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" })} · ${event.location}`,
        thumbnail: imgs[0]?.image_url ?? null,
        href: `/e/${event.slug}`,
        section: "arrangement",
        sectionLabel: "Arrangement",
      });
    }

    for (const item of data.marketplace) {
      const imgs = [...((item as any).marketplace_images ?? [])].sort(
        (a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
      );
      all.push({
        id: item.id,
        title: item.title,
        subtitle: item.price != null ? `${item.price.toLocaleString("nb-NO")} kr` : undefined,
        thumbnail: imgs[0]?.image_url ?? null,
        href: `/annonse/${item.slug}`,
        section: "markedsplass",
        sectionLabel: "Markedsplass",
      });
    }

    for (const page of data.pages) {
      all.push({
        id: page.id,
        title: page.title,
        subtitle: page.tagline ?? undefined,
        thumbnail: page.logo_url ?? null,
        href: `/s/${page.slug}`,
        section: "sider",
        sectionLabel: "Sider",
      });
    }

    return all;
  }, [data]);

  return { results, isSearching: active && isFetching };
}
