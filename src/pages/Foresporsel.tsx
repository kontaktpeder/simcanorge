import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { X, Send, ArrowLeft, Check } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import toolboxIcon from "@/assets/toolbox-blue.png";

const inquirySchema = z.object({
  customer_name: z.string().trim().min(1, "Navn er påkrevd").max(100),
  email: z.string().trim().email("Ugyldig e-postadresse").max(255),
  phone: z.string().trim().max(20).optional(),
  car_model: z.string().trim().max(100).optional(),
  car_year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  message: z.string().trim().max(1000).optional(),
});

const MIN_SUBMIT_INTERVAL = 2000; // 2 sekunder mellom submits

const Foresporsel = () => {
  const { items, removeItem, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    email: "",
    phone: "",
    car_model: "",
    car_year: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSubmitTime, setLastSubmitTime] = useState<number>(0);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting check
    const now = Date.now();
    if (now - lastSubmitTime < MIN_SUBMIT_INTERVAL) {
      toast.error("Vent litt", {
        description: "Vennligst vent før du sender inn igjen.",
      });
      return;
    }

    if (items.length === 0) {
      toast.error("Du må legge til minst én del i verktøykassen");
      return;
    }

    setLastSubmitTime(now);

    // Validate form
    const validationData = {
      ...formData,
      car_year: formData.car_year ? parseInt(formData.car_year) : undefined,
    };

    const result = inquirySchema.safeParse(validationData);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke("send-inquiry", {
        body: {
          ...result.data,
          items: items.map((item) => ({
            part_id: item.part_id,
            part_title: item.part_title,
          })),
        },
      });

      if (error) throw error;

      if (data.success) {
        setIsSuccess(true);
        clearCart();
        toast.success("Forespørsel mottatt! Vi tar kontakt snart.");
      } else {
        throw new Error(data.error || "Noe gikk galt");
      }
    } catch (error: any) {
      console.error("Error submitting inquiry:", error);
      toast.error(error.message || "Kunne ikke sende forespørselen. Prøv igjen.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Layout>
        <section className="poster-section min-h-[60vh] flex items-center justify-center">
          <div className="container mx-auto text-center">
            <div className="border-chrome card-enamel bg-card max-w-lg mx-auto p-8 animate-scale-in">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-500 text-white rounded-full flex items-center justify-center animate-pulse">
                <Check className="w-10 h-10" />
              </div>
              <h1 className="headline-md text-accent mb-4">TAKK FOR DIN FORESPØRSEL!</h1>
              <p className="text-lg mb-6">
                Forespørselen din er mottatt og ligger i vår innboks.
                Vi tar kontakt så snart som mulig! 🔧
              </p>
              <Link to="/deler" className="btn-enamel-blue">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Tilbake til deler
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader 
        title="MIN VERKTØYKASSE" 
        subtitle="Se over delene du har samlet og send inn forespørselen din" 
      />

      <section className="poster-section">
        <div className="container mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              {/* Toolbox illustration container */}
              <div className="pt-6 pb-4 md:pt-8 md:pb-6 flex justify-center">
                <img 
                  src={toolboxIcon} 
                  alt="Verktøykasse" 
                  className="w-28 h-auto md:w-36 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)] [filter:drop-shadow(0_0_8px_rgba(255,255,255,0.15))]" 
                />
              </div>
              <h2 className="headline-md mb-4">VERKTØYKASSEN ER TOM</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Her samler du deler til prosjektet ditt. Bla gjennom delekatalogen og legg til det du trenger.
              </p>
              <Link to="/deler" className="btn-enamel-blue">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Bla i deler
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Toolbox Items */}
              <div className="animate-slide-in-left">
                <h2 className="headline-md mb-6">DELER I VERKTØYKASSEN ({items.length})</h2>
                <div className="space-y-4 stagger-children">
                  {items.map((item) => (
                    <div
                      key={item.part_id}
                      className="flex items-center justify-between border-chrome bg-card p-4 rounded-xl"
                    >
                      <span className="font-medium">{item.part_title}</span>
                      <button
                        onClick={() => removeItem(item.part_id)}
                        className="p-2 text-accent hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
                        aria-label={`Fjern ${item.part_title}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <div className="animate-slide-in-right">
                <h2 className="headline-md mb-6">DINE OPPLYSNINGER</h2>
                <form onSubmit={handleSubmit} className="border-chrome card-enamel bg-card p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">
                      NAVN *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      className={`w-full h-12 sm:h-auto p-3 text-base border-2 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                        errors.customer_name ? "border-accent" : "border-border"
                      }`}
                      required
                    />
                    {errors.customer_name && (
                      <p className="text-accent text-sm mt-1">{errors.customer_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">
                      E-POST *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full h-12 sm:h-auto p-3 text-base border-2 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${
                        errors.email ? "border-accent" : "border-border"
                      }`}
                      required
                    />
                    {errors.email && (
                      <p className="text-accent text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">
                      TELEFON (valgfritt)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full h-12 sm:h-auto p-3 text-base border-2 border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">
                        BILMODELL
                      </label>
                      <input
                        type="text"
                        name="car_model"
                        value={formData.car_model}
                        onChange={handleChange}
                        placeholder="f.eks. 1000 Rallye"
                        className="w-full h-12 sm:h-auto p-3 text-base border-2 border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                    <div>
                      <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">
                        ÅRSMODELL
                      </label>
                      <input
                        type="number"
                        name="car_year"
                        value={formData.car_year}
                        onChange={handleChange}
                        placeholder="f.eks. 1972"
                        min="1900"
                        max={new Date().getFullYear() + 1}
                        className="w-full h-12 sm:h-auto p-3 text-base border-2 border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">
                      MELDING (valgfritt)
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Eventuelle spørsmål eller tilleggsinformasjon..."
                      className="w-full p-3 text-base border-2 border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none min-h-[100px]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || items.length === 0}
                    className="btn-enamel-red w-full h-12 sm:h-auto disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
                  >
                    {isSubmitting ? (
                      "Sender..."
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Send forespørsel
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Foresporsel;
