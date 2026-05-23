import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ExternalLink, Loader2, Save } from "lucide-react";
import { PageImageUpload } from "@/components/pages/PageImageUpload";
import { BrandHubSeoReadiness } from "./BrandHubSeoReadiness";
import { toBrandKey, brandHubPath } from "@/lib/brandSlug";
import { evaluateBrandHubSeoReadiness } from "@/lib/brandHubSeo";
import { useBrandHubCarCount } from "@/hooks/useBrandHubCarCount";
import {
  useSaveBrandHub,
  type BrandHubFormValues,
  type BrandHubRow,
} from "@/hooks/admin/useBrandHubAdmin";

const EMPTY: BrandHubFormValues = {
  title: "",
  brand_key: "",
  slug: "",
  tagline: "",
  about: "",
  logo_url: "",
  cover_url: "",
  related_brand_keys: [],
  status: "draft",
  is_public: false,
};

function rowToValues(row: BrandHubRow): BrandHubFormValues {
  return {
    title: row.title ?? "",
    brand_key: row.brand_key ?? "",
    slug: row.slug ?? "",
    tagline: row.tagline ?? "",
    about: row.about ?? "",
    logo_url: row.logo_url ?? "",
    cover_url: row.cover_url ?? "",
    related_brand_keys: row.related_brand_keys ?? [],
    status: (row.status as "draft" | "active") ?? "draft",
    is_public: row.is_public,
  };
}

interface Props {
  existing?: BrandHubRow | null;
  onSaved?: (result: { id: string; brand_key: string; slug: string }) => void;
}

export function BrandHubForm({ existing, onSaved }: Props) {
  const isEdit = !!existing;
  const [values, setValues] = useState<BrandHubFormValues>(
    existing ? rowToValues(existing) : EMPTY,
  );
  const [keyTouched, setKeyTouched] = useState(isEdit);
  const [relatedText, setRelatedText] = useState(
    (existing?.related_brand_keys ?? []).join(", "),
  );

  const save = useSaveBrandHub();
  const carCountQ = useBrandHubCarCount(values.brand_key || undefined);

  // Auto-generer brand_key fra title til bruker har redigert key manuelt
  useEffect(() => {
    if (!keyTouched && values.title) {
      setValues((v) => ({ ...v, brand_key: toBrandKey(v.title) }));
    }
  }, [values.title, keyTouched]);

  const aboutLen = values.about.trim().length;
  const seo = useMemo(
    () =>
      evaluateBrandHubSeoReadiness({
        title: values.title,
        brandKey: values.brand_key,
        about: values.about,
        carCount: carCountQ.data ?? 0,
      }),
    [values.title, values.brand_key, values.about, carCountQ.data],
  );

  const preview = values.brand_key
    ? `bilgarasje.no${brandHubPath(values.brand_key)}`
    : "bilgarasje.no/merker/…";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.title.trim()) {
      toast.error("Merkenavn er påkrevd");
      return;
    }
    if (!values.brand_key.trim()) {
      toast.error("Brand key er påkrevd");
      return;
    }
    const parsedRelated = relatedText
      .split(",")
      .map((s) => toBrandKey(s.trim()))
      .filter(Boolean);

    try {
      const result = await save.mutateAsync({
        id: existing?.id,
        values: {
          ...values,
          related_brand_keys: parsedRelated,
          is_public: values.status === "active",
        },
      });
      toast.success(isEdit ? "Merkehub oppdatert" : "Merkehub opprettet");
      onSaved?.(result);
    } catch (err: any) {
      const msg = String(err?.message ?? "");
      if (msg.includes("pages_brand_hub_unique_idx") || err?.code === "23505") {
        toast.error("Det finnes allerede en merkehub for dette brand_key");
      } else {
        toast.error(msg || "Klarte ikke å lagre");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">Merkenavn *</label>
          <input
            type="text"
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
            placeholder="Simca"
            className="w-full p-2.5 border border-border rounded-md bg-background focus:border-primary focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Brand key * {isEdit && <span className="text-xs text-muted-foreground">(låst)</span>}
          </label>
          <input
            type="text"
            value={values.brand_key}
            onChange={(e) => {
              setKeyTouched(true);
              setValues({ ...values, brand_key: toBrandKey(e.target.value) });
            }}
            placeholder="simca"
            readOnly={isEdit}
            className="w-full p-2.5 border border-border rounded-md bg-background focus:border-primary focus:outline-none disabled:opacity-60"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            Kun a–z, 0–9 og bindestrek. Brukes i URL-en og må være unik.
          </p>
        </div>
      </div>

      <div className="rounded-md bg-muted/50 border border-border px-3 py-2 flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Forhåndsvisning:</span>
        {values.status === "active" && values.brand_key ? (
          <a
            href={brandHubPath(values.brand_key)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline font-mono"
          >
            {preview}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <span className="font-mono text-foreground/80">{preview}</span>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Tagline</label>
        <input
          type="text"
          value={values.tagline}
          onChange={(e) => setValues({ ...values, tagline: e.target.value })}
          placeholder="Fransk eleganse på norske veier"
          className="w-full p-2.5 border border-border rounded-md bg-background focus:border-primary focus:outline-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium">Historietekst (about)</label>
          <span className={`text-xs ${aboutLen >= 400 ? "text-green-600" : "text-muted-foreground"}`}>
            {aboutLen} / 400 tegn
          </span>
        </div>
        <textarea
          value={values.about}
          onChange={(e) => setValues({ ...values, about: e.target.value })}
          rows={8}
          placeholder="Skriv historien om merket — minst 400 tegn for at hub-en skal regnes som SEO-klar."
          className="w-full p-2.5 border border-border rounded-md bg-background focus:border-primary focus:outline-none"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <PageImageUpload
          label="Logo"
          currentUrl={values.logo_url || null}
          storagePath={`pages/brand/${values.brand_key || "ny"}/logo.webp`}
          aspectClass="aspect-square"
          onUploaded={(url) => setValues({ ...values, logo_url: url })}
          onRemoved={() => setValues({ ...values, logo_url: "" })}
        />
        <PageImageUpload
          label="Cover"
          currentUrl={values.cover_url || null}
          storagePath={`pages/brand/${values.brand_key || "ny"}/cover.webp`}
          aspectClass="aspect-video"
          onUploaded={(url) => setValues({ ...values, cover_url: url })}
          onRemoved={() => setValues({ ...values, cover_url: "" })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Relaterte merker</label>
        <input
          type="text"
          value={relatedText}
          onChange={(e) => setRelatedText(e.target.value)}
          placeholder="talbot, matra, peugeot"
          className="w-full p-2.5 border border-border rounded-md bg-background focus:border-primary focus:outline-none"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Komma-separert. Hver verdi normaliseres til brand_key (lowercase, bindestrek).
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">Status</label>
        <select
          value={values.status}
          onChange={(e) =>
            setValues({ ...values, status: e.target.value as "draft" | "active" })
          }
          className="w-full p-2.5 border border-border rounded-md bg-background focus:border-primary focus:outline-none"
        >
          <option value="draft">Utkast (skjult)</option>
          <option value="active">Aktiv (offentlig)</option>
        </select>
      </div>

      <BrandHubSeoReadiness ready={seo.ready} checks={seo.checks} />

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-60"
        >
          {save.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Lagre merkehub
        </button>
        <Link
          to="/admin/merkehubber"
          className="px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground"
        >
          Avbryt
        </Link>
      </div>
    </form>
  );
}
