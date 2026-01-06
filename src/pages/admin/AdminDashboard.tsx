import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Car, Wrench, Inbox, FolderTree } from "lucide-react";
import { Link } from "react-router-dom";

interface Stats {
  cars: number;
  parts: number;
  categories: number;
  inquiries: number;
  unreadInquiries: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    cars: 0,
    parts: 0,
    categories: 0,
    inquiries: 0,
    unreadInquiries: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [carsRes, partsRes, categoriesRes, inquiriesRes, unreadRes] = await Promise.all([
          supabase.from("cars").select("id", { count: "exact", head: true }),
          supabase.from("parts").select("id", { count: "exact", head: true }),
          supabase.from("categories").select("id", { count: "exact", head: true }),
          supabase.from("inquiries").select("id", { count: "exact", head: true }),
          supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("read", false),
        ]);

        setStats({
          cars: carsRes.count || 0,
          parts: partsRes.count || 0,
          categories: categoriesRes.count || 0,
          inquiries: inquiriesRes.count || 0,
          unreadInquiries: unreadRes.count || 0,
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
  ];

  return (
    <AdminLayout title="DASHBOARD">
      {/* Stats Grid - responsive */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        {statCards.map((card) => (
          <Link
            key={card.label}
            to={card.href}
            className="bg-card border border-border rounded-xl p-4 md:p-6 hover:shadow-lg transition-shadow relative"
          >
            <div className={`w-10 h-10 md:w-12 md:h-12 ${card.color} text-white rounded-lg flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <p className="text-muted-foreground text-xs md:text-sm font-medium">{card.label}</p>
            <p className="text-2xl md:text-4xl font-display">
              {isLoading ? "..." : card.value}
            </p>
            {card.badge && (
              <span className="absolute top-2 right-2 md:top-4 md:right-4 bg-accent text-accent-foreground px-1.5 py-0.5 md:px-2 md:py-1 text-xs font-medium rounded">
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
            <Link
              to="/admin/biler"
              className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
            >
              <Car className="w-5 h-5 text-primary" />
              <span className="text-sm md:text-base">Legg til ny bil</span>
            </Link>
            <Link
              to="/admin/deler"
              className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
            >
              <Wrench className="w-5 h-5 text-accent" />
              <span className="text-sm md:text-base">Legg til ny del</span>
            </Link>
            <Link
              to="/admin/foresporsler"
              className="flex items-center gap-3 p-3 bg-muted/50 hover:bg-muted rounded-lg transition-colors"
            >
              <Inbox className="w-5 h-5 text-green-600" />
              <span className="text-sm md:text-base">Se forespørsler</span>
            </Link>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 md:p-6">
          <h2 className="font-display text-lg md:text-xl mb-3 md:mb-4">VELKOMMEN!</h2>
          <p className="text-muted-foreground text-sm md:text-base mb-3">
            Her kan du administrere alt innhold på Simca Norge.
          </p>
          <ul className="space-y-1.5 text-xs md:text-sm">
            <li>📝 <strong>Biler:</strong> Legg til og rediger bilhistorier</li>
            <li>🔧 <strong>Deler:</strong> Administrer deler-katalogen</li>
            <li>📁 <strong>Kategorier:</strong> Organiser deler</li>
            <li>📬 <strong>Meldinger:</strong> Se innkomne henvendelser</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
