import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { X, Send, ArrowLeft, Check, User, Package } from "lucide-react";
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

const MIN_SUBMIT_INTERVAL = 2000;

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

  // Fetch enriched data for cart items
  const listingIds = useMemo(() => items.filter(i => i.type === "listing").map(i => i.id), [items]);
  const partIds = useMemo(() => items.filter(i => i.type === "part").map(i => i.id), [items]);

  const { data: listingsData } = useQuery({
    queryKey: ["cart-listings", listingIds],
    queryFn: async () => {
      if (listingIds.length === 0) return [];
      const { data } = await supabase
        .from("marketplace_items")
        .select(`
          id, title, price, price_note, slug,
          owners!marketplace_items_owner_id_fkey(display_name, avatar_url),
          marketplace_images(image_url, sort_order)
        `)
        .in("id", listingIds)
        .order("sort_order", { referencedTable: "marketplace_images", ascending: true });
      return data ?? [];
    },
    enabled: listingIds.length > 0,
  });

  const { data: partsData } = useQuery({
    queryKey: ["cart-parts", partIds],
    queryFn: async () => {
      if (partIds.length === 0) return [];
      const { data } = await supabase
        .from("parts")
        .select(`
          id, title, price_min, price_max, price_note, slug,
          part_images(image_url, sort_order)
        `)
        .in("id", partIds)
        .order("sort_order", { referencedTable: "part_images", ascending: true });
      return data ?? [];
    },
    enabled: partIds.length > 0,
  });

  // Build enriched items map
  const enrichedMap = useMemo(() => {
    const map = new Map<string, {
      image?: string;
      price?: string;
      ownerName?: string;
      ownerAvatar?: string;
    }>();
    listingsData?.forEach((l: any) => {
      const firstImage = l.marketplace_images?.[0]?.image_url;
      const owner = l.owners;
      let priceStr = l.price_note || undefined;
      if (l.price != null) priceStr = `${Number(l.price).toLocaleString("nb-NO")} kr`;
      map.set(l.id, {
        image: firstImage,
        price: priceStr,
        ownerName: owner?.display_name,
        ownerAvatar: owner?.avatar_url,
      });
    });
    partsData?.forEach((p: any) => {
      const firstImage = p.part_images?.[0]?.image_url;
      let priceStr = p.price_note || undefined;
      if (p.price_min != null && p.price_max != null) {
        priceStr = `${p.price_min.toLocaleString("nb-NO")} – ${p.price_max.toLocaleString("nb-NO")} kr`;
      } else if (p.price_min != null) {
        priceStr = `fra ${p.price_min.toLocaleString("nb-NO")} kr`;
      }
      map.set(p.id, {
        image: firstImage,
        price: priceStr,
        ownerName: "Simca Norge",
      });
    });
    return map;
  }, [listingsData, partsData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = Date.now();
    if (now - lastSubmitTime < MIN_SUBMIT_INTERVAL) {
      toast.error("Vent litt", { description: "Vennligst vent før du sender inn igjen." });
      return;
    }

    if (items.length === 0) {
      toast.error("Du må legge til minst én vare i verktøykassen");
      return;
    }

    setLastSubmitTime(now);

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
            type: item.type,
            id: item.id,
            title: item.title,
          })),
        },
      });

      if (error) throw error;

      if (data.success) {
        setIsSuccess(true);
        clearCart();
        toast.success("Forespørsel sendt!", {
          description: "Forespørselen er lagt i selgerens innboks. Selgeren vil ta kontakt.",
        });
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
                Forespørselen din er sendt! Selgeren vil ta kontakt
                så snart som mulig. 🔧
              </p>
              <Link to="/markedsplass" className="btn-enamel-blue">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Tilbake til markedsplassen
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
        subtitle="Se over varene du har samlet og send inn forespørselen din"
      />

      <section className="poster-section">
        <div className="container mx-auto">
          {items.length === 0 ? (
            <div className="text-center py-6 animate-fade-in">
              <div className="pt-2 pb-2 md:pt-3 md:pb-3 flex justify-center">
                <img
                  src={toolboxIcon}
                  alt="Verktøykasse"
                  className="w-28 h-auto md:w-36 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)] [filter:drop-shadow(0_0_8px_rgba(255,255,255,0.15))]"
                />
              </div>
              <h2 className="headline-md mb-4">VERKTØYKASSEN ER TOM</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Her samler du varer til prosjektet ditt. Bla gjennom markedsplassen og legg til det du trenger.
              </p>
              <Link to="/markedsplass" className="btn-enamel-blue">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Bla i markedsplassen
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Items */}
              <div className="animate-slide-in-left">
                <h2 className="headline-md mb-6">I VERKTØYKASSEN ({items.length})</h2>
                <div className="space-y-4 stagger-children">
                  {items.map((item) => {
                    const enriched = enrichedMap.get(item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-4 border-chrome bg-card p-4 rounded-xl"
                      >
                        {/* Image */}
                        <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                          {enriched?.image ? (
                            <img src={enriched.image} alt={item.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="font-display text-base sm:text-lg leading-tight truncate">{item.title}</h3>
                              <span className="text-xs text-muted-foreground">
                                {item.type === "listing" ? "Annonse" : "Bildel"}
                              </span>
                            </div>
                            <button
                              onClick={() => removeItem(item.type, item.id)}
                              className="p-1.5 text-accent hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors flex-shrink-0"
                              aria-label={`Fjern ${item.title}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {enriched?.price && (
                            <p className="font-display text-base text-primary mt-1">{enriched.price}</p>
                          )}

                          {/* Seller */}
                          {enriched?.ownerName && (
                            <div className="flex items-center gap-2 mt-2">
                              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                {enriched.ownerAvatar ? (
                                  <img src={enriched.ownerAvatar} alt={enriched.ownerName} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground truncate">{enriched.ownerName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact Form */}
              <div className="animate-slide-in-right">
                <h2 className="headline-md mb-6">DINE OPPLYSNINGER</h2>
                <form onSubmit={handleSubmit} className="border-chrome card-enamel bg-card p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div>
                    <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">NAVN *</label>
                    <input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} className={`w-full h-12 sm:h-auto p-3 text-base border-2 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.customer_name ? "border-accent" : "border-border"}`} required />
                    {errors.customer_name && <p className="text-accent text-sm mt-1">{errors.customer_name}</p>}
                  </div>

                  <div>
                    <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">E-POST *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={`w-full h-12 sm:h-auto p-3 text-base border-2 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all ${errors.email ? "border-accent" : "border-border"}`} required />
                    {errors.email && <p className="text-accent text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">TELEFON (valgfritt)</label>
                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full h-12 sm:h-auto p-3 text-base border-2 border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">BILMODELL</label>
                      <input type="text" name="car_model" value={formData.car_model} onChange={handleChange} placeholder="f.eks. 1000 Rallye" className="w-full h-12 sm:h-auto p-3 text-base border-2 border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                    </div>
                    <div>
                      <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">ÅRSMODELL</label>
                      <input type="number" name="car_year" value={formData.car_year} onChange={handleChange} placeholder="f.eks. 1972" min="1900" max={new Date().getFullYear() + 1} className="w-full h-12 sm:h-auto p-3 text-base border-2 border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-display text-base sm:text-lg mb-1.5 sm:mb-2">MELDING (valgfritt)</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} rows={4} placeholder="Eventuelle spørsmål eller tilleggsinformasjon..." className="w-full p-3 text-base border-2 border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary transition-all resize-none min-h-[100px]" />
                  </div>

                  <button type="submit" disabled={isSubmitting || items.length === 0} className="btn-enamel-red w-full h-12 sm:h-auto disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg">
                    {isSubmitting ? "Sender..." : <><Send className="w-5 h-5 mr-2" />Send forespørsel</>}
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
