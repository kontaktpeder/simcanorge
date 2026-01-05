import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Part {
  id: string;
  title: string;
  description: string | null;
  published: boolean;
  category_id: string | null;
  categories: { name: string } | null;
}

const AdminDeler = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchParts = async () => {
    const { data, error } = await supabase
      .from("parts")
      .select("id, title, description, published, category_id, categories(name)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching parts:", error);
      toast.error("Kunne ikke hente deler");
    } else {
      setParts(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchParts();
  }, []);

  const togglePublish = async (part: Part) => {
    const { error } = await supabase
      .from("parts")
      .update({ published: !part.published })
      .eq("id", part.id);

    if (error) {
      toast.error("Kunne ikke oppdatere status");
    } else {
      toast.success(part.published ? "Del skjult" : "Del publisert!");
      fetchParts();
    }
  };

  const deletePart = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne delen?")) return;

    const { error } = await supabase.from("parts").delete().eq("id", id);

    if (error) {
      toast.error("Kunne ikke slette del");
    } else {
      toast.success("Del slettet");
      fetchParts();
    }
  };

  return (
    <AdminLayout title="DELER">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {parts.length} del{parts.length !== 1 ? "er" : ""} totalt
        </p>
        <button className="btn-retro bg-primary">
          <Plus className="w-5 h-5 mr-2" />
          Ny del
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">Laster...</div>
      ) : parts.length === 0 ? (
        <div className="retro-card text-center py-12">
          <p className="text-muted-foreground mb-4">Ingen deler lagt til ennå</p>
          <button className="btn-retro">
            <Plus className="w-5 h-5 mr-2" />
            Legg til din første del
          </button>
        </div>
      ) : (
        <div className="bg-card border-4 border-foreground overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-display">TITTEL</th>
                <th className="text-left p-4 font-display">KATEGORI</th>
                <th className="text-left p-4 font-display">STATUS</th>
                <th className="text-right p-4 font-display">HANDLINGER</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <tr key={part.id} className="border-t border-border">
                  <td className="p-4 font-medium">{part.title}</td>
                  <td className="p-4">
                    {part.categories?.name || (
                      <span className="text-muted-foreground">Ingen kategori</span>
                    )}
                  </td>
                  <td className="p-4">
                    {part.published ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Publisert
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <EyeOff className="w-4 h-4" />
                        Skjult
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => togglePublish(part)}
                        className="p-2 hover:bg-muted rounded"
                        title={part.published ? "Skjul" : "Publiser"}
                      >
                        {part.published ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5 text-green-600" />
                        )}
                      </button>
                      <button
                        className="p-2 hover:bg-muted rounded"
                        title="Rediger"
                      >
                        <Pencil className="w-5 h-5 text-primary" />
                      </button>
                      <button
                        onClick={() => deletePart(part.id)}
                        className="p-2 hover:bg-muted rounded"
                        title="Slett"
                      >
                        <Trash2 className="w-5 h-5 text-accent" />
                      </button>
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

export default AdminDeler;
