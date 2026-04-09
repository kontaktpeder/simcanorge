import { useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { 
  Save, Car, ExternalLink, Send, Calendar, ArrowLeft,
  User, Mail, ImagePlus, Check, Phone, ChevronDown, Clock, XCircle,
  FileEdit, CheckCircle, AlertTriangle, Pencil, X, Users
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { OwnerSection } from "@/components/admin/OwnerSection";
import { CarLinksSection, CarProfileHeader } from "@/components/admin/car";
import { StatusBadge, getCarStatus as getCarStatusHelper, CarFormFields } from "@/components/car";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  submitted_by_phone: string | null;
  submitted_notes: string | null;
  submission_payload: Record<string, unknown> | null;
  approved_at: string | null;
  approved_by: string | null;
  allow_edits: boolean | null;
  external_links: ExternalLinkData[] | null;
  car_images: CarImage[];
}

interface ExternalLinkData {
  url: string;
  type: 'facebook' | 'instagram' | 'youtube' | 'other';
  title?: string;
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
          submitted_by_phone, submitted_notes, submission_payload, allow_edits, external_links,
          approved_at, approved_by,
          car_images(id, image_url, alt_text, sort_order)
        `)
        .eq('id', carId)
        .single();

      if (error) throw error;
      return data as unknown as CarDetail;
    },
    enabled: !!carId,
  });

  // Hent open publication request for denne bilen
  const { data: openRequest } = useQuery({
    queryKey: ['publication-request-admin', carId],
    queryFn: async () => {
      if (!carId) return null;
      const { data } = await supabase
        .from('car_publication_requests')
        .select('*')
        .eq('car_id', carId)
        .eq('status', 'open')
        .maybeSingle();
      return data as { 
        id: string; 
        car_id: string; 
        requested_by: string;
        action: 'publish' | 'unpublish'; 
        message: string | null;
        created_at: string 
      } | null;
    },
    enabled: !!carId
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

  // Handle CarFormFields changes with cascading resets
  const handleFormFieldChange = (field: string, value: string) => {
    if (field === 'brand') {
      setBasicForm({ ...basicForm, brand: value, model: '', variant: '', year: '' });
    } else if (field === 'model') {
      setBasicForm({ ...basicForm, model: value, variant: '', year: '' });
    } else {
      setBasicForm({ ...basicForm, [field]: value });
    }
  };

  // Status helper - use shared helper
  const getCarStatus = (): 'submitted' | 'draft' | 'published' | 'archived' => {
    if (!car) return 'draft';
    return getCarStatusHelper(car);
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

  // Helper to get allow_edits with fallback to submission_payload
  const getAllowEdits = (): boolean | null => {
    if (car?.allow_edits !== null && car?.allow_edits !== undefined) {
      return car.allow_edits;
    }
    // Fallback to submission_payload
    if (car?.submission_payload && typeof car.submission_payload === 'object') {
      const payload = car.submission_payload as Record<string, unknown>;
      if (payload.allow_edits !== null && payload.allow_edits !== undefined) {
        return payload.allow_edits as boolean;
      }
    }
    return null;
  };

  const togglePublish = async () => {
    if (!car) return;
    const currentStatus = getCarStatus();

    if (currentStatus === 'archived') {
      toast.error("Kan ikke publisere arkiverte biler");
      return;
    }

    // Check allow_edits warning for submissions
    const allowEdits = getAllowEdits();
    if (car.source === 'submission' && allowEdits === null) {
      const confirmed = confirm(
        'ADVARSEL: Redigeringsgodkjenning mangler for denne bilen.\n\n' +
        'Verifiser med innsender om det er greit å publisere før du fortsetter.\n\n' +
        'Vil du likevel publisere?'
      );
      if (!confirmed) return;
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

  const approveCar = async () => {
    if (!car) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('cars')
      .update({ 
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      })
      .eq('id', car.id);

    if (error) {
      toast.error('Kunne ikke godkjenne bilen');
      console.error('Approval error:', error);
    } else {
      toast.success('Bil godkjent! Du kan nå generere invitasjon til eier.');
      queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
    }
  };

  const handlePublicationRequest = async (approve: boolean) => {
    if (!openRequest || !car) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    if (approve) {
      // Utfør handling
      const newStatus = openRequest.action === 'publish' ? 'published' : 'draft';
      const newPublishedAt = openRequest.action === 'publish' 
        ? new Date().toISOString() 
        : null;

      // Oppdater bil status
      const { error: carError } = await supabase
        .from('cars')
        .update({ 
          status: newStatus,
          published_at: newPublishedAt 
        })
        .eq('id', car.id);

      if (carError) {
        toast.error('Kunne ikke oppdatere bil status');
        return;
      }

      // Oppdater request
      await supabase
        .from('car_publication_requests')
        .update({
          status: 'approved',
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id
        })
        .eq('id', openRequest.id);

      // Opprett notification til requester
      await supabase
        .from('notifications')
        .insert({
          user_id: openRequest.requested_by,
          type: 'publication',
          title: openRequest.action === 'publish' ? 'Bilen er publisert' : 'Bilen er avpublisert',
          body: openRequest.action === 'publish' 
            ? `Bilen "${car.title}" er nå publisert på nettsiden.`
            : `Bilen "${car.title}" er nå avpublisert.`,
          car_id: car.id
        });

      toast.success(`Bil ${openRequest.action === 'publish' ? 'publisert' : 'avpublisert'}! Eier er varslet.`);
    } else {
      // Avslå
      await supabase
        .from('car_publication_requests')
        .update({
          status: 'rejected',
          resolved_at: new Date().toISOString(),
          resolved_by: user?.id
        })
        .eq('id', openRequest.id);

      // Opprett notification om avslag
      await supabase
        .from('notifications')
        .insert({
          user_id: openRequest.requested_by,
          type: 'publication_rejected',
          title: 'Forespørsel avslått',
          body: `Forespørselen om å ${openRequest.action === 'publish' ? 'publisere' : 'avpublisere'} "${car.title}" ble avslått.`,
          car_id: car.id
        });

      toast.success('Forespørsel avslått');
    }

    queryClient.invalidateQueries({ queryKey: ['publication-request-admin', carId] });
    queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
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
      let nextSortOrder = car.car_images?.length || 0;
      let successCount = 0;
      let lastError: string | null = null;

      for (let i = 0; i < compressedResults.length; i++) {
        const { file } = compressedResults[i];
        const imageId = generateImageId();
        const filePath = getCarImagePath(car.id, imageId);

        const { error: uploadError } = await supabase.storage
          .from('simca-images')
          .upload(filePath, file);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          lastError = uploadError.message;
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('simca-images')
          .getPublicUrl(filePath);

        const { error: insertError } = await supabase.from('car_images').insert({
          car_id: car.id,
          image_url: publicUrl,
          sort_order: nextSortOrder,
        });

        if (insertError) {
          console.error('Insert error:', insertError);
          lastError = insertError.message;
          await supabase.storage.from('simca-images').remove([filePath]);
          continue;
        }

        nextSortOrder += 1;
        successCount += 1;
      }

      if (successCount > 0) {
        toast.success(`${successCount} bilde(r) lastet opp!`);
        queryClient.invalidateQueries({ queryKey: ['admin-car', carId] });
      }
      if (successCount < compressedResults.length) {
        toast.error(
          successCount === 0
            ? `Kunne ikke lagre bildene${lastError ? `: ${lastError}` : ''}`
            : `${compressedResults.length - successCount} bilde(r) feilet${lastError ? ` (${lastError})` : ''}`
        );
      }
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
  const sortedImages = [...(car.car_images || [])].sort((a, b) => a.sort_order - b.sort_order);
  const categoryLabel = CATEGORIES.find(c => c.id === car.category)?.label || car.category;

  return (
    <AdminLayout title="">
      {/* Breadcrumb & Header */}
      <CarProfileHeader
        car={car}
        status={status}
        onApprove={approveCar}
        onToggleFeatured={toggleFeatured}
        onTogglePublish={togglePublish}
        onDelete={deleteCar}
      />

      <div className="grid gap-6">
        {/* Innsender-info (if submission) */}
        {car.source === 'submission' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 md:p-6">
            <h3 className="font-display text-sm mb-4 flex items-center gap-2">
              <Send className="w-4 h-4" />
              INNSENDT KONTAKT (SNAPSHOT)
            </h3>
            
            <div className="space-y-4">
              {/* Grunnleggende info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {car.submitted_by_name && (
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Navn</span>
                      <p className="font-medium">{car.submitted_by_name}</p>
                    </div>
                  </div>
                )}
                
                {car.submitted_by_email && (
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">E-post</span>
                      <a 
                        href={`mailto:${car.submitted_by_email}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {car.submitted_by_email}
                      </a>
                    </div>
                  </div>
                )}
                
                {car.submitted_by_phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Telefon</span>
                      <a 
                        href={`tel:${car.submitted_by_phone}`}
                        className="font-medium text-blue-600 hover:underline"
                      >
                        {car.submitted_by_phone}
                      </a>
                    </div>
                  </div>
                )}
                
                {car.created_at && (
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs text-muted-foreground block">Innsendt</span>
                      <p className="font-medium">
                        {new Date(car.created_at).toLocaleDateString('nb-NO', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notater/melding */}
              {car.submitted_notes && (
                <div className="pt-3 border-t border-blue-200">
                  <span className="text-xs text-muted-foreground block mb-1">Notat/Melding</span>
                  <p className="text-sm whitespace-pre-wrap">{car.submitted_notes}</p>
                </div>
              )}

              {/* Redigeringsgodkjenning */}
              <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800">
                <h4 className="font-display text-sm mb-3 flex items-center gap-2">
                  <FileEdit className="w-4 h-4 text-blue-600" />
                  REDIGERINGSGODKJENNING
                </h4>
                
                {(() => {
                  const allowEdits = getAllowEdits();
                  if (allowEdits !== null) {
                    return (
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        allowEdits 
                          ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800' 
                          : 'bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800'
                      }`}>
                        {allowEdits ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-800 dark:text-green-200">
                                Ja – redigering tillatt
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Innsender godkjenner at du kan redigere og forbedre innholdet før publisering
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-800 dark:text-gray-200">
                                Nei – publiseres som den er
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Innsender ønsker at innholdet publiseres uten redigering
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-800 dark:text-yellow-200">
                            Redigeringsgodkjenning mangler
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Verifiser med innsender før publisering
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Instagram consent */}
              {car.source === 'submission' && (() => {
                const payload = car.submission_payload as Record<string, unknown> | null;
                const allowInstagram = payload?.allow_instagram === true;
                return (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    allowInstagram
                      ? 'bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800'
                      : 'bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800'
                  }`}>
                    {allowInstagram ? (
                      <>
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800 dark:text-green-200">
                            Ja – Instagram-deling godkjent
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Innsender godkjenner deling av bilder og beskrivelse på{" "}
                            <a href="https://www.instagram.com/simcanorge/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">@simcanorge</a>
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-200">
                            Nei – Instagram-deling ikke godkjent
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}
              {/* Club join request */}
              {car.source === 'submission' && (() => {
                const payload = car.submission_payload as Record<string, unknown> | null;
                const clubReq = payload && typeof payload === 'object' && 'club_join_request' in payload
                  ? payload.club_join_request as Record<string, unknown> | null
                  : null;
                if (!clubReq || clubReq.requested !== true) return null;
                return <ClubLinkRequestBox carId={car.id} clubReq={clubReq} />;
              })()}

              {car.submission_payload && (
                <Collapsible className="pt-3 border-t border-blue-200">
                  <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ChevronDown className="w-3 h-3" />
                    Detaljer fra innsending (JSON)
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <pre className="text-xs bg-white/50 p-3 rounded overflow-x-auto">
                      {JSON.stringify(car.submission_payload, null, 2)}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </div>
        )}

        {/* Publiseringsforespørsel */}
        {openRequest && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 md:p-6">
            <h3 className="font-display text-sm mb-4 flex items-center gap-2 text-amber-800">
              <Clock className="w-4 h-4" />
              PUBLISERINGSFORESPØRSEL
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Forespurt handling:</p>
                  <p className="font-medium text-amber-800">
                    {openRequest.action === 'publish' ? 'Publiser bil' : 'Avpubliser bil'}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-muted-foreground">Forespurt dato:</p>
                  <p className="font-medium">
                    {new Date(openRequest.created_at).toLocaleDateString('nb-NO', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
              
              {openRequest.message && (
                <div className="pt-3 border-t border-amber-200">
                  <p className="text-xs text-muted-foreground">Melding:</p>
                  <p className="text-sm">{openRequest.message}</p>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2 pt-3 border-t border-amber-200">
                <Button
                  size="sm"
                  onClick={() => handlePublicationRequest(true)}
                  className="bg-green-600 hover:bg-green-700 gap-2"
                >
                  <Check className="w-4 h-4" />
                  {openRequest.action === 'publish' ? 'Utfør publisering' : 'Utfør avpublisering'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePublicationRequest(false)}
                  className="gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Avslå
                </Button>
              </div>
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
            <div className="space-y-4">
              <CarFormFields
                formData={{
                  brand: basicForm.brand,
                  model: basicForm.model,
                  variant: basicForm.variant,
                  body_type: basicForm.body_type,
                  year: basicForm.year,
                }}
                onChange={handleFormFieldChange}
                disabled={isSaving}
                showTooltips={false}
              />
              
              {/* Kategori og Tags - ikke del av CarFormFields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Kategori</label>
                  <select
                    value={basicForm.category}
                    onChange={(e) => setBasicForm({ ...basicForm, category: e.target.value })}
                    className="w-full h-12 px-3 text-base border-2 border-foreground bg-card rounded"
                    disabled={isSaving}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Tags (kommaseparert)</label>
                  <Input
                    value={basicForm.tags}
                    onChange={(e) => setBasicForm({ ...basicForm, tags: e.target.value })}
                    placeholder="original, veteran, rallye"
                    className="h-12 text-base border-2 border-foreground"
                    disabled={isSaving}
                  />
                </div>
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
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {sortedImages.map((img, index) => (
                <div key={img.id} className="relative group">
                  <img
                    src={img.image_url}
                    alt={img.alt_text || `Bilde ${index + 1}`}
                    className="w-full aspect-square object-cover rounded-lg border"
                  />
                  {index === 0 && (
                    <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1 py-0.5 rounded">
                      Hoved
                    </span>
                  )}
                  <button
                    onClick={() => deleteImage(img.id)}
                    className="absolute top-1 right-1 bg-red-500/90 text-white p-1.5 rounded-full md:opacity-0 md:group-hover:opacity-100 transition-opacity"
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

        {/* Eksterne lenker */}
        <CarLinksSection carId={car.id} externalLinks={car.external_links} />

        {/* Eiere & Tilgang */}
        <OwnerSection 
          carId={car.id} 
          isApproved={!!car.approved_at} 
          submittedEmail={car.submitted_by_email}
          carTitle={car.title}
          submittedName={car.submitted_by_name}
        />

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
