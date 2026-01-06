import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Upload, Car, Star, StarOff } from "lucide-react";
import { toast } from "sonner";
import { CAR_BRANDS, getModelsForBrand, getYearsForModel, generateCarTitle } from "@/data/carBrands";

interface CarImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

interface CarPost {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  model: string;
  year: number | null;
  story: string | null;
  overhauled: boolean;
  tags: string[];
  featured: boolean;
  published_at: string | null;
  created_at: string;
  category: string;
  car_images: CarImage[];
}

const CATEGORIES = [
  { id: "registrert", label: "Registrerte biler" },
  { id: "restaurering", label: "Restaureringsprosjekter" },
  { id: "historisk", label: "Historiske biler" },
  { id: "vrak", label: "Vrak" },
];

interface SubmissionData {
  title: string | null;
  brand: string | null;
  model: string;
  year: number | null;
  category: string;
  tags: string[] | null;
  story: string | null;
  images: string[] | null;
  ownerName: string;
}

const AdminBiler = () => {
  const location = useLocation();
  const [cars, setCars] = useState<CarPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<CarImage[]>([]);
  const [tagsInput, setTagsInput] = useState("");
  const [submissionImageUrls, setSubmissionImageUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    brand: "",
    model: "",
    year: "",
    story: "",
    overhauled: false,
    featured: false,
    published: false,
    category: "registrert",
  });

  // Get available models based on selected brand
  const availableModels = useMemo(() => {
    return getModelsForBrand(formData.brand);
  }, [formData.brand]);

  // Get available years based on selected brand and model
  const availableYears = useMemo(() => {
    return getYearsForModel(formData.brand, formData.model);
  }, [formData.brand, formData.model]);

  // Generated title preview
  const generatedTitle = useMemo(() => {
    if (!formData.brand || !formData.model) return "";
    return generateCarTitle(formData.brand, formData.model, formData.year ? parseInt(formData.year) : null);
  }, [formData.brand, formData.model, formData.year]);

  const fetchCars = async () => {
    const { data, error } = await supabase
      .from("cars")
      .select(`
        id, title, slug, brand, model, year, story, overhauled, tags, featured, published_at, created_at, category,
        car_images(id, image_url, alt_text, sort_order)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cars:", error);
      toast.error("Kunne ikke hente biler");
    } else {
      setCars(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCars();
  }, []);

  // Check for submission data from navigation state
  useEffect(() => {
    const state = location.state as { fromSubmission?: SubmissionData } | null;
    if (state?.fromSubmission) {
      const sub = state.fromSubmission;
      setFormData({
        title: sub.title || generateCarTitle(sub.brand || "", sub.model, sub.year),
        slug: "",
        brand: sub.brand || "",
        model: sub.model,
        year: sub.year?.toString() || "",
        story: sub.story || "",
        overhauled: false,
        featured: false,
        published: false,
        category: sub.category || "registrert",
      });
      setTagsInput(sub.tags?.join(", ") || "");
      setSubmissionImageUrls(sub.images || []);
      setShowForm(true);
      // Clear the state so it doesn't re-trigger
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/æ/g, "ae")
      .replace(/ø/g, "o")
      .replace(/å/g, "a")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      brand: "",
      model: "",
      year: "",
      story: "",
      overhauled: false,
      featured: false,
      published: false,
      category: "registrert",
    });
    setEditingId(null);
    setShowForm(false);
    setImageFiles([]);
    setExistingImages([]);
    setTagsInput("");
    setSubmissionImageUrls([]);
  };

  const removeSubmissionImage = (index: number) => {
    setSubmissionImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles((prev) => [...prev, ...files]);
  };

  const removeNewImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageId: string) => {
    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const uploadImages = async (carId: string): Promise<void> => {
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `cars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("simca-images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        continue;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("simca-images")
        .getPublicUrl(filePath);

      await supabase.from("car_images").insert({
        car_id: carId,
        image_url: publicUrl,
        sort_order: existingImages.length + i,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.model) {
      toast.error("Tittel og modell er påkrevd");
      return;
    }

    setIsSubmitting(true);

    try {
      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Auto-generate title from brand, model, year if not manually set
      const autoTitle = generatedTitle || formData.title.trim();
      const slug = formData.slug || generateSlug(autoTitle);

      const carData = {
        title: autoTitle,
        slug,
        brand: formData.brand || null,
        model: formData.model,
        year: formData.year ? parseInt(formData.year) : null,
        story: formData.story.trim() || null,
        overhauled: formData.overhauled,
        featured: formData.featured,
        tags,
        published_at: formData.published ? new Date().toISOString() : null,
        category: formData.category,
      };

      if (editingId) {
        // Update car
        const { error } = await supabase
          .from("cars")
          .update(carData)
          .eq("id", editingId);

        if (error) throw error;

        // Delete removed images
        const currentImageIds = existingImages.map((img) => img.id);
        const car = cars.find((c) => c.id === editingId);
        const removedImages = car?.car_images.filter(
          (img) => !currentImageIds.includes(img.id)
        );

        if (removedImages) {
          for (const img of removedImages) {
            await supabase.from("car_images").delete().eq("id", img.id);
          }
        }

        // Upload new images
        if (imageFiles.length > 0) {
          await uploadImages(editingId);
        }

        toast.success("Bil oppdatert!");
      } else {
        // Create car
        const { data, error } = await supabase
          .from("cars")
          .insert(carData)
          .select()
          .single();

        if (error) throw error;

        // Upload new images
        if (imageFiles.length > 0 && data) {
          await uploadImages(data.id);
        }

        // Add submission images (already uploaded URLs)
        if (submissionImageUrls.length > 0 && data) {
          for (let i = 0; i < submissionImageUrls.length; i++) {
            await supabase.from("car_images").insert({
              car_id: data.id,
              image_url: submissionImageUrls[i],
              sort_order: i,
            });
          }
        }

        toast.success("Bil opprettet!");
      }

      resetForm();
      fetchCars();
    } catch (error: any) {
      console.error("Error saving car:", error);
      if (error.code === "23505") {
        toast.error("En bil med denne slug-en eksisterer allerede");
      } else {
        toast.error("Kunne ikke lagre bil");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (car: CarPost) => {
    setFormData({
      title: car.title,
      slug: car.slug,
      brand: car.brand || "",
      model: car.model,
      year: car.year?.toString() || "",
      story: car.story || "",
      overhauled: car.overhauled,
      featured: car.featured,
      published: !!car.published_at,
      category: car.category || "registrert",
    });
    setTagsInput(car.tags?.join(", ") || "");
    setExistingImages(car.car_images || []);
    setEditingId(car.id);
    setShowForm(true);
  };

  const togglePublish = async (car: CarPost) => {
    const newPublishedAt = car.published_at ? null : new Date().toISOString();

    const { error } = await supabase
      .from("cars")
      .update({ published_at: newPublishedAt })
      .eq("id", car.id);

    if (error) {
      toast.error("Kunne ikke oppdatere status");
    } else {
      toast.success(newPublishedAt ? "Bil publisert!" : "Bil avpublisert");
      fetchCars();
    }
  };

  const toggleFeatured = async (car: CarPost) => {
    const { error } = await supabase
      .from("cars")
      .update({ featured: !car.featured })
      .eq("id", car.id);

    if (error) {
      toast.error("Kunne ikke oppdatere status");
    } else {
      toast.success(car.featured ? "Fjernet fra utvalgte" : "Lagt til i utvalgte!");
      fetchCars();
    }
  };

  const deleteCar = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne bilen?")) return;

    const { error } = await supabase.from("cars").delete().eq("id", id);

    if (error) {
      toast.error("Kunne ikke slette bil");
    } else {
      toast.success("Bil slettet");
      fetchCars();
    }
  };

  return (
    <AdminLayout title="BILER">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">
          {cars.length} bil{cars.length !== 1 ? "er" : ""} totalt
        </p>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="btn-retro bg-primary"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ny bil
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-foreground/50 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto">
          <div className="bg-card border-4 border-foreground w-full max-w-3xl mb-8">
            <div className="flex items-center justify-between p-4 border-b-2 border-foreground">
              <h2 className="font-display text-2xl">
                {editingId ? "REDIGER BIL" : "NY BIL"}
              </h2>
              <button onClick={resetForm} className="p-2 hover:bg-muted rounded">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Brand, Model, Year - Cascading selects */}
              <div className="space-y-4 p-4 bg-muted/30 border-2 border-muted">
                <p className="text-sm text-muted-foreground font-medium">Velg merke, modell og årstall – dette genererer bilens tittel</p>
                
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Brand */}
                  <div>
                    <label className="block font-display mb-2">MERKE *</label>
                    <select
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value, model: "", year: "" })
                      }
                      className="w-full p-3 border-2 border-foreground bg-card"
                      required
                    >
                      <option value="">Velg merke...</option>
                      {CAR_BRANDS.map((brand) => (
                        <option key={brand.name} value={brand.name}>
                          {brand.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Model */}
                  <div>
                    <label className="block font-display mb-2">MODELL *</label>
                    <select
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value, year: "" })
                      }
                      className="w-full p-3 border-2 border-foreground bg-card"
                      required
                      disabled={!formData.brand}
                    >
                      <option value="">Velg modell...</option>
                      {availableModels.map((model) => (
                        <option key={model.name} value={model.name}>
                          {model.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block font-display mb-2">ÅRSTALL</label>
                    <select
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: e.target.value })
                      }
                      className="w-full p-3 border-2 border-foreground bg-card"
                      disabled={!formData.model}
                    >
                      <option value="">Velg år...</option>
                      {availableYears.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Generated title preview */}
                {generatedTitle && (
                  <div className="mt-2 p-3 bg-primary/10 border border-primary/30">
                    <p className="text-sm text-muted-foreground">Bilens tittel blir:</p>
                    <p className="text-lg font-display text-primary">{generatedTitle}</p>
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Slug */}
                <div>
                  <label className="block font-display mb-2">SLUG (URL)</label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder={generateSlug(generatedTitle || formData.title) || "auto-generert"}
                    className="w-full p-3 border-2 border-foreground bg-card"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-display mb-2">KATEGORI *</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full p-3 border-2 border-foreground bg-card"
                    required
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Story */}
              <div>
                <label className="block font-display mb-2">HISTORIEN</label>
                <textarea
                  value={formData.story}
                  onChange={(e) =>
                    setFormData({ ...formData, story: e.target.value })
                  }
                  rows={6}
                  className="w-full p-3 border-2 border-foreground bg-card resize-none"
                  placeholder="Fortell historien om denne bilen..."
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block font-display mb-2">TAGS (kommaseparert)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="f.eks. original, rally, restaurert"
                  className="w-full p-3 border-2 border-foreground bg-card"
                />
              </div>

              {/* Images */}
              <div>
                <label className="block font-display mb-2">BILDER</label>

                {/* Submission images (from innsending) */}
                {submissionImageUrls.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Fra innsending:</p>
                    <div className="flex gap-2 flex-wrap">
                      {submissionImageUrls.map((url, index) => (
                        <div key={index} className="relative w-24 h-24 border-2 border-green-500">
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeSubmissionImage(index)}
                            className="absolute -top-2 -right-2 bg-accent text-accent-foreground p-1 rounded-full"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <span className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-xs text-center">
                            INNSENDT
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Existing images */}
                {existingImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {existingImages.map((img) => (
                      <div key={img.id} className="relative w-24 h-24 border-2 border-foreground">
                        <img
                          src={img.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          className="absolute -top-2 -right-2 bg-accent text-accent-foreground p-1 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* New images preview */}
                {imageFiles.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-4">
                    {imageFiles.map((file, index) => (
                      <div key={index} className="relative w-24 h-24 border-2 border-primary">
                        <img
                          src={URL.createObjectURL(file)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeNewImage(index)}
                          className="absolute -top-2 -right-2 bg-accent text-accent-foreground p-1 rounded-full"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <span className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground text-xs text-center">
                          NY
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <label className="cursor-pointer inline-block">
                  <div className="px-4 py-3 border-2 border-dashed border-muted-foreground hover:border-primary transition-colors flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    <span>Last opp bilder</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Toggles */}
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.overhauled}
                    onChange={(e) =>
                      setFormData({ ...formData, overhauled: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                  <span className="font-display">OVERHALT</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) =>
                      setFormData({ ...formData, featured: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                  <span className="font-display">UTVALGT (FEATURED)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) =>
                      setFormData({ ...formData, published: e.target.checked })
                    }
                    className="w-5 h-5"
                  />
                  <span className="font-display">PUBLISER NÅ</span>
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

      {/* Table */}
      {isLoading ? (
        <div className="text-center py-12">Laster...</div>
      ) : cars.length === 0 ? (
        <div className="retro-card text-center py-12">
          <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Ingen biler lagt til ennå</p>
          <button onClick={() => setShowForm(true)} className="btn-retro">
            <Plus className="w-5 h-5 mr-2" />
            Legg til din første bil
          </button>
        </div>
      ) : (
        <div className="bg-card border-4 border-foreground overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-4 font-display w-16">BILDE</th>
                <th className="text-left p-4 font-display">TITTEL</th>
                <th className="text-left p-4 font-display">MODELL</th>
                <th className="text-left p-4 font-display">KATEGORI</th>
                <th className="text-left p-4 font-display">STATUS</th>
                <th className="text-right p-4 font-display">HANDLINGER</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => {
                const categoryLabel = CATEGORIES.find(c => c.id === car.category)?.label || car.category;
                return (
                <tr key={car.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="w-12 h-12 bg-muted rounded overflow-hidden">
                      {car.car_images?.[0] ? (
                        <img
                          src={car.car_images[0].image_url}
                          alt={car.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        {car.featured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <span className="font-medium">{car.title}</span>
                      </div>
                      {car.year && <span className="text-xs text-muted-foreground">{car.year}</span>}
                    </div>
                  </td>
                  <td className="p-4">{car.model}</td>
                  <td className="p-4">
                    <span className={`text-xs px-2 py-1 rounded font-display ${
                      car.category === 'registrert' ? 'bg-green-100 text-green-700' :
                      car.category === 'restaurering' ? 'bg-orange-100 text-orange-700' :
                      car.category === 'historisk' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {categoryLabel}
                    </span>
                  </td>
                  <td className="p-4">
                    {car.published_at ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Publisert
                      </span>
                    ) : (
                      <span className="text-muted-foreground flex items-center gap-1">
                        <EyeOff className="w-4 h-4" />
                        Kladd
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => toggleFeatured(car)}
                        className="p-2 hover:bg-muted rounded"
                        title={car.featured ? "Fjern fra utvalgte" : "Legg til utvalgte"}
                      >
                        {car.featured ? (
                          <StarOff className="w-5 h-5 text-yellow-500" />
                        ) : (
                          <Star className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => togglePublish(car)}
                        className="p-2 hover:bg-muted rounded"
                        title={car.published_at ? "Avpubliser" : "Publiser"}
                      >
                        {car.published_at ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5 text-green-600" />
                        )}
                      </button>
                      <button
                        onClick={() => startEdit(car)}
                        className="p-2 hover:bg-muted rounded"
                        title="Rediger"
                      >
                        <Pencil className="w-5 h-5 text-primary" />
                      </button>
                      <button
                        onClick={() => deleteCar(car.id)}
                        className="p-2 hover:bg-muted rounded"
                        title="Slett"
                      >
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
      )}
    </AdminLayout>
  );
};

export default AdminBiler;
