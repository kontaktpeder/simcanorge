import { Link } from "react-router-dom";
import { ExternalLink, Loader2, Plus, Tag, Pencil } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useBrandHubList } from "@/hooks/admin/useBrandHubAdmin";
import { brandHubPath } from "@/lib/brandSlug";

const AdminMerkehubber = () => {
  const { data: hubs, isLoading, error } = useBrandHubList();

  return (
    <AdminLayout title="MERKEHUBBER">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground text-sm">
          {hubs?.length ?? 0} merkehub
          {(hubs?.length ?? 0) === 1 ? "" : "ber"} totalt
        </p>
        <Link
          to="/admin/merkehubber/ny"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          Ny merkehub
        </Link>
      </div>

      <div className="rounded-md border border-border bg-blue-500/5 px-4 py-3 mb-6 text-sm">
        <p className="font-medium text-foreground mb-1">Merkehub vs. klubb</p>
        <p className="text-muted-foreground">
          En <strong>merkehub</strong> (<code>page_type_variant = 'brand'</code>) vises
          på <code>/merker/&lt;brand_key&gt;</code>. <strong>Klubber</strong> for samme
          merke administreres som vanlige sider med <code>variant = 'local'</code> og
          samme <code>brand_key</code>, og dukker opp under «Klubber» på hub-en.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Laster merkehubber…
        </div>
      ) : error ? (
        <div className="text-red-600 py-4">
          Klarte ikke å hente merkehubber: {(error as Error).message}
        </div>
      ) : !hubs || hubs.length === 0 ? (
        <div className="border border-border rounded-md bg-card text-center py-12">
          <Tag className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Ingen merkehubber ennå</p>
          <Link
            to="/admin/merkehubber/ny"
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm"
          >
            <Plus className="w-4 h-4" />
            Opprett første merkehub
          </Link>
        </div>
      ) : (
        <div className="border border-border rounded-md overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-2.5 font-medium">Merke</th>
                <th className="text-left px-4 py-2.5 font-medium">brand_key</th>
                <th className="text-left px-4 py-2.5 font-medium">Status</th>
                <th className="text-right px-4 py-2.5 font-medium">Handlinger</th>
              </tr>
            </thead>
            <tbody>
              {hubs.map((h) => (
                <tr
                  key={h.id}
                  className="border-t border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {h.logo_url ? (
                        <img
                          src={h.logo_url}
                          alt=""
                          className="w-7 h-7 rounded object-cover border border-border"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded bg-muted flex items-center justify-center">
                          <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <span className="font-medium">{h.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {h.brand_key ?? "–"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        h.status === "active" && h.is_public
                          ? "bg-green-500/15 text-green-700 dark:text-green-300"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {h.status === "active" && h.is_public ? "Aktiv" : "Utkast"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {h.brand_key && (
                        <a
                          href={brandHubPath(h.brand_key)}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Åpne offentlig side"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        to={`/admin/merkehubber/${h.id}`}
                        className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
                        title="Rediger"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMerkehubber;
