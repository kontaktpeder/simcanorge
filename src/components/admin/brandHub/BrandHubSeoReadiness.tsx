import { Check, X } from "lucide-react";
import type { BrandHubSeoCheck } from "@/lib/brandHubSeo";

interface Props {
  ready: boolean;
  checks: BrandHubSeoCheck[];
}

export function BrandHubSeoReadiness({ ready, checks }: Props) {
  const missing = checks.filter((c) => !c.ok);
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            ready
              ? "bg-green-500/15 text-green-700 dark:text-green-300"
              : "bg-red-500/15 text-red-700 dark:text-red-300"
          }`}
        >
          {ready ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
          SEO-status: {ready ? "Klar" : "Ikke klar"}
        </span>
      </div>

      <ul className="space-y-1.5 text-sm">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start gap-2">
            {c.ok ? (
              <Check className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
            ) : (
              <X className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
            )}
            <div>
              <span className={c.ok ? "text-foreground" : "text-foreground font-medium"}>
                {c.label}
              </span>
              {c.detail && (
                <span className="text-muted-foreground ml-2 text-xs">({c.detail})</span>
              )}
            </div>
          </li>
        ))}
      </ul>

      {!ready && missing.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Fyll inn punktene over for å gjøre hub-en klar for søk.
        </p>
      )}

      <p className="text-[11px] text-muted-foreground border-t border-border pt-2">
        Vises i sitemap når <code>VITE_FEATURE_SEO_HUB_INDEXING=true</code> og siden er
        aktiv og offentlig.
      </p>
    </div>
  );
}
