import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { Mail, Send, CheckCircle, Phone, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Navn må være minst 2 tegn").max(100, "Navn kan ikke være mer enn 100 tegn"),
  email: z.string().trim().email("Ugyldig e-postadresse").max(255, "E-post kan ikke være mer enn 255 tegn"),
  phone: z.string().trim().max(20, "Telefonnummer kan ikke være mer enn 20 tegn").optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Emne må være minst 2 tegn").max(200, "Emne kan ikke være mer enn 200 tegn"),
  message: z.string().trim().min(10, "Meldingen må være minst 10 tegn").max(5000, "Meldingen kan ikke være mer enn 5000 tegn"),
});

export default function Kontakt() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("messages").insert({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone || null,
        subject: result.data.subject,
        message: result.data.message,
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Takk for meldingen!",
        description: "Vi svarer deg så snart vi kan.",
      });
    } catch (error) {
      console.error("Contact form error:", error);
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
        <section className="min-h-[80vh] flex items-center relative overflow-hidden">
          <div className="absolute inset-0 top-0 h-1/2 bg-gradient-to-b from-[#1F66B5] to-[#0F3E7A]" />
          <div className="absolute inset-0 top-1/2 bg-gradient-to-b from-[#C10D0D] to-[#9A0A0A]" />
          <div className="absolute inset-0 stripes-diagonal opacity-30" />

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="badge-frame bg-white/10 backdrop-blur-sm p-12 max-w-lg mx-auto">
              <CheckCircle className="w-20 h-20 text-white mx-auto mb-6" />
              <h1 className="font-display text-4xl md:text-5xl text-white mb-4">TAKK!</h1>
              <p className="font-serif text-xl text-white/90">
                Vi har mottatt meldingen din og svarer deg så snart vi kan.
              </p>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader
        title="KONTAKT OSS"
        subtitle="Har du spørsmål eller tilbakemeldinger? Send oss en melding!"
      />

      <section className="poster-section">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection>
              <div
                className="border-4 border-transparent bg-clip-padding rounded-3xl overflow-hidden shadow-2xl"
                style={{
                  background:
                    "linear-gradient(white, white) padding-box, linear-gradient(180deg, #F2F4F7 0%, #B8C0CC 20%, #FFFFFF 40%, #7A8596 60%, #F2F4F7 80%, #5B6472 100%) border-box",
                }}
              >
                <div className="bg-gradient-to-r from-[#1F66B5] to-[#2B7BD4] p-6">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-white" />
                    <h2 className="font-display text-2xl md:text-3xl text-white">SEND OSS EN MELDING</h2>
                  </div>
                </div>

                <div className="bg-card p-8 md:p-10">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-lg font-display">
                        DITT NAVN *
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Ola Nordmann"
                        className={`text-lg py-6 border-2 ${errors.name ? "border-destructive" : "border-muted"}`}
                        required
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    {/* Email and Phone */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-lg font-display">
                          E-POST *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="ola@eksempel.no"
                          className={`text-lg py-6 border-2 ${errors.email ? "border-destructive" : "border-muted"}`}
                          required
                        />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-lg font-display">
                          TELEFON
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="123 45 678"
                          className={`text-lg py-6 border-2 ${errors.phone ? "border-destructive" : "border-muted"}`}
                        />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-lg font-display">
                        EMNE *
                      </Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Hva gjelder henvendelsen?"
                        className={`text-lg py-6 border-2 ${errors.subject ? "border-destructive" : "border-muted"}`}
                        required
                      />
                      {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-lg font-display">
                        MELDING *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Skriv meldingen din her..."
                        rows={6}
                        className={`text-lg border-2 resize-none ${errors.message ? "border-destructive" : "border-muted"}`}
                        required
                      />
                      {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                    </div>

                    {/* Submit */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full btn-enamel-blue text-xl py-6"
                    >
                      {isSubmitting ? (
                        "Sender..."
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Send melding
                        </>
                      )}
                    </Button>
                  </form>
                </div>

                <div className="bg-gradient-to-r from-[#C10D0D] to-[#D41515] p-4">
                  <p className="text-center text-white/80 text-sm font-serif italic">
                    Vi svarer vanligvis innen 1-2 virkedager
                  </p>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </Layout>
  );
}
