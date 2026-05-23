import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toBrandKey } from "@/lib/brandSlug";

export type BrandHubRow = {
  id: string;
  title: string;
  slug: string;
  brand_key: string | null;
  tagline: string | null;
  about: string | null;
  logo_url: string | null;
  cover_url: string | null;
  related_brand_keys: string[];
  status: string;
  is_public: boolean;
  page_type: string;
  page_type_variant: string | null;
  updated_at: string;
  created_at: string;
};

export type BrandHubFormValues = {
  title: string;
  brand_key: string;
  slug: string;
  tagline: string;
  about: string;
  logo_url: string;
  cover_url: string;
  related_brand_keys: string[];
  status: "draft" | "active";
  is_public: boolean;
};

const SELECT_COLS =
  "id, title, slug, brand_key, tagline, about, logo_url, cover_url, related_brand_keys, status, is_public, page_type, page_type_variant, created_at, updated_at";

export function useBrandHubList() {
  return useQuery({
    queryKey: ["admin", "brand-hubs"],
    queryFn: async (): Promise<BrandHubRow[]> => {
      const { data, error } = await supabase
        .from("pages")
        .select(SELECT_COLS)
        .eq("page_type_variant", "brand")
        .order("title", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as BrandHubRow[];
    },
  });
}

export function useBrandHubById(id: string | undefined) {
  return useQuery({
    queryKey: ["admin", "brand-hub", id],
    enabled: !!id,
    queryFn: async (): Promise<BrandHubRow | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("pages")
        .select(SELECT_COLS)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as BrandHubRow | null;
    },
  });
}

function buildPayload(values: BrandHubFormValues) {
  const key = toBrandKey(values.brand_key || values.title);
  const slug = (values.slug || `merke-${key}`).trim();
  return {
    page_type: "club",
    page_type_variant: "brand",
    page_template: "modern",
    brand_key: key,
    slug,
    title: values.title.trim(),
    tagline: values.tagline.trim() || null,
    about: values.about.trim() || null,
    logo_url: values.logo_url.trim() || null,
    cover_url: values.cover_url.trim() || null,
    related_brand_keys: values.related_brand_keys
      .map((k) => toBrandKey(k))
      .filter(Boolean),
    status: values.status,
    is_public: values.status === "active" ? values.is_public : false,
    contact_email: "kontakt@bilgarasje.no",
  };
}

export function useSaveBrandHub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: BrandHubFormValues;
    }): Promise<{ id: string; brand_key: string; slug: string }> => {
      const payload = buildPayload(values);
      if (id) {
        // Ved edit: ikke endre brand_key (DB-unik på (brand_key, variant=brand))
        const { brand_key: _omit, ...rest } = payload;
        const { data, error } = await supabase
          .from("pages")
          .update(rest)
          .eq("id", id)
          .select("id, brand_key, slug")
          .single();
        if (error) throw error;
        return data as { id: string; brand_key: string; slug: string };
      }
      const { data, error } = await supabase
        .from("pages")
        .insert(payload)
        .select("id, brand_key, slug")
        .single();
      if (error) throw error;
      return data as { id: string; brand_key: string; slug: string };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "brand-hubs"] });
      if (vars.id) {
        qc.invalidateQueries({ queryKey: ["admin", "brand-hub", vars.id] });
      }
      qc.invalidateQueries({ queryKey: ["brand-hub-page"] });
    },
  });
}

export function useDeleteBrandHub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pages").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "brand-hubs"] });
    },
  });
}
