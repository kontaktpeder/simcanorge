import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { X, Send, ShoppingBag, ArrowLeft, Check } from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";

const inquirySchema = z.object({
  customer_name: z.string().trim().min(1, "Navn er påkrevd").max(100),
  email: z.string().trim().email("Ugyldig e-postadresse").max(255),
  phone: z.string().trim().max(20).optional(),
  car_model: z.string().trim().max(100).optional(),
  car_year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  message: z.string().trim().max(1000).optional(),
});

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

    if (items.length === 0) {
      toast.error("Du må legge til minst én del i forespørselen");
      return;
    }

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
        toast.success("Forespørsel sendt! Sjekk e-posten din for bekreftelse.");
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
            <div className="retro-card max-w-lg mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 bg-green-500 text-white rounded-full flex items-center justify-center">
                <Check className="w-10 h-10" />
              </div>
              <h1 className="headline-md text-accent mb-4">TAKK FOR DIN FORESPØRSEL!</h1>
              <p className="text-lg mb-6">
                Vi har sendt en bekreftelse til e-posten din. 
                Pappa sjekker hylla og kommer tilbake til deg snart! 🔧
              </p>
              <Link to="/deler" className="btn-retro bg-primary">
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
      <section className="poster-section poster-section-blue">
        <div className="container mx-auto">
          <h1 className="headline-lg text-center mb-4">MIN FORESPØRSEL</h1>
          <p className="text-xl text-center opacity-90 max-w-2xl mx-auto">
            Se over delene du har valgt og send inn forespørselen din.
          </p>
        </div>
      </section>

      <section className="poster-section">
        <div className="container mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="headline-md mb-4">HANDLEKURVEN ER TOM</h2>
              <p className="text-muted-foreground mb-6">
                Du har ikke lagt til noen deler i forespørselen ennå.
              </p>
              <Link to="/deler" className="btn-retro">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Bla i deler
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Cart Items */}
              <div>
                <h2 className="headline-md mb-6">VALGTE DELER ({items.length})</h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div
                      key={item.part_id}
                      className="flex items-center justify-between bg-card p-4 border-2 border-foreground"
                    >
                      <span className="font-medium">{item.part_title}</span>
                      <button
                        onClick={() => removeItem(item.part_id)}
                        className="p-2 text-accent hover:bg-accent hover:text-accent-foreground transition-colors"
                        aria-label={`Fjern ${item.part_title}`}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Form */}
              <div>
                <h2 className="headline-md mb-6">DINE OPPLYSNINGER</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block font-display text-lg mb-2">
                      NAVN *
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      value={formData.customer_name}
                      onChange={handleChange}
                      className={`w-full p-3 border-2 ${
                        errors.customer_name ? "border-accent" : "border-foreground"
                      } bg-card focus:outline-none focus:ring-2 focus:ring-primary`}
                      required
                    />
                    {errors.customer_name && (
                      <p className="text-accent text-sm mt-1">{errors.customer_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-display text-lg mb-2">
                      E-POST *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full p-3 border-2 ${
                        errors.email ? "border-accent" : "border-foreground"
                      } bg-card focus:outline-none focus:ring-2 focus:ring-primary`}
                      required
                    />
                    {errors.email && (
                      <p className="text-accent text-sm mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block font-display text-lg mb-2">
                      TELEFON (valgfritt)
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full p-3 border-2 border-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-display text-lg mb-2">
                        BILMODELL
                      </label>
                      <input
                        type="text"
                        name="car_model"
                        value={formData.car_model}
                        onChange={handleChange}
                        placeholder="f.eks. 1000 Rallye"
                        className="w-full p-3 border-2 border-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block font-display text-lg mb-2">
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
                        className="w-full p-3 border-2 border-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-display text-lg mb-2">
                      MELDING (valgfritt)
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Eventuelle spørsmål eller tilleggsinformasjon..."
                      className="w-full p-3 border-2 border-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || items.length === 0}
                    className="btn-retro w-full disabled:opacity-50 disabled:cursor-not-allowed"
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
