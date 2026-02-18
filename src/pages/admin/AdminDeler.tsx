import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Upload, Wrench } from "lucide-react";
import { toast } from "sonner";
import { compressImage, generateImageId, getPartImagePath, formatFileSize, type CompressionProgress } from "@/lib/imageCompression";
import { ImageUploadProgress } from "@/components/ui/image-upload-progress";
import { ImageUploadWithOrder, type ImageItem } from "@/components/shared/ImageUploadWithOrder";
import { DelerAnnonseForm } from "@/components/markedsplass/DelerAnnonseForm";
import { useUnifiedCategories, getRootCategories, getSubcategories, getCategoryPath } from "@/hooks/useUnifiedCategories";
import type { ItemFormValues } from "@/lib/itemSubmit";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
}

interface PartImage {
  id: string;
  image_url: string;
  sort_order: number;
}

interface Part {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  published: boolean;
  category_id: string | null;
  price_min: number | null;
  price_max: number | null;
  price_note: string | null;
  categories: { name: string } | null;
  part_images?: PartImage[];
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
  const [uploadProgress, setUploadProgress] = useState<CompressionProgress | null>(null);
  const [compressionStats, setCompressionStats] = useState<{ originalSize: number; compressedSize: number; reduction: number } | null>(null);
  const [partImages, setPartImages] = useState<PartImage[]>([]);
  const [isUploadingPartImages, setIsUploadingPartImages] = useState(false);
  const [isReorderingPartImages, setIsReorderingPartImages] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    published: false,
    price_min: "" as string | number,
    price_max: "" as string | number,
    price_note: "",
  });

  const fetchData = async () => {
    const [partsRes, categoriesRes] = await Promise.all([
      supabase
        .from("parts")
        .select("id, title, description, image_url, published, category_id, price_min, price_max, price_note, categories(name), part_images(id, image_url, sort_order)")
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);

    if (partsRes.error) {
      console.error("Error fetching parts:", partsRes.error);
      toast.error("Kunne ikke hente deler");
    } else {
      setParts((partsRes.data as unknown as Part[]) || []);
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
    setFormData({ title: "", description: "", category_id: "", published: false, price_min: "", price_max: "", price_note: "" });
    setEditingId(null);
    setShowForm(false);
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(null);
    setCompressionStats(null);
    setPartImages([]);
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

  const uploadImage = async (file: File, partId?: string): Promise<string | null> => {
    setUploadProgress({ stage: 'compressing', current: 1, total: 1, percentage: 50 });
    const result = await compressImage(file);
    setCompressionStats({ originalSize: result.originalSize, compressedSize: result.compressedSize, reduction: result.reduction });
    setUploadProgress({ stage: 'uploading', current: 1, total: 1, percentage: 100 });

    const imageId = generateImageId();
    const filePath = partId ? getPartImagePath(partId, imageId) : `parts/${imageId}/original.webp`;

    const { error } = await supabase.storage.from("simca-images").upload(filePath, result.file);
    if (error) {
      console.error("Error uploading image:", error);
      toast.error("Kunne ikke laste opp bilde");
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from("simca-images").getPublicUrl(filePath);
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
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const partData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id || null,
        published: formData.published,
        price_min: formData.price_min === "" ? null : Number(formData.price_min),
        price_max: formData.price_max === "" ? null : Number(formData.price_max),
        price_note: formData.price_note.trim() || null,
        ...(imageUrl && { image_url: imageUrl }),
      };

      if (editingId) {
        const { error } = await supabase.from("parts").update(partData).eq("id", editingId);
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
      price_min: part.price_min ?? "",
      price_max: part.price_max ?? "",
      price_note: part.price_note || "",
    });
    setEditingId(part.id);
    setImagePreview(part.image_url);
    setPartImages((part.part_images || []).sort((a, b) => a.sort_order - b.sort_order));
    setShowForm(true);
  };

  const togglePublish = async (part: Part) => {
    const { error } = await supabase.from("parts").update({ published: !part.published }).eq("id", part.id);
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

  const handlePartImageReorder = async (reordered: ImageItem[]) => {
    setIsReorderingPartImages(true);
    try {
      for (let i = 0; i < reordered.length; i++) {
        await supabase.from("part_images").update({ sort_order: i }).eq("id", reordered[i].id);
      }
      setPartImages(reordered.map((img, i) => ({ id: img.id, image_url: img.image_url, sort_order: i })));
    } finally {
      setIsReorderingPartImages(false);
    }
  };

  const handlePartImageDelete = async (imageId: string) => {
    await supabase.from("part_images").delete().eq("id", imageId);
    setPartImages((prev) => prev.filter((p) => p.id !== imageId));
  };

  const handlePartImageUpload = async (files: File[]) => {
    if (!editingId) return;
    setIsUploadingPartImages(true);
    try {
      const { compressImages } = await import("@/lib/imageCompression");
      const results = await compressImages(files);
      const startOrder = partImages.length;
      for (let i = 0; i < results.length; i++) {
        const imageId = generateImageId();
        const path = getPartImagePath(editingId, imageId);
        const { error: upErr } = await supabase.storage.from("simca-images").upload(path, results[i].file, { contentType: "image/webp" });
        if (upErr) continue;
        const { data: urlData } = supabase.storage.from("simca-images").getPublicUrl(path);
        const { data: inserted } = await supabase.from("part_images").insert({
          part_id: editingId,
          image_url: urlData.publicUrl,
          sort_order: startOrder + i,
        }).select("id, image_url, sort_order").single();
        if (inserted) {
          setPartImages((prev) => [...prev, inserted]);
        }
      }
      toast.success("Bilder lastet opp!");
    } finally {
      setIsUploadingPartImages(false);
    }
  };

  const getCoverImage = (part: Part): string | null => {
    if (part.part_images?.length) {
      const sorted = [...part.part_images].sort((a, b) => a.sort_order - b.sort_order);
      return sorted[0]?.image_url ?? null;
    }
    return part.image_url;
  };

  const formatPrice = (part: Part): string | null => {
    if (part.price_min != null && part.price_max != null) return `${part.price_min}–${part.price_max} kr`;
    if (part.price_min != null) return `${part.price_min} kr`;
    if (part.price_max != null) return `${part.price_max} kr`;
    return null;
  };

  return (
    <AdminLayout title="DELER">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {parts.length} del{parts.length !== 1 ? "er" : ""} totalt
        </p>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-retro bg-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ny del
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/50 z-50 overflow-y-auto">
          <div className="flex justify-center p-2 sm:p-4 pt-0">
            <div className="bg-card border-4 border-foreground w-full max-w-2xl">
              <div className="flex items-center justify-between p-3 sm:p-4 border-b-2 border-foreground sticky top-0 bg-card z-10">
                <h2 className="font-display text-xl sm:text-2xl">
                  {editingId ? "REDIGER DEL" : "NY DEL"}
                </h2>
                <button onClick={resetForm} className="p-2 hover:bg-muted rounded">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-3 sm:p-6">
                <DelerAnnonseForm
                  initialValues={{
                    title: formData.title,
                    description: formData.description,
                    categoryId: formData.category_id,
                    priceMin: String(formData.price_min ?? ''),
                    priceMax: String(formData.price_max ?? ''),
                    priceNote: formData.price_note,
                    condition: '',
                    location: '',
                  }}
                  onSubmit={async (v) => {
                    setIsSubmitting(true);
                    try {
                      let imageUrl: string | null = null;
                      if (imageFile) {
                        imageUrl = await uploadImage(imageFile);
                      }

                      const partData = {
                        title: v.title.trim(),
                        description: v.description.trim() || null,
                        category_id: v.categoryId || null,
                        published: formData.published,
                        price_min: v.priceMin === "" ? null : Number(v.priceMin),
                        price_max: v.priceMax === "" ? null : Number(v.priceMax),
                        price_note: v.priceNote.trim() || null,
                        condition: v.condition || null,
                        ...(imageUrl && { image_url: imageUrl }),
                      };

                      if (editingId) {
                        const { error } = await supabase.from("parts").update(partData).eq("id", editingId);
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
                  }}
                  onCancel={resetForm}
                  submitLabel={editingId ? "Oppdater" : "Opprett"}
                  isSubmitting={isSubmitting}
                  canPublishDirectly
                  published={formData.published}
                  onPublishedChange={(p) => setFormData({ ...formData, published: p })}
                >
                  {/* Images */}
                  <div>
                    <label className="block font-display text-sm sm:text-base mb-1.5 sm:mb-2">BILDER {editingId ? "(maks 5)" : ""}</label>
                    {editingId ? (
                      <ImageUploadWithOrder
                        images={partImages.map((img) => ({
                          id: img.id,
                          image_url: img.image_url,
                          sort_order: img.sort_order,
                        }))}
                        maxImages={5}
                        mainLabel="Hovedbilde"
                        isUploading={isUploadingPartImages}
                        isReordering={isReorderingPartImages}
                        onReorder={handlePartImageReorder}
                        onSetMain={async (index) => {
                          const sorted = [...partImages].sort((a, b) => a.sort_order - b.sort_order);
                          const [picked] = sorted.splice(index, 1);
                          sorted.unshift(picked);
                          await handlePartImageReorder(sorted.map((img, i) => ({ ...img, sort_order: i })));
                        }}
                        onDelete={handlePartImageDelete}
                        onUpload={handlePartImageUpload}
                        altFallback={formData.title || "Del"}
                      />
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center sm:items-start">
                        {imagePreview ? (
                          <div className="relative w-24 h-24 sm:w-32 sm:h-32 border-2 border-foreground rounded overflow-hidden">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => { setImageFile(null); setImagePreview(null); }}
                              className="absolute -top-1 -right-1 bg-accent text-accent-foreground p-1 rounded-full"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 sm:w-32 sm:h-32 border-2 border-dashed border-muted-foreground flex items-center justify-center rounded">
                            <Wrench className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                          </div>
                        )}
                        <label className="flex-1 cursor-pointer w-full sm:w-auto">
                          <div className="p-4 border-2 border-dashed border-muted-foreground hover:border-primary transition-colors text-center rounded">
                            <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                            <span className="text-xs sm:text-sm text-muted-foreground">Klikk for å laste opp bilde</span>
                          </div>
                          <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        </label>
                      </div>
                    )}
                    {isSubmitting && uploadProgress && (
                      <ImageUploadProgress progress={uploadProgress} compressionStats={compressionStats} />
                    )}
                  </div>
                </DelerAnnonseForm>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-12">Laster...</div>
      ) : parts.length === 0 ? (
        <div className="bg-card border border-border rounded-xl text-center py-12">
          <Wrench className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Ingen deler lagt til ennå</p>
          <button onClick={() => setShowForm(true)} className="btn-retro">
            <Plus className="w-5 h-5 mr-2" />
            Legg til din første del
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {parts.map((part) => {
              const coverImage = getCoverImage(part);
              const price = formatPrice(part);
              return (
                <div key={part.id} className="bg-card border border-border rounded-xl p-3">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                      {coverImage ? (
                        <img src={coverImage} alt={part.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Wrench className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-medium text-sm truncate block">{part.title}</span>
                          <p className="text-xs text-muted-foreground">{part.categories?.name || "Ingen kategori"}</p>
                          {price && <p className="text-xs text-primary font-medium mt-0.5">{price}</p>}
                          {part.price_note && <p className="text-xs text-muted-foreground mt-0.5">{part.price_note}</p>}
                        </div>
                        {part.published ? (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex-shrink-0">Publisert</span>
                        ) : (
                          <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex-shrink-0">Skjult</span>
                        )}
                      </div>
                      <div className="flex items-center justify-end mt-2 gap-0.5">
                        <button onClick={() => togglePublish(part)} className="p-1.5 hover:bg-muted rounded">
                          {part.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-green-600" />}
                        </button>
                        <button onClick={() => startEdit(part)} className="p-1.5 hover:bg-muted rounded">
                          <Pencil className="w-4 h-4 text-primary" />
                        </button>
                        <button onClick={() => deletePart(part.id)} className="p-1.5 hover:bg-muted rounded">
                          <Trash2 className="w-4 h-4 text-accent" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-display text-sm w-16">BILDE</th>
                  <th className="text-left p-4 font-display text-sm">TITTEL</th>
                  <th className="text-left p-4 font-display text-sm">KATEGORI</th>
                  <th className="text-left p-4 font-display text-sm">PRIS</th>
                  <th className="text-left p-4 font-display text-sm">STATUS</th>
                  <th className="text-right p-4 font-display text-sm">HANDLINGER</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((part) => {
                  const coverImage = getCoverImage(part);
                  const price = formatPrice(part);
                  return (
                    <tr key={part.id} className="border-t border-border">
                      <td className="p-4">
                        <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                          {coverImage ? (
                            <img src={coverImage} alt={part.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Wrench className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-medium">{part.title}</td>
                      <td className="p-4">{part.categories?.name || <span className="text-muted-foreground">Ingen kategori</span>}</td>
                      <td className="p-4">
                        {price ? (
                          <span className="text-primary font-medium text-sm">{price}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">–</span>
                        )}
                        {part.price_note && <p className="text-xs text-muted-foreground mt-0.5">{part.price_note}</p>}
                      </td>
                      <td className="p-4">
                        {part.published ? (
                          <span className="text-green-600 flex items-center gap-1"><Eye className="w-4 h-4" />Publisert</span>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-1"><EyeOff className="w-4 h-4" />Skjult</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => togglePublish(part)} className="p-2 hover:bg-muted rounded" title={part.published ? "Skjul" : "Publiser"}>
                            {part.published ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5 text-green-600" />}
                          </button>
                          <button onClick={() => startEdit(part)} className="p-2 hover:bg-muted rounded" title="Rediger">
                            <Pencil className="w-5 h-5 text-primary" />
                          </button>
                          <button onClick={() => deletePart(part.id)} className="p-2 hover:bg-muted rounded" title="Slett">
                            <Trash2 className="w-5 h-5 text-accent" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default AdminDeler;
