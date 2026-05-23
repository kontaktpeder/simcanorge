import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { BrandHubForm } from "@/components/admin/brandHub/BrandHubForm";
import { useBrandHubById } from "@/hooks/admin/useBrandHubAdmin";

const AdminMerkehubEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id || id === "ny";
  const { data: hub, isLoading } = useBrandHubById(isNew ? undefined : id);

  const title = isNew
    ? "NY MERKEHUB"
    : `REDIGER ${hub?.title?.toUpperCase() ?? "MERKEHUB"}`;

  return (
    <AdminLayout title={title}>
      <Link
        to="/admin/merkehubber"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Til oversikt
      </Link>

      {isNew && (
        <div className="rounded-md border border-border bg-amber-500/10 px-4 py-3 mb-6 text-sm">
          <p className="font-medium text-foreground mb-1">
            Dette oppretter en merkehub, ikke en klubb
          </p>
          <p className="text-muted-foreground">
            Hub-en vises på <code>/merker/&lt;brand_key&gt;</code> som åpent
            oppslagsverk for merket. Klubber for samme merke (f.eks. Simca Norge)
            administreres fortsatt som egne sider med{" "}
            <code>page_type_variant = 'local'</code> og samme{" "}
            <code>brand_key</code>.
          </p>
        </div>
      )}

      {!isNew && isLoading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Laster…
        </div>
      ) : !isNew && !hub ? (
        <div className="text-muted-foreground py-12">Fant ikke merkehub-en.</div>
      ) : (
        <div className="max-w-3xl">
          <BrandHubForm
            existing={hub ?? null}
            onSaved={(res) => {
              if (isNew) {
                navigate(`/admin/merkehubber/${res.id}`);
              }
            }}
          />
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminMerkehubEditor;
