import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowLeft, Save, Eye, EyeOff, Star, StarOff, Trash2, 
  Pencil, X, Upload, Car, ExternalLink, Send, Calendar,
  User, Mail, ImagePlus
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CAR_BRANDS, getModelsForBrand, getVariantsForModel, getYearsForModel } from "@/data/carBrands";
import { CAR_BODY_TYPES } from "@/data/carBodyTypes";
import { compressImages, generateImageId, getCarImagePath } from "@/lib/imageCompression";

interface CarImage {
  id: string;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
}

interface CarDetail {
  id: string;
  title: string;
  slug: string;
  brand: string | null;
  model: string;
  variant: string | null;
  body_type: string | null;
  year: number | null;
  story: string | null;
  overhauled: boolean;
  tags: string[];
  featured: boolean;
  published_at: string | null;
  created_at: string;
  category: string;
  status: 'submitted' | 'draft' | 'published' | 'archived';
  source: 'manual' | 'submission';
  submitted_by_email: string | null;
  submitted_by_name: string | null;
  car_images: CarImage[];
}

const CATEGORIES = [
  { id: "registrert", label: "Registrerte biler" },
  { id: "restaurering", label: "Restaureringsprosjekter" },
  { id: "historisk", label: "Historiske biler" },
  { id: "vrak", label: "Vrak" },
];

