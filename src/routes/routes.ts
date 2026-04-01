import { lazy, ComponentType } from "react";
import { Home, Star, Car, Wrench, Send, BookOpen, Users, Mail, ShoppingBag, User, LayoutDashboard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Lazy load all pages
const Index = lazy(() => import("@/pages/Index"));
const ManedensBil = lazy(() => import("@/pages/ManedensBil"));
const Biler = lazy(() => import("@/pages/Biler"));
const BilDetalj = lazy(() => import("@/pages/BilDetalj"));
const EierProfil = lazy(() => import("@/pages/EierProfil"));
const Markedsplass = lazy(() => import("@/pages/Markedsplass"));
const AnnonseDetalj = lazy(() => import("@/pages/AnnonseDetalj"));
const OmOss = lazy(() => import("@/pages/OmOss"));
const Historie = lazy(() => import("@/pages/Historie"));
const SendInnBil = lazy(() => import("@/pages/SendInnBil"));
const Kontakt = lazy(() => import("@/pages/Kontakt"));
const Personvern = lazy(() => import("@/pages/Personvern"));
const AcceptInvitation = lazy(() => import("@/pages/AcceptInvitation"));
const Login = lazy(() => import("@/pages/Login"));
const StartAnnonse = lazy(() => import("@/pages/StartAnnonse"));
const Konto = lazy(() => import("@/pages/Konto"));
const Foresporsel = lazy(() => import("@/pages/Foresporsel"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Dashboard pages
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const DashboardMineBiler = lazy(() => import("@/pages/DashboardMineBiler"));
const DashboardBilDetalj = lazy(() => import("@/pages/DashboardBilDetalj"));
const DashboardMineAnnonser = lazy(() => import("@/pages/DashboardMineAnnonser"));
const DashboardMineForesporsler = lazy(() => import("@/pages/DashboardMineForesporsler"));
const OpprettAnnonse = lazy(() => import("@/pages/OpprettAnnonse"));
const RedigerAnnonse = lazy(() => import("@/pages/RedigerAnnonse"));
const ForhandsvisAnnonse = lazy(() => import("@/pages/ForhandsvisAnnonse"));

// Admin pages
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminBiler = lazy(() => import("@/pages/admin/AdminBiler"));
const AdminBilProfil = lazy(() => import("@/pages/admin/AdminBilProfil"));
const AdminDeler = lazy(() => import("@/pages/admin/AdminDeler"));
const AdminKategorier = lazy(() => import("@/pages/admin/AdminKategorier"));
const AdminEierprofiler = lazy(() => import("@/pages/admin/AdminEierprofiler"));
const AdminForesporsler = lazy(() => import("@/pages/admin/AdminForesporsler"));
const AdminMeldinger = lazy(() => import("@/pages/admin/AdminMeldinger"));
const AdminSupport = lazy(() => import("@/pages/admin/AdminSupport"));
const AdminInviteEmail = lazy(() => import("@/pages/admin/AdminInviteEmail"));
const AdminInnsendinger = lazy(() => import("@/pages/admin/AdminInnsendinger"));
const AdminMarkedsplass = lazy(() => import("@/pages/admin/AdminMarkedsplass"));
const AdminAnnonseProfil = lazy(() => import("@/pages/admin/AdminAnnonseProfil"));

export interface RouteConfig {
  path: string;
  element: ComponentType;
  label?: string;
  description?: string;
  icon?: LucideIcon;
  glow?: boolean;
  isPublic?: boolean;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  showInNav?: boolean;
}

export const routes: RouteConfig[] = [
  // Public routes with navigation
  { path: "/", element: Index, label: "Hjem", description: "Tilbake til forsiden", icon: Home, isPublic: true, showInNav: true },
  { path: "/manedens-bil", element: ManedensBil, label: "Månedens bil", description: "Se denne månedens utvalgte Simca", icon: Star, glow: true, isPublic: true, showInNav: true },
  { path: "/biler", element: Biler, label: "Biler", description: "Utforsk Simca-biler og historier", icon: Car, isPublic: true, showInNav: true },
  { path: "/markedsplass/:branch", element: Markedsplass, isPublic: true },
  { path: "/markedsplass", element: Markedsplass, label: "Markedsplass", description: "Deler, tilbehør og annonser", icon: ShoppingBag, isPublic: true, showInNav: true },
  { path: "/send-inn", element: SendInnBil, label: "Del din bil", description: "Del din bil med oss", icon: Send, isPublic: true, showInNav: true },
  { path: "/historie", element: Historie, label: "Historie", description: "Lær om Simcas rike historie", icon: BookOpen, isPublic: true, showInNav: true },
  { path: "/om-oss", element: OmOss, label: "Om oss", description: "Hvem står bak Simca Norge", icon: Users, isPublic: true, showInNav: true },
  { path: "/kontakt", element: Kontakt, label: "Kontakt", description: "Ta kontakt med oss", icon: Mail, isPublic: true, showInNav: true },

  // Public routes without navigation
  { path: "/biler/:slug", element: BilDetalj, isPublic: true },
  { path: "/annonse/:slug", element: AnnonseDetalj, isPublic: true },
  { path: "/profil/:slug", element: EierProfil, isPublic: true },
  { path: "/eier/:slug", element: EierProfil, isPublic: true },
  { path: "/foresporsel", element: Foresporsel, isPublic: true },
  { path: "/personvern", element: Personvern, isPublic: true },
  { path: "/accept-invitation", element: AcceptInvitation, isPublic: true },
  { path: "/i/:token", element: AcceptInvitation, isPublic: true },
  { path: "/login", element: Login, isPublic: true },
  { path: "/start-annonse", element: StartAnnonse, isPublic: true },

  // Auth required
  { path: "/konto", element: Konto, requiresAuth: true },
  { path: "/dashboard", element: Dashboard, requiresAuth: true },
  { path: "/dashboard/mine-biler", element: DashboardMineBiler, requiresAuth: true },
  { path: "/dashboard/bil/:carId", element: DashboardBilDetalj, requiresAuth: true },
  { path: "/dashboard/mine-annonser", element: DashboardMineAnnonser, requiresAuth: true },
  { path: "/dashboard/mine-foresporsler", element: DashboardMineForesporsler, requiresAuth: true },
  { path: "/dashboard/opprett-annonse", element: OpprettAnnonse, requiresAuth: true },
  { path: "/dashboard/annonse/:itemId/rediger", element: RedigerAnnonse, requiresAuth: true },
  { path: "/dashboard/annonse/:itemId/forhandsvis", element: ForhandsvisAnnonse, requiresAuth: true },

  // Admin
  { path: "/admin/login", element: AdminLogin, isPublic: true },
  { path: "/admin/dashboard", element: AdminDashboard, requiresAdmin: true },
  { path: "/admin/biler", element: AdminBiler, requiresAdmin: true },
  { path: "/admin/biler/:carId", element: AdminBilProfil, requiresAdmin: true },
  { path: "/admin/deler", element: AdminDeler, requiresAdmin: true },
  { path: "/admin/kategorier", element: AdminKategorier, requiresAdmin: true },
  { path: "/admin/eierprofiler", element: AdminEierprofiler, requiresAdmin: true },
  { path: "/admin/foresporsler", element: AdminForesporsler, requiresAdmin: true },
  { path: "/admin/meldinger", element: AdminMeldinger, requiresAdmin: true },
  { path: "/admin/support", element: AdminSupport, requiresAdmin: true },
  { path: "/admin/invite-email", element: AdminInviteEmail, requiresAdmin: true },
  { path: "/admin/innsendinger", element: AdminInnsendinger, requiresAdmin: true },
  { path: "/admin/markedsplass", element: AdminMarkedsplass, requiresAdmin: true },
  { path: "/admin/markedsplass/:itemId", element: AdminAnnonseProfil, requiresAdmin: true },

  // 404
  { path: "*", element: NotFound, isPublic: true },
];

export const getNavItems = () => {
  return routes
    .filter(route => route.showInNav && route.label && route.icon)
    .map(route => ({
      href: route.path,
      label: route.label!,
      description: route.description || "",
      icon: route.icon!,
      glow: route.glow || false,
    }));
};

export const getRouteByPath = (path: string) => {
  return routes.find(route => route.path === path);
};
