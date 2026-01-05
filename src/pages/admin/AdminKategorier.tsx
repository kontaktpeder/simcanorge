import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

const AdminKategorier = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", parent_id: "" });

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) {
      console.error("Error fetching categories:", error);
      toast.error("Kunne ikke hente kategorier");
    } else {
      setCategories(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const slug = formData.slug || generateSlug(formData.name);
    const categoryData = {
      name: formData.name,
      slug,
      parent_id: formData.parent_id || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("categories")
        .update(categoryData)
        .eq("id", editingId);

      if (error) {
        toast.error("Kunne ikke oppdatere kategori");
      } else {
        toast.success("Kategori oppdatert!");
        resetForm();
        fetchCategories();
      }
    } else {
      const { error } = await supabase.from("categories").insert(categoryData);

      if (error) {
        if (error.code === "23505") {
          toast.error("En kategori med dette navnet eksisterer allerede");
        } else {
          toast.error("Kunne ikke opprette kategori");
        }
      } else {
        toast.success("Kategori opprettet!");
        resetForm();
        fetchCategories();
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: "", slug: "", parent_id: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (category: Category) => {
    setFormData({
      name: category.name,
      slug: category.slug,
      parent_id: category.parent_id || "",
    });
    setEditingId(category.id);
    setShowForm(true);
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Er du sikker? Underkategorier blir også slettet.")) return;

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      toast.error("Kunne ikke slette kategori");
    } else {
      toast.success("Kategori slettet");
      fetchCategories();
    }
  };

  const parentCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  return (
    <AdminLayout title="KATEGORIER">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {categories.length} kategori{categories.length !== 1 ? "er" : ""} totalt
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-retro bg-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ny kategori
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="retro-card mb-6">
          <h3 className="font-display text-xl mb-4">
            {editingId ? "REDIGER KATEGORI" : "NY KATEGORI"}
          </h3>
          <div className="grid md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block font-display mb-2">NAVN</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full p-3 border-2 border-foreground"
                required
              />
            </div>
            <div>
              <label className="block font-display mb-2">SLUG (valgfritt)</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                placeholder={generateSlug(formData.name) || "auto-generert"}
                className="w-full p-3 border-2 border-foreground"
              />
            </div>
            <div>
              <label className="block font-display mb-2">HOVEDKATEGORI</label>
              <select
                value={formData.parent_id}
                onChange={(e) =>
                  setFormData({ ...formData, parent_id: e.target.value })
                }
                className="w-full p-3 border-2 border-foreground bg-card"
              >
                <option value="">Ingen (er hovedkategori)</option>
                {parentCategories
                  .filter((c) => c.id !== editingId)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
          <div className="flex gap-4">
            <button type="submit" className="btn-retro">
              {editingId ? "Oppdater" : "Opprett"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="btn-retro bg-muted text-foreground"
            >
              Avbryt
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="text-center py-12">Laster...</div>
      ) : categories.length === 0 ? (
        <div className="retro-card text-center py-12">
          <FolderTree className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Ingen kategorier ennå</p>
        </div>
      ) : (
        <div className="space-y-4">
          {parentCategories.map((parent) => (
            <div key={parent.id} className="retro-card">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-xl">{parent.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(parent)}
                    className="p-2 hover:bg-muted rounded"
                  >
                    <Pencil className="w-5 h-5 text-primary" />
                  </button>
                  <button
                    onClick={() => deleteCategory(parent.id)}
                    className="p-2 hover:bg-muted rounded"
                  >
                    <Trash2 className="w-5 h-5 text-accent" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-3">/{parent.slug}</p>

              {getChildren(parent.id).length > 0 && (
                <div className="pl-4 border-l-2 border-border space-y-2">
                  {getChildren(parent.id).map((child) => (
                    <div
                      key={child.id}
                      className="flex items-center justify-between py-2"
                    >
                      <div>
                        <span className="font-medium">{child.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          /{child.slug}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(child)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Pencil className="w-4 h-4 text-primary" />
                        </button>
                        <button
                          onClick={() => deleteCategory(child.id)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Trash2 className="w-4 h-4 text-accent" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminKategorier;
