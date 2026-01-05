import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Upload, Wrench } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface Part {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  published: boolean;
  category_id: string | null;
  categories: { name: string } | null;
}

const AdminDeler = () => {
  const [parts, setParts] = useState<Part[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    published: false,
  });

  const fetchData = async () => {
    const [partsRes, categoriesRes] = await Promise.all([
      supabase
        .from("parts")
        .select("id, title, description, image_url, published, category_id, categories(name)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);

    if (partsRes.error) {
      console.error("Error fetching parts:", partsRes.error);
      toast.error("Kunne ikke hente deler");
    } else {
      setParts(partsRes.data || []);
    }

    if (categoriesRes.data) {
      setCategories(categoriesRes.data);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parentCategories = categories.filter((c) => !c.parent_id);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parent_id === parentId);

  const resetForm = () => {
    setFormData({ title: "", description: "", category_id: "", published: false });
    setEditingId(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `parts/${fileName}`;

    const { error } = await supabase.storage
      .from("simca-images")
      .upload(filePath, file);

    if (error) {
      console.error("Error uploading image:", error);
      toast.error("Kunne ikke laste opp bilde");
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("simca-images")
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error("Tittel er påkrevd");
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl: string | null = null;

      // Upload image if selected
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const partData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id || null,
        published: formData.published,
        ...(imageUrl && { image_url: imageUrl }),
      };

      if (editingId) {
        const { error } = await supabase
          .from("parts")
          .update(partData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Del oppdatert!");
      } else {
        const { error } = await supabase.from("parts").insert(partData);
        if (error) throw error;
        toast.success("Del opprettet!");
      }

      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Error saving part:", error);
      toast.error("Kunne ikke lagre del");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (part: Part) => {
    setFormData({
      title: part.title,
      description: part.description || "",
      category_id: part.category_id || "",
      published: part.published,
    });
    setEditingId(part.id);
    setImagePreview(part.image_url);
    setShowForm(true);
  };

  const togglePublish = async (part: Part) => {
    const { error } = await supabase
      .from("parts")
      .update({ published: !part.published })
      .eq("id", part.id);

    if (error) {
      toast.error("Kunne ikke oppdatere status");
    } else {
      toast.success(part.published ? "Del skjult" : "Del publisert!");
      fetchData();
    }
  };

  const deletePart = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne delen?")) return;

    const { error } = await supabase.from("parts").delete().eq("id", id);

    if (error) {
      toast.error("Kunne ikke slette del");
    } else {
      toast.success("Del slettet");
      fetchData();
    }
  };

  return (
    <AdminLayout title="DELER">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {parts.length} del{parts.length !== 1 ? "er" : ""} totalt
        </p>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-retro bg-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ny del
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-center justify-center p-4">
          <div className="bg-card border-4 border-foreground w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b-2 border-foreground">
              <h2 className="font-display text-2xl">
                {editingId ? "REDIGER DEL" : "NY DEL"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-muted rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Title */}
              <div>
                <label className="block font-display mb-2">TITTEL *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full p-3 border-2 border-foreground bg-card"
                  placeholder="f.eks. Bremsekloss fremre"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block font-display mb-2">KATEGORI</label>
                <select
                  value={formData.category_id}
                  onChange={(e) =>
                    setFormData({ ...formData, category_id: e.target.value })
                  }
                  className="w-full p-3 border-2 border-foreground bg-card"
                >
                  <option value="">Velg kategori...</option>
                  {parentCategories.map((parent) => (
                    <optgroup key={parent.id} label={parent.name}>
                      <option value={parent.id}>{parent.name} (hovedkategori)</option>
                      {getChildren(parent.id).map((child) => (
                        <option key={child.id} value={child.id}>
                          └ {child.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block font-display mb-2">BESKRIVELSE</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full p-3 border-2 border-foreground bg-card resize-none"
                  placeholder="Kort beskrivelse av delen..."
                />
              </div>

              {/* Image */}
              <div>
                <label className="block font-display mb-2">BILDE</label>
                <div className="flex gap-4 items-start">
                  {imagePreview ? (
                    <div className="relative w-32 h-32 border-2 border-foreground">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute -top-2 -right-2 bg-accent text-accent-foreground p-1 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 border-2 border-dashed border-muted-foreground flex items-center justify-center">
                      <Wrench className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <label className="flex-1 cursor-pointer">
                    <div className="p-4 border-2 border-dashed border-muted-foreground hover:border-primary transition-colors text-center">
                      <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Klikk for å laste opp bilde
                      </span>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Published toggle */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="published"
                  checked={formData.published}
                  onChange={(e) =>
                    setFormData({ ...formData, published: e.target.checked })
                  }
                  className="w-5 h-5"
                />
                <label htmlFor="published" className="font-display">
                  PUBLISER NÅ
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-retro flex-1 disabled:opacity-50"
                >
                  {isSubmitting
                    ? "Lagrer..."
                    : editingId
                    ? "Oppdater"
                    : "Opprett"}
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
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">Laster...</div>
      ) : parts.length === 0 ? (
        <div className="retro-card text-center py-12">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Ingen deler lagt til ennå</p>
          <button onClick={() => setShowForm(true)} className="btn-retro">
            <Plus className="w-5 h-5 mr-2" />
            Legg til din første del
          </button>
        </div>
      ) : (
        <div className="bg-card border-4 border-foreground overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-display w-16">BILDE</th>
                <th className="text-left p-4 font-display">TITTEL</th>
                <th className="text-left p-4 font-display">KATEGORI</th>
                <th className="text-left p-4 font-display">STATUS</th>
                <th className="text-right p-4 font-display">HANDLINGER</th>
              </tr>
            </thead>
            <tbody>
              {parts.map((part) => (
                <tr key={part.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                      {part.image_url ? (
                        <img
                          src={part.image_url}
                          alt={part.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Wrench className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </td>
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
                        onClick={() => startEdit(part)}
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
