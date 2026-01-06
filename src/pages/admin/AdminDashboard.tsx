import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Car, Wrench, Inbox, FolderTree, FileText, Mail, Plus, Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface Stats {
  cars: number;
  parts: number;
  categories: number;
  inquiries: number;
  unreadInquiries: number;
  submissions: number;
  unreadSubmissions: number;
  messages: number;
  unreadMessages: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    cars: 0,
    parts: 0,
    categories: 0,
    inquiries: 0,
    unreadInquiries: 0,
    submissions: 0,
    unreadSubmissions: 0,
    messages: 0,
    unreadMessages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          carsRes,
          partsRes,
          categoriesRes,
          inquiriesRes,
          unreadInquiriesRes,
          submissionsRes,
          unreadSubmissionsRes,
          messagesRes,
          unreadMessagesRes,
        ] = await Promise.all([
          supabase.from("cars").select("id", { count: "exact", head: true }),
          supabase.from("parts").select("id", { count: "exact", head: true }),
          supabase.from("categories").select("id", { count: "exact", head: true }),
          supabase.from("inquiries").select("id", { count: "exact", head: true }),
          supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("read", false),
          supabase.from("car_submissions").select("id", { count: "exact", head: true }),
          supabase.from("car_submissions").select("id", { count: "exact", head: true }).eq("read", false),
          supabase.from("messages").select("id", { count: "exact", head: true }),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("read", false),
        ]);

        setStats({
          cars: carsRes.count || 0,
          parts: partsRes.count || 0,
          categories: categoriesRes.count || 0,
          inquiries: inquiriesRes.count || 0,
          unreadInquiries: unreadInquiriesRes.count || 0,
          submissions: submissionsRes.count || 0,
          unreadSubmissions: unreadSubmissionsRes.count || 0,
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

  const statCards = [
    {
      label: "Biler",
      value: stats.cars,
      icon: Car,
      href: "/admin/biler",
      color: "bg-primary",
    },
    {
      label: "Bil-innsendinger",
      value: stats.submissions,
      badge: stats.unreadSubmissions > 0 ? stats.unreadSubmissions : undefined,
      icon: FileText,
      href: "/admin/innsendinger",
      color: "bg-amber-600",
    },
    {
      label: "Deler",
      value: stats.parts,
      icon: Wrench,
      href: "/admin/deler",
      color: "bg-accent",
    },
    {
      label: "Kategorier",
      value: stats.categories,
      icon: FolderTree,
      href: "/admin/kategorier",
      color: "bg-simca-gray",
    },
    {
      label: "Forespørsler",
      value: stats.inquiries,
      badge: stats.unreadInquiries > 0 ? stats.unreadInquiries : undefined,
      icon: Inbox,
      href: "/admin/foresporsler",
      color: "bg-green-600",
    },
    {
      label: "Meldinger",
      value: stats.messages,
      badge: stats.unreadMessages > 0 ? stats.unreadMessages : undefined,
      icon: Mail,
      href: "/admin/meldinger",
      color: "bg-blue-600",
    },
  ];

  const quickLinks = [
    {
      label: "Legg til ny bil",
      href: "/admin/biler",
      icon: Car,
      iconColor: "text-primary",
    },
    {
      label: "Se bil-innsendinger",
      href: "/admin/innsendinger",
      icon: FileText,
      iconColor: "text-amber-600",
      badge: stats.unreadSubmissions,
    },
    {
      label: "Legg til ny del",
      href: "/admin/deler",
      icon: Wrench,
      iconColor: "text-accent",
    },
    {
      label: "Se forespørsler",
      href: "/admin/foresporsler",
      icon: Inbox,
      iconColor: "text-green-600",
      badge: stats.unreadInquiries,
    },
    {
      label: "Se meldinger",
      href: "/admin/meldinger",
      icon: Mail,
      iconColor: "text-blue-600",
      badge: stats.unreadMessages,
    },
  ];

  return (
    <AdminLayout title="DASHBOARD">
      {/* Stats Grid - responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.href}
            className="bg-card border border-border rounded-xl p-4 md:p-5 hover:shadow-lg transition-shadow relative"
          >
            <div className={`w-10 h-10 ${card.color} text-white rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-muted-foreground text-xs md:text-sm font-medium">{card.label}</p>
            <p className="text-2xl md:text-3xl font-display">
              {isLoading ? "..." : card.value}
            </p>
            {card.badge && (
              <span className="absolute top-2 right-2 bg-accent text-accent-foreground px-1.5 py-0.5 text-xs font-medium rounded">
                {card.badge} nye
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Quick Links - stack on mobile */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <h2 className="font-display text-lg md:text-xl mb-3 md:mb-4">HURTIGLENKER</h2>
          <div className="space-y-2">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <link.icon className={`w-5 h-5 ${link.iconColor}`} />
                  <span className="text-sm md:text-base">{link.label}</span>
                </div>
                {link.badge && link.badge > 0 && (
                  <span className="bg-accent text-accent-foreground px-2 py-0.5 text-xs font-medium rounded">
                    {link.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <h2 className="font-display text-lg md:text-xl mb-3 md:mb-4">VELKOMMEN!</h2>
          <p className="text-muted-foreground text-sm md:text-base mb-3">
            Her kan du administrere alt innhold på Simca Norge.
          </p>
          <ul className="space-y-1.5 text-xs md:text-sm">
            <li>🚗 <strong>Biler:</strong> Legg til og rediger bilhistorier</li>
            <li>📝 <strong>Innsendinger:</strong> Godkjenn brukerinnsendte biler</li>
            <li>🔧 <strong>Deler:</strong> Administrer deler-katalogen</li>
            <li>📁 <strong>Kategorier:</strong> Organiser deler</li>
            <li>📬 <strong>Forespørsler:</strong> Henvendelser om deler</li>
            <li>✉️ <strong>Meldinger:</strong> Kontakt-skjema henvendelser</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
