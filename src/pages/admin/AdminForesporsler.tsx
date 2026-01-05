import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Phone, Car, Calendar, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { nb } from "date-fns/locale";

interface InquiryItem {
  id: string;
  part_title: string;
}

interface Inquiry {
  id: string;
  customer_name: string;
  email: string;
  phone: string | null;
  car_model: string | null;
  car_year: number | null;
  message: string | null;
  read: boolean;
  created_at: string;
  inquiry_items: InquiryItem[];
}

const AdminForesporsler = () => {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchInquiries = async () => {
    console.log("Fetching inquiries...");
    const { data, error } = await supabase
      .from("inquiries")
      .select(`
        *,
        inquiry_items(id, part_title)
      `)
      .order("created_at", { ascending: false });

    console.log("Inquiries result:", { data, error });
    
    if (error) {
      console.error("Error fetching inquiries:", error);
      toast.error("Kunne ikke hente forespørsler");
    } else {
      setInquiries(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchInquiries();
  }, []);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from("inquiries")
      .update({ read: true })
      .eq("id", id);

    if (error) {
      toast.error("Kunne ikke oppdatere status");
    } else {
      fetchInquiries();
    }
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      // Mark as read when expanded
      const inquiry = inquiries.find((i) => i.id === id);
      if (inquiry && !inquiry.read) {
        markAsRead(id);
      }
    }
  };

  const unreadCount = inquiries.filter((i) => !i.read).length;

  return (
    <AdminLayout title="FORESPØRSLER">
      <div className="flex justify-between items-center mb-6 animate-fade-in">
        <p className="text-muted-foreground">
          {inquiries.length} forespørsel{inquiries.length !== 1 ? "er" : ""} totalt
          {unreadCount > 0 && (
            <span className="ml-2 bg-accent text-accent-foreground px-3 py-1 text-sm font-display rounded-full animate-pulse">
              {unreadCount} ulest{unreadCount !== 1 ? "e" : ""}
            </span>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Laster...</div>
      ) : inquiries.length === 0 ? (
        <div className="border-chrome card-enamel bg-card text-center py-12 animate-fade-in">
          <Mail className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Ingen forespørsler ennå</p>
        </div>
      ) : (
        <div className="space-y-4 stagger-children">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className={`border-chrome card-enamel bg-card p-6 transition-all ${
                !inquiry.read ? "ring-2 ring-accent pulse-glow" : "card-hover-glow"
              }`}
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(inquiry.id)}
              >
                <div className="flex items-center gap-4">
                  {!inquiry.read && (
                    <span className="w-3 h-3 bg-accent rounded-full animate-pulse" />
                  )}
                  <div>
                    <h3 className="font-display text-xl">{inquiry.customer_name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(inquiry.created_at), "d. MMMM yyyy 'kl.' HH:mm", {
                        locale: nb,
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="bg-primary/10 text-primary px-3 py-1 text-sm font-display rounded-full">
                    {inquiry.inquiry_items.length} del{inquiry.inquiry_items.length !== 1 ? "er" : ""}
                  </span>
                  <div className={`transition-transform duration-300 ${expandedId === inquiry.id ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {expandedId === inquiry.id && (
                <div className="mt-6 pt-6 border-t border-border animate-accordion">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-display mb-3 text-primary">KONTAKTINFO</h4>
                      <div className="space-y-2">
                        <a
                          href={`mailto:${inquiry.email}`}
                          className="flex items-center gap-2 text-primary hover:underline transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {inquiry.email}
                        </a>
                        {inquiry.phone && (
                          <a
                            href={`tel:${inquiry.phone}`}
                            className="flex items-center gap-2 text-primary hover:underline transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            {inquiry.phone}
                          </a>
                        )}
                        {inquiry.car_model && (
                          <p className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-muted-foreground" />
                            {inquiry.car_model}
                          </p>
                        )}
                        {inquiry.car_year && (
                          <p className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            {inquiry.car_year}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-display mb-3 text-primary">ETTERSPURTE DELER</h4>
                      <ul className="space-y-1">
                        {inquiry.inquiry_items.map((item) => (
                          <li
                            key={item.id}
                            className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg"
                          >
                            <Check className="w-4 h-4 text-green-600" />
                            {item.part_title}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {inquiry.message && (
                    <div className="mt-6">
                      <h4 className="font-display mb-3 text-primary">MELDING</h4>
                      <p className="bg-muted/50 p-4 rounded-lg whitespace-pre-wrap">
                        {inquiry.message}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex gap-4">
                    <a
                      href={`mailto:${inquiry.email}?subject=Re: Din forespørsel hos Simca Norge`}
                      className="btn-enamel-blue"
                    >
                      <Mail className="w-5 h-5 mr-2" />
                      Svar på e-post
                    </a>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminForesporsler;
