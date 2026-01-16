import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { Send, CheckCircle, MessageSquare, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { ReportProblemModal } from "@/components/support";
import { useAuth } from "@/hooks/useAuth";
const contactSchema = z.object({
  name: z.string().trim().min(2, "Navn må være minst 2 tegn").max(100, "Navn kan ikke være mer enn 100 tegn"),
  email: z.string().trim().email("Ugyldig e-postadresse").max(255, "E-post kan ikke være mer enn 255 tegn"),
  phone: z.string().trim().max(20, "Telefonnummer kan ikke være mer enn 20 tegn").optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Emne må være minst 2 tegn").max(200, "Emne kan ikke være mer enn 200 tegn"),
  message: z.string().trim().min(10, "Meldingen må være minst 10 tegn").max(5000, "Meldingen kan ikke være mer enn 5000 tegn"),
  messageType: z.enum(["contact", "report_problem"])
});
const MIN_SUBMIT_INTERVAL = 2000; // 2 sekunder mellom submits

export default function Kontakt() {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    messageType: "contact" as "contact" | "report_problem"
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting check
    const now = Date.now();
    if (now - lastSubmitTime < MIN_SUBMIT_INTERVAL) {
      toast({
        title: "Vent litt",
        description: "Vennligst vent før du sender inn igjen.",
        variant: "destructive"
      });
      return;
    }
    setLastSubmitTime(now);
    setErrors({});
    const result = contactSchema.safeParse(formData);
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
      const {
        error
      } = await supabase.from("messages").insert({
        name: result.data.name,
        email: result.data.email,
        phone: result.data.phone || null,
        subject: result.data.subject,
        message: result.data.message,
        message_type: result.data.messageType
      });
      if (error) throw error;
      setSubmitted(true);
      toast({
        title: "Takk for meldingen!",
        description: "Vi svarer deg så snart vi kan."
      });
    } catch (error) {
      console.error("Contact form error:", error);
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
      </Layout>;
  }
  return <Layout>
      <PageHeader title="KONTAKT OSS" subtitle="Har du spørsmål eller tilbakemeldinger? Send oss en melding!" />

      {/* Quick Contact Banner */}
      

      <section className="poster-section">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto">
            <AnimatedSection>
              <div className="border-4 border-transparent bg-clip-padding rounded-3xl overflow-hidden shadow-2xl" style={{
              background: "linear-gradient(white, white) padding-box, linear-gradient(180deg, #F2F4F7 0%, #B8C0CC 20%, #FFFFFF 40%, #7A8596 60%, #F2F4F7 80%, #5B6472 100%) border-box"
            }}>
                <div className="bg-gradient-to-r from-[#1F66B5] to-[#2B7BD4] p-6">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-white" />
                    <h2 className="font-display text-2xl md:text-3xl text-white">SEND OSS EN MELDING</h2>
                  </div>
                </div>

                <div className="bg-card p-4 sm:p-6 md:p-10">
                  <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* Message Type */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="messageType" className="text-base sm:text-lg font-display">
                        TYPE MELDING *
                      </Label>
                      <Select value={formData.messageType} onValueChange={(value: "contact" | "report_problem") => {
                      if (value === "report_problem") {
                        setReportModalOpen(true);
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          messageType: value
                        }));
                      }
                    }}>
                        <SelectTrigger className="h-12 sm:h-14 border-2 border-muted">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contact">Vanlig kontakt</SelectItem>
                          <SelectItem value="report_problem">Rapportere problem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Name */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="name" className="text-base sm:text-lg font-display">
                        DITT NAVN *
                      </Label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ola Nordmann" className={`text-base sm:text-lg h-12 sm:h-14 border-2 ${errors.name ? "border-destructive" : "border-muted"}`} required />
                      {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                    </div>

                    {/* Email and Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="email" className="text-base sm:text-lg font-display">
                          E-POST *
                        </Label>
                        <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="ola@eksempel.no" className={`text-base sm:text-lg h-12 sm:h-14 border-2 ${errors.email ? "border-destructive" : "border-muted"}`} required />
                        {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                      </div>

                      <div className="space-y-1.5 sm:space-y-2">
                        <Label htmlFor="phone" className="text-base sm:text-lg font-display">
                          TELEFON
                        </Label>
                        <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="123 45 678" className={`text-base sm:text-lg h-12 sm:h-14 border-2 ${errors.phone ? "border-destructive" : "border-muted"}`} />
                        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                      </div>
                    </div>

                    {/* Subject */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="subject" className="text-base sm:text-lg font-display">
                        EMNE *
                      </Label>
                      <Input id="subject" name="subject" value={formData.subject} onChange={handleChange} placeholder="Hva gjelder henvendelsen?" className={`text-base sm:text-lg h-12 sm:h-14 border-2 ${errors.subject ? "border-destructive" : "border-muted"}`} required />
                      {errors.subject && <p className="text-sm text-destructive">{errors.subject}</p>}
                    </div>

                    {/* Message */}
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="message" className="text-base sm:text-lg font-display">
                        MELDING *
                      </Label>
                      <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Skriv meldingen din her..." rows={5} className={`text-base sm:text-lg border-2 resize-none min-h-[120px] sm:min-h-[150px] ${errors.message ? "border-destructive" : "border-muted"}`} required />
                      {errors.message && <p className="text-sm text-destructive">{errors.message}</p>}
                    </div>

                    {/* Submit */}
                    <Button type="submit" disabled={isSubmitting} className="w-full btn-enamel-blue text-lg sm:text-xl h-12 sm:h-14">
                      {isSubmitting ? "Sender..." : <>
                          <Send className="w-5 h-5 mr-2" />
                          Send melding
                        </>}
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

      {/* CTA Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="font-display text-2xl md:text-3xl text-foreground mb-2">
              ELLER UTFORSK VIDERE
            </h2>
            <p className="text-muted-foreground">
              Se bilene våre eller finn deler til din Simca
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/biler" className="btn-enamel-blue">
              Se alle biler
            </Link>
            <Link to="/deler" className="btn-enamel-red">
              Finn deler
            </Link>
            <Link to="/send-inn" className="inline-flex items-center gap-2 font-display text-lg uppercase tracking-wide text-foreground hover:text-accent transition-colors border-2 border-foreground px-6 py-3 rounded-lg hover:bg-foreground hover:text-background">
              Send inn din bil
            </Link>
          </div>
        </div>
      </section>
      <ReportProblemModal open={reportModalOpen} onOpenChange={setReportModalOpen} userId={user?.id} />
    </Layout>;
}