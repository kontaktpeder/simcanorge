import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useInView } from "@/hooks/useInView";
import { Car, Send, Camera, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import simcaSwallow from "@/assets/simca-swallow.png";
import { z } from "zod";

const submissionSchema = z.object({
  owner_name: z.string().trim().min(2, "Navn må være minst 2 tegn").max(100, "Navn kan ikke være mer enn 100 tegn"),
  email: z.string().trim().email("Ugyldig e-postadresse").max(255, "E-post kan ikke være mer enn 255 tegn"),
  phone: z.string().trim().max(20, "Telefonnummer kan ikke være mer enn 20 tegn").optional().or(z.literal("")),
  car_model: z.string().trim().min(2, "Modell må være minst 2 tegn").max(100, "Modell kan ikke være mer enn 100 tegn"),
  car_year: z.number().int().min(1934, "Året må være fra 1934 eller senere").max(1990, "Året må være før 1990").optional().nullable(),
  car_story: z.string().trim().max(5000, "Historien kan ikke være mer enn 5000 tegn").optional().or(z.literal("")),
});

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isInView } = useInView();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
}

export default function SendInnBil() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    owner_name: "",
    email: "",
    phone: "",
    car_model: "",
    car_year: "",
    car_story: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate
    const dataToValidate = {
      ...formData,
      car_year: formData.car_year ? parseInt(formData.car_year) : null,
      phone: formData.phone || undefined,
      car_story: formData.car_story || undefined,
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

    try {
      const { error } = await supabase
        .from("car_submissions")
        .insert({
          owner_name: result.data.owner_name,
          email: result.data.email,
          phone: result.data.phone || null,
          car_model: result.data.car_model,
          car_year: result.data.car_year,
          car_story: result.data.car_story || null,
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Takk for innsendingen!",
        description: "Vi ser gjennom historien din og tar kontakt.",
      });
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Noe gikk galt",
        description: "Prøv igjen senere.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Layout>
        <section className="poster-section poster-section-blue relative overflow-hidden py-20 md:py-28 min-h-[60vh] flex items-center">
          <div className="absolute inset-0 stripes-diagonal" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <CheckCircle className="w-20 h-20 text-white mx-auto mb-6" />
            <h1 className="font-display text-4xl md:text-5xl text-white mb-4">
              TAKK FOR INNSENDINGEN!
            </h1>
            <p className="font-serif text-xl text-white/90 max-w-lg mx-auto">
              Vi ser gjennom historien din og tar kontakt på e-post hvis vi ønsker å vise den frem på siden.
            </p>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="poster-section poster-section-blue relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 stripes-diagonal" />
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            backgroundImage: `url(${simcaSwallow})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: '85% 50%',
            backgroundSize: '400px',
            opacity: 0.08,
            transform: 'rotate(-8deg)'
          }} 
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl">
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-white mb-4">
              SEND INN DIN BIL
            </h1>
            <p className="font-serif text-xl md:text-2xl text-white/90 italic">
              Har du en Simca, Talbot eller Matra? Del historien din med oss!
            </p>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection>
              <div className="badge-frame bg-card p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <Car className="w-8 h-8 text-accent" />
                  <h2 className="font-display text-2xl md:text-3xl text-foreground">
                    FORTELL OSS OM BILEN DIN
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="owner_name" className="text-lg">Ditt navn *</Label>
                    <Input
                      id="owner_name"
                      name="owner_name"
                      value={formData.owner_name}
                      onChange={handleChange}
                      placeholder="Ola Nordmann"
                      className={`text-lg py-6 ${errors.owner_name ? 'border-destructive' : ''}`}
                      required
                    />
                    {errors.owner_name && (
                      <p className="text-sm text-destructive">{errors.owner_name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-lg">E-post *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="ola@eksempel.no"
                      className={`text-lg py-6 ${errors.email ? 'border-destructive' : ''}`}
                      required
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-lg">Telefon (valgfritt)</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="123 45 678"
                      className={`text-lg py-6 ${errors.phone ? 'border-destructive' : ''}`}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Model */}
                    <div className="space-y-2">
                      <Label htmlFor="car_model" className="text-lg">Bilmodell *</Label>
                      <Input
                        id="car_model"
                        name="car_model"
                        value={formData.car_model}
                        onChange={handleChange}
                        placeholder="f.eks. Simca 1000"
                        className={`text-lg py-6 ${errors.car_model ? 'border-destructive' : ''}`}
                        required
                      />
                      {errors.car_model && (
                        <p className="text-sm text-destructive">{errors.car_model}</p>
                      )}
                    </div>

                    {/* Year */}
                    <div className="space-y-2">
                      <Label htmlFor="car_year" className="text-lg">Årsmodell</Label>
                      <Input
                        id="car_year"
                        name="car_year"
                        type="number"
                        min="1934"
                        max="1990"
                        value={formData.car_year}
                        onChange={handleChange}
                        placeholder="f.eks. 1968"
                        className={`text-lg py-6 ${errors.car_year ? 'border-destructive' : ''}`}
                      />
                      {errors.car_year && (
                        <p className="text-sm text-destructive">{errors.car_year}</p>
                      )}
                    </div>
                  </div>

                  {/* Story */}
                  <div className="space-y-2">
                    <Label htmlFor="car_story" className="text-lg">Historien bak bilen</Label>
                    <Textarea
                      id="car_story"
                      name="car_story"
                      value={formData.car_story}
                      onChange={handleChange}
                      placeholder="Fortell oss om bilen din – hvordan du fant den, restaureringen, minner, planer..."
                      className={`text-lg min-h-[200px] ${errors.car_story ? 'border-destructive' : ''}`}
                    />
                    {errors.car_story && (
                      <p className="text-sm text-destructive">{errors.car_story}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Jo mer du forteller, jo bedre kan vi presentere bilen din.
                    </p>
                  </div>

                  {/* Image note */}
                  <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
                    <Camera className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-foreground font-medium">Bilder?</p>
                      <p className="text-sm text-muted-foreground">
                        Vi tar kontakt på e-post for å motta bilder hvis vi ønsker å vise frem bilen din.
                      </p>
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-enamel-red text-xl py-6"
                  >
                    {isSubmitting ? (
                      "Sender..."
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send inn
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </AnimatedSection>

            {/* Info text */}
            <AnimatedSection className="mt-12 text-center">
              <p className="text-lg text-foreground/70">
                Alle innsendinger blir gjennomgått av Simca Norge. Vi tar kontakt hvis vi ønsker å publisere historien din på nettsiden.
              </p>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
}
