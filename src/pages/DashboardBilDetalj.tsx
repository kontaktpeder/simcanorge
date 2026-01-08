import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Layout } from '@/components/layout/Layout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatusBadge } from '@/components/car';
import { CarEventsList } from '@/components/car/CarEventsList';
import { 
  ArrowLeft, Car, Calendar, Wrench, Loader2, XCircle, 
  Pencil, Save, X, Eye, EyeOff, Upload, Trash2, Clock, Send,
  ChevronLeft, ChevronRight, Star
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { compressImages, generateImageId, getCarImagePath } from '@/lib/imageCompression';
import { CAR_BRANDS, getModelsForBrand } from '@/data/carBrands';
import { CAR_BODY_TYPES } from '@/data/carBodyTypes';

const CATEGORIES = [
  { value: 'registrert', label: 'Registrert' },
  { value: 'prosjekt', label: 'Prosjekt' },
  { value: 'veteran', label: 'Veteranbil' },
];

export default function DashboardBilDetalj() {
  const { carId } = useParams<{ carId: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing states
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

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?returnUrl=/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Sjekk tilgang og hent bil
  const { data: carData, isLoading } = useQuery({
    queryKey: ['my-car', carId, user?.id],
    queryFn: async () => {
      if (!user || !carId) return null;

      // Sjekk om bruker eier bilen
      const { data: ownerCheck } = await supabase
        .from('car_owners')
        .select('id')
        .eq('car_id', carId)
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .maybeSingle();

      if (!ownerCheck) {
        return { hasAccess: false };
      }

      // Hent bil-data
      const { data: car, error } = await supabase
        .from('cars')
        .select(`
          *,
          car_images(id, image_url, alt_text, sort_order)
        `)
        .eq('id', carId)
        .single();

      if (error) throw error;
      return { hasAccess: true, car };
    },
    enabled: !!user && !!carId
  });

  const car = carData?.car;

  // Populate forms when car loads
  useEffect(() => {
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
      setStoryForm(car.story || "");
    }
  }, [car]);

  // Save basic info
  const saveBasicInfo = async () => {
    if (!car) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('cars')
        .update({
          brand: basicForm.brand || null,
          model: basicForm.model,
          variant: basicForm.variant || null,
          body_type: basicForm.body_type || null,
          year: basicForm.year ? parseInt(basicForm.year) : null,
          category: basicForm.category,
          tags: basicForm.tags.split(',').map(t => t.trim()).filter(t => t),
        })
        .eq('id', car.id);

      if (error) {
        console.error('Save error:', error);
        if (error.code === '42501' || error.message?.includes('permission')) {
          toast.error('Du har ikke tilgang til å redigere denne bilen');
        } else {
          toast.error(`Kunne ikke lagre: ${error.message || 'Ukjent feil'}`);
        }
        return;
      }

      toast.success('Lagret!');
      setIsEditingBasic(false);
      queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] });
    } catch (err: any) {
      console.error('Unexpected error:', err);
      toast.error('Uventet feil ved lagring');
    } finally {
      setIsSaving(false);
    }
  };

  // Save story
  const saveStory = async () => {
    if (!car) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('cars')
        .update({ story: storyForm || null })
        .eq('id', car.id);

      if (error) {
        console.error('Save error:', error);
        toast.error(`Kunne ikke lagre: ${error.message || 'Ukjent feil'}`);
        return;
      }

      toast.success('Historien er lagret!');
      setIsEditingStory(false);
      queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] });
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Uventet feil ved lagring');
    } finally {
      setIsSaving(false);
    }
  };

  // Hent eksisterende open request
  const { data: openRequest } = useQuery({
    queryKey: ['publication-request', carId, user?.id],
    queryFn: async () => {
      if (!carId || !user) return null;
      const { data } = await supabase
        .from('car_publication_requests')
        .select('*')
        .eq('car_id', carId)
        .eq('status', 'open')
        .maybeSingle();
      return data as { id: string; car_id: string; action: 'publish' | 'unpublish'; created_at: string } | null;
    },
    enabled: !!carId && !!user
  });

  // Opprett forespørsel om publisering
  const requestPublication = async () => {
    if (!car || !user) return;
    
    const action = car.status === 'published' ? 'unpublish' : 'publish';
    
    const { error } = await supabase
      .from('car_publication_requests')
      .insert({
        car_id: car.id,
        requested_by: user.id,
        action: action,
        status: 'open'
      });

    if (error) {
      if (error.code === '23505') {
        toast.error('Du har allerede sendt en forespørsel for denne bilen');
      } else {
        toast.error('Kunne ikke sende forespørsel');
        console.error('Request error:', error);
      }
    } else {
      toast.success('Forespørsel sendt! Admin vil se på dette.');
      queryClient.invalidateQueries({ queryKey: ['publication-request', carId, user?.id] });
    }
  };

  // Avbryt eksisterende forespørsel
  const cancelRequest = async () => {
    if (!openRequest || !user) return;
    
    const { error } = await supabase
      .from('car_publication_requests')
      .delete()
      .eq('id', openRequest.id);

    if (error) {
      toast.error('Kunne ikke avbryte forespørsel');
    } else {
      toast.success('Forespørsel avbrutt');
      queryClient.invalidateQueries({ queryKey: ['publication-request', carId, user?.id] });
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !car) return;

    setIsUploadingImages(true);
    
    try {
      const results = await compressImages(Array.from(files));
      
      for (const result of results) {
        const imageId = generateImageId();
        const filePath = getCarImagePath(car.id, imageId);
        
        const { error: uploadError } = await supabase.storage
          .from('simca-images')
          .upload(filePath, result.file, { contentType: 'image/webp' });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error(`Feil ved opplasting: ${result.file.name}`);
          continue;
        }

        const { data: urlData } = supabase.storage
          .from('simca-images')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('car_images')
          .insert({
            car_id: car.id,
            image_url: urlData.publicUrl,
            alt_text: car.title,
            sort_order: (car.car_images?.length || 0) + 1,
          });

        if (dbError) {
          console.error('DB error:', dbError);
          toast.error('Kunne ikke lagre bildereferanse');
        }
      }

      toast.success(`${results.length} bilde(r) lastet opp`);
      queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] });
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Feil ved bildeopplasting');
    } finally {
      setIsUploadingImages(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Delete image
  const deleteImage = async (imageId: string) => {
    const { error } = await supabase
      .from('car_images')
      .delete()
      .eq('id', imageId);

    if (error) {
      console.error('Delete error:', error);
      toast.error('Kunne ikke slette bilde');
    } else {
      toast.success('Bilde slettet');
      queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] });
    }
  };

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!user) {
    return null;
  }

  if (carData && !carData.hasAccess) {
    return (
      <Layout>
        <PageHeader title="Ingen tilgang" />
        <div className="container py-8">
          <div className="max-w-md mx-auto text-center bg-card border border-border rounded-xl p-8">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <p className="text-muted-foreground mb-6">
              Du har ikke tilgang til denne bilen.
            </p>
            <Link to="/dashboard/mine-biler">
              <Button variant="outline">Tilbake til mine biler</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  if (!car) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Bil ikke funnet</p>
        </div>
      </Layout>
    );
  }

  const sortedImages = [...(car.car_images || [])].sort(
    (a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0)
  );

  const [isReorderingImages, setIsReorderingImages] = useState(false);

  const persistCarImageOrder = async (images: any[]) => {
    if (!car) return;
    setIsReorderingImages(true);
    try {
      // normalize to 0..n-1
      for (let i = 0; i < images.length; i++) {
        const { error } = await supabase
          .from('car_images')
          .update({ sort_order: i })
          .eq('id', images[i].id);

        if (error) throw error;
      }

      toast.success('Rekkefølge oppdatert');
      queryClient.invalidateQueries({ queryKey: ['my-car', carId, user?.id] });
    } catch (err) {
      console.error('Reorder error:', err);
      toast.error('Kunne ikke endre rekkefølge');
    } finally {
      setIsReorderingImages(false);
    }
  };

  const moveCarImageLeft = async (index: number) => {
    if (index <= 0) return;
    const next = [...sortedImages];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    await persistCarImageOrder(next);
  };

  const moveCarImageRight = async (index: number) => {
    if (index >= sortedImages.length - 1) return;
    const next = [...sortedImages];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    await persistCarImageOrder(next);
  };

  const setCarMainImage = async (index: number) => {
    if (index <= 0) return;
    const next = [...sortedImages];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    await persistCarImageOrder(next);
  };

  const availableModels = basicForm.brand ? getModelsForBrand(basicForm.brand) : [];

  return (
    <Layout>
      <PageHeader title={car.title} />
      
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <Link 
            to="/dashboard/mine-biler" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tilbake til mine biler
          </Link>

          <div className="space-y-6">
            {/* Status & Publish */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <StatusBadge status={car.status || 'draft'} />
                  {car.year && (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      {car.year}
                    </span>
                  )}
                  {car.overhauled && (
                    <span className="inline-flex items-center gap-1 text-sm text-green-600">
                      <Wrench className="w-4 h-4" />
                      Overhalt
                    </span>
                  )}
                </div>
                
              </div>
              
              {/* Publiseringsforespørsel */}
              {car.status !== 'archived' && (
                <div className="mt-4 pt-4 border-t border-border">
                  {openRequest ? (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-amber-800">
                            Forespørsel sendt: {openRequest.action === 'publish' ? 'Publiser' : 'Avpubliser'}
                          </p>
                          <p className="text-sm text-amber-600">
                            Sendt {new Date(openRequest.created_at).toLocaleDateString('nb-NO')}. Vent på admin.
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={cancelRequest}>
                        Avbryt
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={requestPublication}
                      variant="outline"
                      className="gap-2"
                    >
                      {car.status === 'published' ? (
                        <>
                          <EyeOff className="w-4 h-4" />
                          Be admin avpublisere
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Be admin publisere
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
              
              {car.status === 'published' && car.slug && (
                <div className="mt-4 pt-4 border-t border-border">
                  <Link 
                    to={`/biler/${car.slug}`}
                    className="text-primary hover:underline text-sm"
                  >
                    Se offentlig side →
                  </Link>
                </div>
              )}
            </div>

            {/* Bilder */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <div>
                  <h2 className="font-display text-lg">Bilder</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Første bilde brukes som hovedbilde. Bruk pilene for å endre rekkefølge.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImages}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {isUploadingImages ? 'Laster opp...' : 'Last opp'}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
              </div>
              
              {sortedImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4">
                  {sortedImages.map((img: any, index: number) => (
                    <div key={img.id} className="relative group aspect-video rounded-lg overflow-hidden bg-muted">
                      <img 
                        src={img.image_url} 
                        alt={img.alt_text || car.title}
                        className="w-full h-full object-cover"
                      />
                      {index === 0 && (
                        <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded inline-flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          Hovedbilde
                        </span>
                      )}

                      {/* reorder + main controls */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 flex items-center justify-center gap-2">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => moveCarImageLeft(index)}
                            disabled={isReorderingImages}
                            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                            aria-label="Flytt bilde til venstre"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                        )}
                        {index !== 0 && (
                          <button
                            type="button"
                            onClick={() => setCarMainImage(index)}
                            disabled={isReorderingImages}
                            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                            aria-label="Sett som hovedbilde"
                            title="Sett som hovedbilde"
                          >
                            <Star className="w-5 h-5" />
                          </button>
                        )}
                        {index < sortedImages.length - 1 && (
                          <button
                            type="button"
                            onClick={() => moveCarImageRight(index)}
                            disabled={isReorderingImages}
                            className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors"
                            aria-label="Flytt bilde til høyre"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => deleteImage(img.id)}
                        className="absolute top-2 right-2 bg-destructive text-destructive-foreground p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Slett bilde"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Car className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-muted-foreground text-sm">Ingen bilder ennå</p>
                </div>
              )}
            </div>

            {/* Grunninfo */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg">Grunninfo</h2>
                {!isEditingBasic ? (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingBasic(true)} className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Rediger
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveBasicInfo} disabled={isSaving} className="gap-2">
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Lagrer...' : 'Lagre'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setIsEditingBasic(false);
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
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {isEditingBasic ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Merke</label>
                    <Select
                      value={basicForm.brand}
                      onValueChange={(value) => setBasicForm({ ...basicForm, brand: value, model: "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg merke" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAR_BRANDS.map((brand) => (
                          <SelectItem key={brand.name} value={brand.name}>{brand.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Modell</label>
                    <Select
                      value={basicForm.model}
                      onValueChange={(value) => setBasicForm({ ...basicForm, model: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg modell" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((model) => (
                          <SelectItem key={model.name} value={model.name}>{model.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Variant</label>
                    <Input
                      value={basicForm.variant}
                      onChange={(e) => setBasicForm({ ...basicForm, variant: e.target.value })}
                      placeholder="f.eks. GLS, LS, Rallye"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Karosseri</label>
                    <Select
                      value={basicForm.body_type}
                      onValueChange={(value) => setBasicForm({ ...basicForm, body_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg karosseri" />
                      </SelectTrigger>
                      <SelectContent>
                        {CAR_BODY_TYPES.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Årsmodell</label>
                    <Input
                      type="number"
                      value={basicForm.year}
                      onChange={(e) => setBasicForm({ ...basicForm, year: e.target.value })}
                      placeholder="f.eks. 1972"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm text-muted-foreground mb-1 block">Kategori</label>
                    <Select
                      value={basicForm.category}
                      onValueChange={(value) => setBasicForm({ ...basicForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Velg kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="text-sm text-muted-foreground mb-1 block">Tags (kommaseparert)</label>
                    <Input
                      value={basicForm.tags}
                      onChange={(e) => setBasicForm({ ...basicForm, tags: e.target.value })}
                      placeholder="f.eks. original, restaurert, rally"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Merke:</span>
                    <p className="font-medium">{car.brand || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Modell:</span>
                    <p className="font-medium">{car.model}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Variant:</span>
                    <p className="font-medium">{car.variant || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Karosseri:</span>
                    <p className="font-medium">{car.body_type || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Årsmodell:</span>
                    <p className="font-medium">{car.year || '-'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Kategori:</span>
                    <p className="font-medium">{car.category || '-'}</p>
                  </div>
                  {car.tags && car.tags.length > 0 && (
                    <div className="col-span-full">
                      <span className="text-muted-foreground">Tags:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {car.tags.map((tag: string) => (
                          <span key={tag} className="bg-muted px-2 py-0.5 rounded text-xs">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Historien */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg">Historien</h2>
                {!isEditingStory ? (
                  <Button variant="ghost" size="sm" onClick={() => setIsEditingStory(true)} className="gap-2">
                    <Pencil className="w-4 h-4" />
                    Rediger
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={saveStory} disabled={isSaving} className="gap-2">
                      <Save className="w-4 h-4" />
                      {isSaving ? 'Lagrer...' : 'Lagre'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setIsEditingStory(false);
                        setStoryForm(car.story || "");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {isEditingStory ? (
                <Textarea
                  value={storyForm}
                  onChange={(e) => setStoryForm(e.target.value)}
                  placeholder="Fortell historien om bilen din..."
                  rows={8}
                />
              ) : (
                <div>
                  {car.story ? (
                    <p className="text-muted-foreground whitespace-pre-wrap">{car.story}</p>
                  ) : (
                    <p className="text-muted-foreground italic">Ingen historie lagt til ennå.</p>
                  )}
                </div>
              )}
            </div>

            {/* Bilens reise (timeline) */}
            <CarEventsList carId={car.id} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
