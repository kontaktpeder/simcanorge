import { ReactNode, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  LayoutDashboard,
  Car,
  Wrench,
  FolderTree,
  Inbox,
  LogOut,
  Loader2,
  Home,
} from "lucide-react";
import simcaLogo from "@/assets/simca-logo.png";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/biler", label: "Biler", icon: Car },
  { href: "/admin/deler", label: "Deler", icon: Wrench },
  { href: "/admin/kategorier", label: "Kategorier", icon: FolderTree },
  { href: "/admin/foresporsler", label: "Forespørsler", icon: Inbox },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      navigate("/admin/login");
    }
  }, [user, isAdmin, isLoading, navigate]);

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
    <div className="min-h-screen bg-muted flex">
      {/* Sidebar */}
      <aside className="w-64 bg-primary text-primary-foreground flex flex-col">
        <div className="p-6 border-b border-primary-foreground/20">
          <Link to="/" className="flex items-center gap-3">
            <img src={simcaLogo} alt="Simca Norge" className="h-10 w-auto" />
            <div>
              <span className="font-display text-lg">SIMCA</span>
              <span className="font-display text-lg ml-1 text-accent">ADMIN</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded transition-colors ${
                      isActive
                        ? "bg-primary-foreground text-primary"
                        : "hover:bg-primary-foreground/10"
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

        <div className="p-4 border-t border-primary-foreground/20">
          <Link
            to="/"
            className="flex items-center gap-3 px-4 py-3 hover:bg-primary-foreground/10 rounded transition-colors mb-2"
          >
            <Home className="w-5 h-5" />
            <span className="font-display">Til forsiden</span>
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-primary-foreground/10 rounded transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-display">Logg ut</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-card border-b-4 border-foreground p-6">
          <h1 className="headline-md">{title}</h1>
        </header>
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
