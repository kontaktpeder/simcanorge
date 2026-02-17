import { ReactNode, useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { EmailGeneratorProvider } from "@/contexts/EmailGeneratorContext";
import {
  LayoutDashboard,
  Car,
  Wrench,
  FolderTree,
  Inbox,
  LogOut,
  Loader2,
  Home,
  Menu,
  X,
  User,
  Bug,
  Mail,
  ShoppingBag,
} from "lucide-react";
import simcaBadgeLogo from "@/assets/simca-badge-logo.png";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/meldinger", label: "Meldinger", icon: Inbox },
  { href: "/admin/support", label: "Support", icon: Bug },
  { href: "/admin/invite-email", label: "E-post", icon: Mail },
  { href: "/admin/biler", label: "Biler", icon: Car },
  { href: "/admin/markedsplass", label: "Markedsplass", icon: ShoppingBag },
  { href: "/admin/eierprofiler", label: "Eiere", icon: User },
  { href: "/admin/deler", label: "Deler", icon: Wrench },
  { href: "/admin/kategorier", label: "Kategorier", icon: FolderTree },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, isLoading, navigate]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <EmailGeneratorProvider>
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden bg-metal-blue text-white px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2">
          <img src={simcaBadgeLogo} alt="Simca Norge" className="h-8 w-auto" />
          <span className="font-display text-sm">ADMIN</span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -m-2"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-metal-blue text-white animate-fade-in">
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        isActive
                          ? "bg-white text-primary"
                          : "hover:bg-white/15"
                      }`}
                    >
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="border-t border-white/20 mt-4 pt-4 space-y-1">
              <Link
                to="/dashboard"
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/15 rounded-lg transition-all"
              >
                <Car className="w-5 h-5" />
                <span>Min garasje</span>
              </Link>
              <Link
                to="/"
                className="flex items-center gap-3 px-4 py-3 hover:bg-white/15 rounded-lg transition-all"
              >
                <Home className="w-5 h-5" />
                <span>Til forsiden</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-white/15 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span>Logg ut</span>
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-metal-blue text-white flex-col relative overflow-hidden">
        <div className="p-6 border-b border-white/20 relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={simcaBadgeLogo} alt="Simca Norge" className="h-12 w-auto transition-transform group-hover:scale-105 drop-shadow-lg" />
            <span className="font-display text-lg text-metal drop-shadow">ADMIN</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 relative z-10">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-white text-primary shadow-lg"
                        : "hover:bg-white/15"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-display">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/20 relative z-10">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/15 rounded-xl transition-all mb-2"
          >
            <Car className="w-5 h-5" />
            <span className="font-display">Min garasje</span>
          </Link>
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 hover:bg-white/15 rounded-xl transition-all mb-2"
          >
            <Home className="w-5 h-5" />
            <span className="font-display">Til forsiden</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-white/15 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-display">Logg ut</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-card pb-20 md:pb-0">
        <header className="bg-muted/50 border-b border-border px-4 py-4 md:px-6 md:py-6">
          <h1 className="font-display text-xl md:text-3xl text-foreground">{title}</h1>
        </header>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - improved touch targets */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-bottom">
        <div className="grid grid-cols-5 h-16">
          {navItems.slice(0, 5).map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors active:bg-muted ${
                  isActive ? "text-primary bg-primary/5" : "text-muted-foreground"
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                <span className="text-[10px] font-medium truncate max-w-[56px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </EmailGeneratorProvider>
  );
}