const AdminBilProfil = () => {
  const { carId } = useParams<{ carId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit states
  const [isEditingBasic, setIsEditingBasic] = useState(false);
  const [isEditingStory, setIsEditingStory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Form states
  const [basicForm, setBasicForm] = useState({
    brand: "",
    model: "",
    variant: "",
    body_type: "",
    year: "",
    category: "registrert",
    tags: "",
  });
  const [storyForm, setStoryForm] = useState("");

  // Fetch car data
  const { data: car, isLoading, error } = useQuery({
    queryKey: ['admin-car', carId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cars')
        .select(`
          id, title, slug, brand, model, variant, body_type, year, story, overhauled, tags, featured, 
          published_at, created_at, category, status, source, submitted_by_email, submitted_by_name,
          car_images(id, image_url, alt_text, sort_order)
        `)
        .eq('id', carId)
        .single();

      if (error) throw error;
      return data as CarDetail;
    },
    enabled: !!carId,
  });

  // Initialize form when car data loads
  const initBasicForm = () => {
    if (car) {
      setBasicForm({
        brand: car.brand || "",
        model: car.model || "",
        variant: car.variant || "",
        body_type: car.body_type || "",
        year: car.year?.toString() || "",
        category: car.category || "registrert",
        tags: car.tags?.join(", ") || "",
      });
    }
  };

  const initStoryForm = () => {
    if (car) {
      setStoryForm(car.story || "");
    }
  };

  // Get available options based on selections
  const availableModels = car?.brand ? getModelsForBrand(basicForm.brand || car.brand) : [];
  const availableVariants = basicForm.model ? getVariantsForModel(basicForm.brand, basicForm.model) : [];
  const availableYears = basicForm.model ? getYearsForModel(basicForm.brand, basicForm.model) : [];

  // Status helpers
  const getCarStatus = (): 'submitted' | 'draft' | 'published' | 'archived' => {
    if (car?.status) return car.status;
    return car?.published_at ? 'published' : 'draft';
  };

  const statusConfig = {
    submitted: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Innsendt', icon: Send },
    draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Kladd', icon: EyeOff },
    published: { bg: 'bg-green-100', text: 'text-green-700', label: 'Publisert', icon: Eye },
    archived: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Arkivert', icon: EyeOff },
  };

  // Save functions
  const saveBasicInfo = async () => {
    if (!car) return;
    setIsSaving(true);

    const tags = basicForm.tags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const { error } = await supabase
      .from('cars')
      .update({
        brand: basicForm.brand || null,
        model: basicForm.model,
        variant: basicForm.variant || null,
        body_type: basicForm.body_type || null,
        year: basicForm.year ? parseInt(basicForm.year) : null,
        category: basicForm.category,
        tags,
      })
      .eq('id', car.id);

    setIsSaving(false);

    if (error) {
      toast.error('Kunne ikke lagre');
    } else {
      toast.success('Grunninfo lagret!');
      setIsEditingBasic(false);
      queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
    }
  };

  const saveStory = async () => {
    if (!car) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('cars')
      .update({ story: storyForm || null })
      .eq('id', car.id);

    setIsSaving(false);

    if (error) {
      toast.error('Kunne ikke lagre');
    } else {
      toast.success('Historien lagret!');
      setIsEditingStory(false);
      queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
    }
  };

  const togglePublish = async () => {
    if (!car) return;
    const currentStatus = getCarStatus();

    if (currentStatus === 'archived') {
      toast.error("Kan ikke publisere arkiverte biler");
      return;
    }

    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    const newPublishedAt = newStatus === 'published' ? new Date().toISOString() : null;

    const { error } = await supabase
      .from('cars')
      .update({ status: newStatus, published_at: newPublishedAt })
      .eq('id', car.id);

    if (error) {
      toast.error('Kunne ikke oppdatere status');
    } else {
      toast.success(newStatus === 'published' ? 'Bil publisert!' : 'Bil avpublisert');
      queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
    }
  };

  const toggleFeatured = async () => {
    if (!car) return;

    const { error } = await supabase
      .from('cars')
      .update({ featured: !car.featured })
      .eq('id', car.id);

    if (error) {
      toast.error('Kunne ikke oppdatere');
    } else {
      toast.success(car.featured ? 'Fjernet fra utvalgte' : 'Lagt til som utvalgt!');
      queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
    }
  };

  const toggleOverhauled = async () => {
    if (!car) return;

    const { error } = await supabase
      .from('cars')
      .update({ overhauled: !car.overhauled })
      .eq('id', car.id);

    if (error) {
      toast.error('Kunne ikke oppdatere');
    } else {
      toast.success(car.overhauled ? 'Fjernet overhalt-status' : 'Markert som overhalt!');
      queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
    }
  };

  const deleteCar = async () => {
    if (!car) return;
    if (!confirm('Er du sikker på at du vil slette denne bilen?')) return;

    const { error } = await supabase.from('cars').delete().eq('id', car.id);

    if (error) {
      toast.error('Kunne ikke slette');
    } else {
      toast.success('Bil slettet');
      navigate('/admin/biler');
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!confirm('Slette dette bildet?')) return;

    const { error } = await supabase.from('car_images').delete().eq('id', imageId);

    if (error) {
      toast.error('Kunne ikke slette bildet');
    } else {
      toast.success('Bilde slettet');
      queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !car) return;

    setIsUploadingImages(true);

    try {
      const compressedResults = await compressImages(files);

      for (let i = 0; i < compressedResults.length; i++) {
        const { file } = compressedResults[i];
        const imageId = generateImageId();
        const filePath = getCarImagePath(car.id, imageId);

        const { error: uploadError } = await supabase.storage
          .from('simca-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('simca-images')
          .getPublicUrl(filePath);

        const sortOrder = (car.car_images?.length || 0) + i;

        await supabase.from('car_images').insert({
          car_id: car.id,
          image_url: publicUrl,
          sort_order: sortOrder,
        });
      }

      toast.success(`${compressedResults.length} bilde(r) lastet opp!`);
      queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
    } catch (err) {
      toast.error('Feil ved opplasting');
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="LASTER...">
        <div className="text-center py-12">Laster bil...</div>
      </AdminLayout>
    );
  }

  if (error || !car) {
    return (
      <AdminLayout title="FEIL">
        <div className="text-center py-12">
          <Car className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Kunne ikke finne bilen</p>
          <Link to="/admin/biler" className="btn-retro">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tilbake til biler
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const status = getCarStatus();
  const { bg, text, label, icon: StatusIcon } = statusConfig[status];
  const sortedImages = [...(car.car_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const categoryLabel = CATEGORIES.find(c => c.id === car.category)?.label || car.category;

  return (
    <AdminLayout title="">
      {/* Breadcrumb & Header */}
      <div className="mb-6">
        <Link 
          to="/admin/biler" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Tilbake til biler
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-2xl md:text-3xl">{car.title}</h1>
              {car.featured && <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`${bg} ${text} text-xs px-2 py-1 rounded font-display flex items-center gap-1`}>
                <StatusIcon className="w-3 h-3" />
                {label}
              </span>
              {car.source === 'submission' && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">Innsending</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFeatured}
            >
              {car.featured ? <StarOff className="w-4 h-4 mr-1" /> : <Star className="w-4 h-4 mr-1" />}
              {car.featured ? 'Fjern utvalgt' : 'Gjør utvalgt'}
            </Button>
            <Button
              variant={status === 'published' ? 'outline' : 'default'}
              size="sm"
              onClick={togglePublish}
            >
              {status === 'published' ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
              {status === 'published' ? 'Avpubliser' : 'Publiser'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={deleteCar}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Slett
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Innsender-info (if submission) */}
        {car.source === 'submission' && (car.submitted_by_name || car.submitted_by_email) && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h3 className="font-display text-sm mb-2 flex items-center gap-2">
              <Send className="w-4 h-4" />
              INNSENDT AV
            </h3>
            <div className="flex flex-wrap gap-4 text-sm">
              {car.submitted_by_name && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4 text-muted-foreground" />
                  {car.submitted_by_name}
                </span>
              )}
              {car.submitted_by_email && (
                <a 
                  href={`mailto:${car.submitted_by_email}`}
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Mail className="w-4 h-4" />
                  {car.submitted_by_email}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Grunninfo */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg">GRUNNINFO</h3>
            {!isEditingBasic ? (
              <Button variant="ghost" size="sm" onClick={() => { initBasicForm(); setIsEditingBasic(true); }}>
                <Pencil className="w-4 h-4 mr-1" />
                Rediger
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditingBasic(false)}>
                  <X className="w-4 h-4 mr-1" />
                  Avbryt
                </Button>
                <Button size="sm" onClick={saveBasicInfo} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? 'Lagrer...' : 'Lagre'}
                </Button>
              </div>
            )}
          </div>

          {!isEditingBasic ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Merke</span>
                <p className="font-medium">{car.brand || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Modell</span>
                <p className="font-medium">{car.model}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Variant</span>
                <p className="font-medium">{car.variant || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Karosseri</span>
                <p className="font-medium capitalize">{car.body_type?.replace('-', ' ') || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">År</span>
                <p className="font-medium">{car.year || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Kategori</span>
                <p className="font-medium">{categoryLabel}</p>
              </div>
              <div className="col-span-2 md:col-span-3">
                <span className="text-muted-foreground">Tags</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {car.tags?.length > 0 ? car.tags.map((tag, i) => (
                    <span key={i} className="bg-muted px-2 py-0.5 rounded text-xs">{tag}</span>
                  )) : <span className="text-muted-foreground">Ingen tags</span>}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Merke</label>
                <select
                  value={basicForm.brand}
                  onChange={(e) => setBasicForm({ ...basicForm, brand: e.target.value, model: '', variant: '' })}
                  className="w-full h-10 px-3 border rounded-md bg-background"
                >
                  <option value="">Velg merke...</option>
                  {CAR_BRANDS.map((b) => (
                    <option key={b.name} value={b.name}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Modell</label>
                <select
                  value={basicForm.model}
                  onChange={(e) => setBasicForm({ ...basicForm, model: e.target.value, variant: '' })}
                  className="w-full h-10 px-3 border rounded-md bg-background"
                  disabled={!basicForm.brand}
                >
                  <option value="">Velg modell...</option>
                  {availableModels.map((m) => (
                    <option key={m.name} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Variant</label>
                <select
                  value={basicForm.variant}
                  onChange={(e) => setBasicForm({ ...basicForm, variant: e.target.value })}
                  className="w-full h-10 px-3 border rounded-md bg-background"
                >
                  <option value="">Velg variant...</option>
                  {availableVariants.map((v) => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Karosseri</label>
                <select
                  value={basicForm.body_type}
                  onChange={(e) => setBasicForm({ ...basicForm, body_type: e.target.value })}
                  className="w-full h-10 px-3 border rounded-md bg-background"
                >
                  <option value="">Velg karosseri...</option>
                  {CAR_BODY_TYPES.map((bt) => (
                    <option key={bt.id} value={bt.id}>{bt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">År</label>
                <select
                  value={basicForm.year}
                  onChange={(e) => setBasicForm({ ...basicForm, year: e.target.value })}
                  className="w-full h-10 px-3 border rounded-md bg-background"
                >
                  <option value="">Velg år...</option>
                  {availableYears.map((y) => (
                    <option key={y} value={y.toString()}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <select
                  value={basicForm.category}
                  onChange={(e) => setBasicForm({ ...basicForm, category: e.target.value })}
                  className="w-full h-10 px-3 border rounded-md bg-background"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Tags (kommaseparert)</label>
                <Input
                  value={basicForm.tags}
                  onChange={(e) => setBasicForm({ ...basicForm, tags: e.target.value })}
                  placeholder="original, veteran, rallye"
                />
              </div>
            </div>
          )}
        </div>

        {/* Bilder */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg">BILDER ({sortedImages.length})</h3>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                multiple
                className="hidden"
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingImages}
              >
                <ImagePlus className="w-4 h-4 mr-1" />
                {isUploadingImages ? 'Laster opp...' : 'Last opp'}
              </Button>
            </div>
          </div>

          {sortedImages.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {sortedImages.map((img, index) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.image_url}
                    alt={img.alt_text || `Bilde ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border"
                  />
                  {index === 0 && (
                    <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded">
                      Hovedbilde
                    </span>
                  )}
                  <button
                    onClick={() => deleteImage(img.id)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <Car className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-sm">Ingen bilder</p>
            </div>
          )}
        </div>

        {/* Status & Innstillinger */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <h3 className="font-display text-lg mb-4">STATUS & INNSTILLINGER</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Overhalt</span>
              <button
                onClick={toggleOverhauled}
                className={`w-10 h-6 rounded-full transition-colors ${car.overhauled ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full transform transition-transform ${car.overhauled ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm">Utvalgt</span>
              <button
                onClick={toggleFeatured}
                className={`w-10 h-6 rounded-full transition-colors ${car.featured ? 'bg-yellow-500' : 'bg-gray-300'}`}
              >
                <span className={`block w-4 h-4 bg-white rounded-full transform transition-transform ${car.featured ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            <div className="p-3 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Opprettet</span>
              <p className="text-sm font-medium flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(car.created_at).toLocaleDateString('nb-NO')}
              </p>
            </div>
            {car.published_at && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Publisert</span>
                <p className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(car.published_at).toLocaleDateString('nb-NO')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Historien */}
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg">HISTORIEN</h3>
            {!isEditingStory ? (
              <Button variant="ghost" size="sm" onClick={() => { initStoryForm(); setIsEditingStory(true); }}>
                <Pencil className="w-4 h-4 mr-1" />
                Rediger
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditingStory(false)}>
                  <X className="w-4 h-4 mr-1" />
                  Avbryt
                </Button>
                <Button size="sm" onClick={saveStory} disabled={isSaving}>
                  <Save className="w-4 h-4 mr-1" />
                  {isSaving ? 'Lagrer...' : 'Lagre'}
                </Button>
              </div>
            )}
          </div>

          {!isEditingStory ? (
            car.story ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{car.story}</p>
            ) : (
              <p className="text-muted-foreground text-sm">Ingen historie skrevet ennå</p>
            )
          ) : (
            <div>
              <Textarea
                value={storyForm}
                onChange={(e) => setStoryForm(e.target.value)}
                placeholder="Skriv bilens historie..."
                rows={10}
                className="mb-2"
              />
              <p className="text-xs text-muted-foreground">{storyForm.length} tegn</p>
            </div>
          )}
        </div>

        {/* Forhåndsvisning */}
        {status === 'published' && car.slug && (
          <div className="bg-card border border-border rounded-xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg">FORHÅNDSVISNING</h3>
              <a
                href={`/biler/${car.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Åpne offentlig side
              </a>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminBilProfil;
