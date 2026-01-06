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
  Send,
} from "lucide-react";
import simcaBadgeLogo from "@/assets/simca-badge-logo.png";
import simcaChromeSwallow from "@/assets/simca-chrome-swallow.png";

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
  { href: "/admin/innsendinger", label: "Bil-innsendinger", icon: Send },
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
      <aside className="w-64 bg-metal-blue text-white flex flex-col relative overflow-hidden">
        {/* Chrome swallow watermark */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `url(${simcaChromeSwallow})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center 75%',
            backgroundSize: '200px',
            opacity: 0.08,
            transform: 'rotate(-15deg)',
          }}
        />
        
        <div className="p-6 border-b border-white/20 relative z-10">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={simcaBadgeLogo} alt="Simca Norge" className="h-14 w-auto transition-transform group-hover:scale-105 drop-shadow-lg" />
            <div>
              <span className="font-display text-xl text-metal drop-shadow">ADMIN</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 relative z-10">
          <ul className="space-y-2 stagger-children">
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
      <main className="flex-1 overflow-auto bg-background">
        <header className="header-chrome p-6">
          <h1 className="headline-md text-foreground animate-fade-in">{title}</h1>
        </header>
        <div className="p-6 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
