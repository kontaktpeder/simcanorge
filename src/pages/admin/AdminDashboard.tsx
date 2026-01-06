import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Car, Wrench, Inbox, FolderTree, FileText, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import simcaSwallow from "@/assets/simca-chrome-swallow.png";

interface Stats {
  cars: number;
  submissions: number;
  unreadSubmissions: number;
  parts: number;
  categories: number;
  inquiries: number;
  unreadInquiries: number;
  messages: number;
  unreadMessages: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    cars: 0,
    submissions: 0,
    unreadSubmissions: 0,
    parts: 0,
    categories: 0,
    inquiries: 0,
    unreadInquiries: 0,
    messages: 0,
    unreadMessages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          carsRes,
          submissionsRes,
          unreadSubmissionsRes,
          partsRes,
          categoriesRes,
          inquiriesRes,
          unreadInquiriesRes,
          messagesRes,
          unreadMessagesRes,
        ] = await Promise.all([
          supabase.from("cars").select("id", { count: "exact", head: true }),
          supabase.from("car_submissions").select("id", { count: "exact", head: true }),
          supabase.from("car_submissions").select("id", { count: "exact", head: true }).eq("read", false),
          supabase.from("parts").select("id", { count: "exact", head: true }),
          supabase.from("categories").select("id", { count: "exact", head: true }),
          supabase.from("inquiries").select("id", { count: "exact", head: true }),
          supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("read", false),
          supabase.from("messages").select("id", { count: "exact", head: true }),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("read", false),
        ]);

        setStats({
          cars: carsRes.count || 0,
          submissions: submissionsRes.count || 0,
          unreadSubmissions: unreadSubmissionsRes.count || 0,
          parts: partsRes.count || 0,
          categories: categoriesRes.count || 0,
          inquiries: inquiriesRes.count || 0,
          unreadInquiries: unreadInquiriesRes.count || 0,
          messages: messagesRes.count || 0,
          unreadMessages: unreadMessagesRes.count || 0,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const menuItems = [
    {
      label: "Biler",
      description: "Administrer bilhistorier",
      value: stats.cars,
      icon: Car,
      href: "/admin/biler",
      color: "bg-primary",
    },
    {
      label: "Innsendinger",
      description: "Nye biler fra brukere",
      value: stats.submissions,
      badge: stats.unreadSubmissions,
      icon: FileText,
      href: "/admin/innsendinger",
      color: "bg-amber-600",
    },
    {
      label: "Deler",
      description: "Deler-katalogen",
      value: stats.parts,
      icon: Wrench,
      href: "/admin/deler",
      color: "bg-accent",
    },
    {
      label: "Kategorier",
      description: "Organiser deler",
      value: stats.categories,
      icon: FolderTree,
      href: "/admin/kategorier",
      color: "bg-simca-gray",
    },
    {
      label: "Forespørsler",
      description: "Henvendelser om deler",
      value: stats.inquiries,
      badge: stats.unreadInquiries,
      icon: Inbox,
      href: "/admin/foresporsler",
      color: "bg-green-600",
    },
    {
      label: "Meldinger",
      description: "Kontaktskjema",
      value: stats.messages,
      badge: stats.unreadMessages,
      icon: Mail,
      href: "/admin/meldinger",
      color: "bg-blue-600",
    },
  ];

  const totalUnread = stats.unreadSubmissions + stats.unreadInquiries + stats.unreadMessages;

  return (
    <AdminLayout title="KONTROLLPANEL">
      {/* Welcome header with swallow */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6 flex items-center gap-6">
        <img 
          src={simcaSwallow} 
          alt="Simca svale" 
          className="w-16 h-16 object-contain opacity-80"
        />
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Velkommen til Simca Norge</h1>
          {totalUnread > 0 ? (
            <p className="text-muted-foreground">
              Du har <span className="text-accent font-semibold">{totalUnread} uleste</span> henvendelser
            </p>
          ) : (
            <p className="text-muted-foreground">Alt er i orden – ingen nye henvendelser</p>
          )}
        </div>
      </div>

      {/* Simple menu grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.href}
            className="bg-card border border-border rounded-xl p-4 md:p-5 hover:border-primary/50 hover:shadow-lg transition-all relative group"
          >
            {/* Badge */}
            {item.badge && item.badge > 0 && (
              <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full">
                {item.badge}
              </span>
            )}
            
            {/* Icon */}
            <div className={`w-10 h-10 ${item.color} text-white rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
              <item.icon className="w-5 h-5" />
            </div>
            
            {/* Label & count */}
            <p className="font-display text-base md:text-lg">{item.label}</p>
            <p className="text-muted-foreground text-xs hidden md:block">{item.description}</p>
            <p className="text-2xl font-display text-primary mt-1">
              {isLoading ? "–" : item.value}
            </p>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
