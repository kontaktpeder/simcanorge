import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Car, Wrench, Inbox, FolderTree, Mail, LifeBuoy, Bell, ShoppingBag, User } from "lucide-react";
import { Link } from "react-router-dom";
import simcaSwallow from "@/assets/simca-chrome-swallow.png";
import { Badge } from "@/components/ui/badge";

interface Stats {
  cars: number;
  parts: number;
  categories: number;
  inquiries: number;
  unreadInquiries: number;
  messages: number;
  unreadMessages: number;
  support: number;
  unreadSupport: number;
  submittedMarketplace: number;
  pendingOwnerProfiles: number;
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    cars: 0,
    parts: 0,
    categories: 0,
    inquiries: 0,
    unreadInquiries: 0,
    messages: 0,
    unreadMessages: 0,
    support: 0,
    unreadSupport: 0,
    submittedMarketplace: 0,
    pendingOwnerProfiles: 0,
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
          messagesRes,
          unreadMessagesRes,
          supportRes,
          unreadSupportRes,
          submittedMarketplaceRes,
          pendingOwnerProfilesRes,
        ] = await Promise.all([
          supabase.from("cars").select("id", { count: "exact", head: true }),
          supabase.from("parts").select("id", { count: "exact", head: true }),
          supabase.from("categories").select("id", { count: "exact", head: true }),
          supabase.from("inquiries").select("id", { count: "exact", head: true }),
          supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("read", false),
          supabase.from("messages").select("id", { count: "exact", head: true }),
          supabase.from("messages").select("id", { count: "exact", head: true }).eq("read", false),
          supabase.from("support_tickets").select("id", { count: "exact", head: true }),
          supabase.from("support_tickets").select("id", { count: "exact", head: true }).eq("status", "new"),
          supabase.from("marketplace_items").select("id", { count: "exact", head: true }).eq("status", "submitted"),
          supabase.from("owners").select("id", { count: "exact", head: true }).is("approved_at", null),
        ]);

        setStats({
          cars: carsRes.count || 0,
          parts: partsRes.count || 0,
          categories: categoriesRes.count || 0,
          inquiries: inquiriesRes.count || 0,
          unreadInquiries: unreadInquiriesRes.count || 0,
          messages: messagesRes.count || 0,
          unreadMessages: unreadMessagesRes.count || 0,
          support: supportRes.count || 0,
          unreadSupport: unreadSupportRes.count || 0,
          submittedMarketplace: submittedMarketplaceRes.count || 0,
          pendingOwnerProfiles: pendingOwnerProfilesRes.count || 0,
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
      label: "Markedsplass",
      description: "Annonser til godkjenning",
      value: stats.submittedMarketplace,
      badge: stats.submittedMarketplace,
      icon: ShoppingBag,
      href: "/admin/markedsplass",
      color: "bg-orange-600",
    },
    {
      label: "Profiler",
      description: "Entusiastprofiler til godkjenning",
      value: stats.pendingOwnerProfiles,
      badge: stats.pendingOwnerProfiles,
      icon: User,
      href: "/admin/eierprofiler",
      color: "bg-blue-600",
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
    {
      label: "Support",
      description: "Rapporterte problemer",
      value: stats.support,
      badge: stats.unreadSupport,
      icon: LifeBuoy,
      href: "/admin/support",
      color: "bg-orange-600",
    },
  ];

  const totalUnread = stats.unreadInquiries + stats.unreadMessages + stats.unreadSupport;

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
          <h1 className="font-display text-2xl md:text-3xl">Velkommen til Bilgarasje.no</h1>
          {totalUnread > 0 || stats.submittedMarketplace > 0 || stats.pendingOwnerProfiles > 0 ? (
            <p className="text-muted-foreground">
              Du har{' '}
              {totalUnread > 0 && <span className="text-accent font-semibold">{totalUnread} uleste</span>}
              {totalUnread > 0 && ' henvendelser'}
              {totalUnread > 0 && (stats.submittedMarketplace > 0 || stats.pendingOwnerProfiles > 0) && ' og '}
              {stats.submittedMarketplace > 0 && (
                <span className="text-accent font-semibold">{stats.submittedMarketplace} annonse{stats.submittedMarketplace !== 1 ? 'r' : ''}</span>
              )}
              {stats.submittedMarketplace > 0 && stats.pendingOwnerProfiles > 0 && ' og '}
              {stats.pendingOwnerProfiles > 0 && (
                <span className="text-accent font-semibold">{stats.pendingOwnerProfiles} profil{stats.pendingOwnerProfiles !== 1 ? 'er' : ''}</span>
              )}
              {' '}til behandling
            </p>
          ) : (
            <p className="text-muted-foreground">Alt er i orden – ingen nye henvendelser</p>
          )}
        </div>
      </div>

      {/* Alert card for unread items */}
      {(totalUnread > 0 || stats.submittedMarketplace > 0 || stats.pendingOwnerProfiles > 0) && (
        <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">
                Du har saker til behandling
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {stats.unreadInquiries > 0 && (
                  <Link to="/admin/foresporsler">
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent/20">
                      {stats.unreadInquiries} forespørsel{stats.unreadInquiries !== 1 ? 'er' : ''}
                    </Badge>
                  </Link>
                )}
                {stats.unreadMessages > 0 && (
                  <Link to="/admin/meldinger">
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent/20">
                      {stats.unreadMessages} kontaktmelding{stats.unreadMessages !== 1 ? 'er' : ''}
                    </Badge>
                  </Link>
                )}
                {stats.unreadSupport > 0 && (
                  <Link to="/admin/support">
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent/20">
                      {stats.unreadSupport} support ticket{stats.unreadSupport !== 1 ? 's' : ''}
                    </Badge>
                  </Link>
                )}
                {stats.submittedMarketplace > 0 && (
                  <Link to="/admin/markedsplass">
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent/20">
                      {stats.submittedMarketplace} annonse{stats.submittedMarketplace !== 1 ? 'r' : ''} til godkjenning
                    </Badge>
                  </Link>
                )}
                {stats.pendingOwnerProfiles > 0 && (
                  <Link to="/admin/eierprofiler">
                    <Badge variant="outline" className="cursor-pointer hover:bg-accent/20">
                      {stats.pendingOwnerProfiles} profil{stats.pendingOwnerProfiles !== 1 ? 'er' : ''} til godkjenning
                    </Badge>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
