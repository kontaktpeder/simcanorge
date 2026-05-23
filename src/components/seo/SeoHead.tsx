import { Helmet } from "react-helmet-async";
import { buildCanonicalUrl, DEFAULT_OG_IMAGE } from "@/lib/siteUrl";
import { SITE_NAME } from "@/config/site";

export type SeoOgType = "website" | "article" | "profile";

export interface SeoHeadProps {
  title: string;
  description?: string;
  /** Path only, e.g. "/biler" — query params strippes alltid */
  canonicalPath: string;
  image?: string;
  ogType?: SeoOgType;
  noindex?: boolean;
  /** Ekstra <script type="application/ld+json"> — én eller flere */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  children?: React.ReactNode;
}

export function SeoHead({
  title,
  description,
  canonicalPath,
  image,
  ogType = "website",
  noindex = false,
  jsonLd,
  children,
}: SeoHeadProps) {
  const canonicalUrl = buildCanonicalUrl(canonicalPath);
  const ogImage = image ?? DEFAULT_OG_IMAGE;
  const siteName = SITE_NAME;

  const ldBlocks = jsonLd
    ? Array.isArray(jsonLd)
      ? jsonLd
      : [jsonLd]
    : [];

  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonicalUrl} />

      {noindex && <meta name="robots" content="noindex, follow" />}

      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />

      {ldBlocks.map((block, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(block)}
        </script>
      ))}

      {children}
    </Helmet>
  );
}

/** Standard defaults for sider uten egen copy */
export const SEO_COPY = {
  biler: {
    title: "Arkivet — Biler dokumentert i Norge | Bilgarasje.no",
    description:
      "Utforsk historier om biler i Norge. Søk etter merke, modell og årstall i bilarkivet.",
    canonicalPath: "/biler",
  },
  utforsk: {
    title: "Utforsk — Bilgarasje.no",
    description:
      "Utforsk øyeblikk fra norske bileiere — biler, spotting og hverdagshistorier.",
    canonicalPath: "/hjem",
  },
  markedsplass: {
    title: "Markedsplass | Bilgarasje.no",
    description: "Deler, tilbehør og annonser for bilentusiaster i Norge.",
    canonicalPath: "/markedsplass",
  },
  onboarding: {
    title: "Legg inn bilen din | Bilgarasje.no",
    description:
      "Gi bilen din en skikkelig plass på nett. Bilder, historie og en delbar bilside.",
    canonicalPath: "/legg-inn-bil",
  },
} as const;
