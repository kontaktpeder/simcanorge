import { useState, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useInView } from "@/hooks/useInView";
import { Car, Send, Camera, CheckCircle, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
const submissionSchema = z.object({
  owner_name: z.string().trim().min(2, "Navn må være minst 2 tegn").max(100, "Navn kan ikke være mer enn 100 tegn"),
  email: z.string().trim().email("Ugyldig e-postadresse").max(255, "E-post kan ikke være mer enn 255 tegn"),
  phone: z.string().trim().max(20, "Telefonnummer kan ikke være mer enn 20 tegn").optional().or(z.literal("")),
  car_model: z.string().trim().min(2, "Modell må være minst 2 tegn").max(100, "Modell kan ikke være mer enn 100 tegn"),
  car_year: z.number().int().min(1934, "Året må være fra 1934 eller senere").max(1990, "Året må være før 1990").optional().nullable(),
  car_story: z.string().trim().max(5000, "Historien kan ikke være mer enn 5000 tegn").optional().or(z.literal(""))
});
function AnimatedSection({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const {
    ref,
    isInView
  } = useInView();
  return <div ref={ref} className={`transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>;
}
export default function SendInnBil() {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    owner_name: "",
    email: "",
    phone: "",
    car_model: "",
    car_year: "",
    car_story: ""
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 10) {
      toast({
        title: "For mange bilder",
        description: "Du kan laste opp maksimalt 10 bilder.",
        variant: "destructive"
      });
      return;
    }
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ugyldig filtype",
          description: `${file.name} er ikke et bilde.`,
          variant: "destructive"
        });
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Filen er for stor",
          description: `${file.name} er over 10MB.`,
          variant: "destructive"
        });
        return false;
      }
      return true;
    });
    setImages(prev => [...prev, ...validFiles]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };
  const uploadImages = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    const timestamp = Date.now();
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `submissions/${timestamp}_${i}.${fileExt}`;
      const {
        error: uploadError
      } = await supabase.storage.from('simca-images').upload(fileName, file);
      if (uploadError) {
        console.error('Upload error:', uploadError);
        continue;
      }
      const {
        data: urlData
      } = supabase.storage.from('simca-images').getPublicUrl(fileName);
      uploadedUrls.push(urlData.publicUrl);
      setUploadProgress(Math.round((i + 1) / images.length * 100));
    }
    return uploadedUrls;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const dataToValidate = {
      ...formData,
      car_year: formData.car_year ? parseInt(formData.car_year) : null,
      phone: formData.phone || undefined,
      car_story: formData.car_story || undefined
    };
    const result = submissionSchema.safeParse(dataToValidate);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }
    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      // Upload images first
      let imageUrls: string[] = [];
      if (images.length > 0) {
        imageUrls = await uploadImages();
      }
      const {
        error
      } = await supabase.from("car_submissions").insert({
        owner_name: result.data.owner_name,
        email: result.data.email,
        phone: result.data.phone || null,
        car_model: result.data.car_model,
        car_year: result.data.car_year,
        car_story: result.data.car_story || null,
        images: imageUrls
      });
      if (error) throw error;
      setSubmitted(true);
      toast({
        title: "Takk for innsendingen!",
        description: "Vi ser gjennom historien din og tar kontakt."
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Noe gikk galt",
        description: "Prøv igjen senere.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  if (submitted) {
    return <Layout>
        <section className="min-h-[80vh] flex items-center relative overflow-hidden">
          {/* Blue top */}
          <div className="absolute inset-0 top-0 h-1/2 bg-gradient-to-b from-[#1F66B5] to-[#0F3E7A]" />
          {/* Red bottom */}
          <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-[#C10D0D] to-[#9A0A0A]" />
          <div className="absolute inset-0 stripes-diagonal opacity-30" />
          
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="badge-frame bg-white/10 backdrop-blur-sm p-12 max-w-lg mx-auto">
              <CheckCircle className="w-20 h-20 text-white mx-auto mb-6" />
              <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
                TAKK!
              </h1>
              <p className="font-serif text-xl text-white/90">
                Vi ser gjennom historien din og tar kontakt på e-post hvis vi ønsker å vise den frem på siden.
              </p>
            </div>
          </div>
        </section>
      </Layout>;
  }
  return <Layout>
      <PageHeader 
        title="SEND INN DIN BIL" 
        subtitle="Har du en Simca, Talbot eller Matra? Del historien din med oss!" 
      />

      {/* Form Section */}
      <section className="poster-section">
        
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl mx-auto">
              <AnimatedSection>
                {/* Chrome-framed form card */}
                <div className="border-4 border-transparent bg-clip-padding rounded-3xl overflow-hidden shadow-2xl" style={{
                background: 'linear-gradient(white, white) padding-box, linear-gradient(180deg, #F2F4F7 0%, #B8C0CC 20%, #FFFFFF 40%, #7A8596 60%, #F2F4F7 80%, #5B6472 100%) border-box'
              }}>
                  {/* Inner blue header */}
                  <div className="bg-gradient-to-r from-[#1F66B5] to-[#2B7BD4] p-6">
                    <div className="flex items-center gap-3">
                      <Car className="w-8 h-8 text-white" />
                      <h2 className="font-display text-2xl md:text-3xl text-white">
                        FORTELL OSS OM BILEN DIN
                      </h2>
                    </div>
                  </div>

                  {/* Form content */}
                  <div className="bg-card p-8 md:p-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="owner_name" className="text-lg font-display">DITT NAVN *</Label>
                        <Input id="owner_name" name="owner_name" value={formData.owner_name} onChange={handleChange} placeholder="Ola Nordmann" className={`text-lg py-6 border-2 ${errors.owner_name ? 'border-destructive' : 'border-muted'}`} required />
                        {errors.owner_name && <p className="text-sm text-destructive">{errors.owner_name}</p>}
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-lg font-display">E-POST *</Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="ola@eksempel.no" className={`text-lg py-6 border-2 ${errors.email ? 'border-destructive' : 'border-muted'}`} required />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>

                      {/* Phone */}
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-lg font-display">TELEFON</Label>
                        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="123 45 678" className={`text-lg py-6 border-2 ${errors.phone ? 'border-destructive' : 'border-muted'}`} />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Model */}
                        <div className="space-y-2">
                          <Label htmlFor="car_model" className="text-lg font-display">BILMODELL *</Label>
                          <Input id="car_model" name="car_model" value={formData.car_model} onChange={handleChange} placeholder="f.eks. Simca 1000" className={`text-lg py-6 border-2 ${errors.car_model ? 'border-destructive' : 'border-muted'}`} required />
                          {errors.car_model && <p className="text-sm text-destructive">{errors.car_model}</p>}
                        </div>

                        {/* Year */}
                        <div className="space-y-2">
                          <Label htmlFor="car_year" className="text-lg font-display">ÅRSMODELL</Label>
                          <Input id="car_year" name="car_year" type="number" min="1934" max="1990" value={formData.car_year} onChange={handleChange} placeholder="f.eks. 1968" className={`text-lg py-6 border-2 ${errors.car_year ? 'border-destructive' : 'border-muted'}`} />
                          {errors.car_year && <p className="text-sm text-destructive">{errors.car_year}</p>}
                        </div>
                      </div>

                      {/* Story */}
                      <div className="space-y-2">
                        <Label htmlFor="car_story" className="text-lg font-display">HISTORIEN BAK BILEN</Label>
                        <Textarea id="car_story" name="car_story" value={formData.car_story} onChange={handleChange} placeholder="Fortell oss om bilen din – hvordan du fant den, restaureringen, minner, planer..." className={`text-lg min-h-[180px] border-2 ${errors.car_story ? 'border-destructive' : 'border-muted'}`} />
                        {errors.car_story && <p className="text-sm text-destructive">{errors.car_story}</p>}
                        <p className="text-sm text-muted-foreground">
                          Jo mer du forteller, jo bedre kan vi presentere bilen din.
                        </p>
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-4">
                        <Label className="text-lg font-display flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          BILDER AV BILEN
                        </Label>
                        
                        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" />

                        {/* Image previews */}
                        {imagePreviews.length > 0 && <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {imagePreviews.map((preview, index) => <div key={index} className="relative aspect-square rounded-lg overflow-hidden border-2 border-muted">
                                <img src={preview} alt={`Bilde ${index + 1}`} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 hover:bg-destructive/80 transition-colors">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>)}
                          </div>}

                        {/* Upload button */}
                        {images.length < 10 && <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full border-2 border-dashed border-muted-foreground/30 rounded-xl p-8 hover:border-accent hover:bg-accent/5 transition-all group">
                            <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-accent">
                              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-accent/10">
                                <ImagePlus className="w-7 h-7" />
                              </div>
                              <div className="text-center">
                                <p className="font-display text-lg">LAST OPP BILDER</p>
                                <p className="text-sm">Maks 10 bilder, 10MB per bilde</p>
                              </div>
                            </div>
                          </button>}

                        <p className="text-sm text-muted-foreground">
                          {images.length}/10 bilder valgt
                        </p>
                      </div>

                      {/* Progress bar during upload */}
                      {isSubmitting && images.length > 0 && <div className="space-y-2">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-accent transition-all duration-300" style={{
                          width: `${uploadProgress}%`
                        }} />
                          </div>
                          <p className="text-sm text-muted-foreground text-center">
                            Laster opp bilder... {uploadProgress}%
                          </p>
                        </div>}

                      {/* Submit */}
                      <Button type="submit" disabled={isSubmitting} className="w-full btn-enamel-blue text-xl py-6">
                        {isSubmitting ? "Sender..." : <>
                            <Send className="w-5 h-5 mr-2" />
                            Send inn
                          </>}
                      </Button>
                    </form>
                  </div>

                  {/* Inner red footer */}
                  <div className="bg-gradient-to-r from-[#C10D0D] to-[#D41515] p-4">
                    <p className="text-center text-white/80 text-sm font-serif italic">
                      Alle innsendinger blir gjennomgått av Simca Norge
                    </p>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
      </section>
    </Layout>;
}