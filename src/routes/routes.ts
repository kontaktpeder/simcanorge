import { lazy, ComponentType } from "react";
import { Home, Star, Car, Wrench, Send, BookOpen, Users, Mail, ShoppingBag, User, LayoutDashboard, CalendarDays, Plus, HelpCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FEATURES } from "@/config/features";

const ComingSoon = lazy(() => import("@/pages/ComingSoon"));

// In simpleLaunchMode, route locked paths to ComingSoon teaser.
const LOCKED_PATHS = new Set<string>([
  "/arrangement",
  "/klubber",
  "/aktoerer",
  "/dashboard/events",
  "/dashboard/events/ny",
  "/dashboard/events/:eventId",
  "/dashboard/sider",
  "/dashboard/sider/ny",
  "/dashboard/sider/:pageId",
  "/dashboard/innboks",
  "/markedsplass",
  "/markedsplass/:branch",
  "/dashboard/mine-annonser",
  "/dashboard/opprett-annonse",
  "/dashboard/annonse/:itemId/rediger",
  "/dashboard/annonse/:itemId/forhandsvis",
]);

const lockRoute = <T extends { path: string; element: ComponentType }>(route: T): T => {
  if (FEATURES.simpleLaunchMode && LOCKED_PATHS.has(route.path)) {
    return { ...route, element: ComingSoon, requiresAuth: false, requiresAdmin: false, isPublic: true } as T;
  }
  return route;
};

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
const LeggTilBil = lazy(() => import("@/pages/LeggTilBil"));
const Kontakt = lazy(() => import("@/pages/Kontakt"));
const Personvern = lazy(() => import("@/pages/Personvern"));
const Brukervilkar = lazy(() => import("@/pages/Brukervilkar"));
const AcceptInvitation = lazy(() => import("@/pages/AcceptInvitation"));
const Login = lazy(() => import("@/pages/Login"));
const GlemtPassord = lazy(() => import("@/pages/GlemtPassord"));
const NyttPassord = lazy(() => import("@/pages/NyttPassord"));
const SokOmTilgang = lazy(() => import("@/pages/SokOmTilgang"));
const RegistrerBruker = lazy(() => import("@/pages/RegistrerBruker"));
const StartAnnonse = lazy(() => import("@/pages/StartAnnonse"));
const RegistrerBil = lazy(() => import("@/pages/RegistrerBil"));
const Hjem = lazy(() => import("@/pages/Hjem"));
const AppEntry = lazy(() => import("@/pages/AppEntry"));
const Konto = lazy(() => import("@/pages/Konto"));
const Foresporsel = lazy(() => import("@/pages/Foresporsel"));
const RelasjonSendt = lazy(() => import("@/pages/RelasjonSendt"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const AktivTur = lazy(() => import("@/pages/AktivTur"));
const MineTurer = lazy(() => import("@/pages/MineTurer"));
const TurDetalj = lazy(() => import("@/pages/TurDetalj"));
const MinGarasje = lazy(() => import("@/pages/MinGarasje"));
const UkjenteBiler = lazy(() => import("@/pages/UkjenteBiler"));
const NyttSporsmal = lazy(() => import("@/pages/NyttSporsmal"));
const SporsmalDetalj = lazy(() => import("@/pages/SporsmalDetalj"));

// Dashboard pages
const Garasje = lazy(() => import("@/pages/Garasje"));
const DashboardMineBiler = lazy(() => import("@/pages/DashboardMineBiler"));
const DashboardOpprettBil = lazy(() => import("@/pages/DashboardOpprettBil"));
const DashboardBilDetalj = lazy(() => import("@/pages/DashboardBilDetalj"));
const DashboardMineAnnonser = lazy(() => import("@/pages/DashboardMineAnnonser"));
const DashboardMineForesporsler = lazy(() => import("@/pages/DashboardMineForesporsler"));
const DashboardInnboks = lazy(() => import("@/pages/DashboardInnboks"));
const OpprettAnnonse = lazy(() => import("@/pages/OpprettAnnonse"));
const RedigerAnnonse = lazy(() => import("@/pages/RedigerAnnonse"));
const ForhandsvisAnnonse = lazy(() => import("@/pages/ForhandsvisAnnonse"));

// Person profile & pages
const CompleteProfilePage = lazy(() => import("@/pages/CompleteProfilePage"));
const DashboardMinProfilPage = lazy(() => import("@/pages/dashboard/DashboardMinProfilPage"));
const DashboardPagesPage = lazy(() => import("@/pages/dashboard/DashboardPagesPage"));
const CreatePagePage = lazy(() => import("@/pages/dashboard/CreatePagePage"));
const EditPagePage = lazy(() => import("@/pages/dashboard/EditPagePage"));
const PublicPagePage = lazy(() => import("@/pages/PublicPagePage"));
const AktoererPage = lazy(() => import("@/pages/AktoererPage"));
const KlubberPage = lazy(() => import("@/pages/KlubberPage"));
const MerkeHub = lazy(() => import("@/pages/MerkeHub"));

// Events
const DashboardEventsPage = lazy(() => import("@/pages/dashboard/DashboardEventsPage"));
const CreateEventPage = lazy(() => import("@/pages/dashboard/CreateEventPage"));
const EditEventPage = lazy(() => import("@/pages/dashboard/EditEventPage"));
const PublicEventPage = lazy(() => import("@/pages/PublicEventPage"));
const EventsPage = lazy(() => import("@/pages/EventsPage"));

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
const AdminPersonProfiles = lazy(() => import("@/pages/admin/AdminPersonProfiles"));
const AdminCarRelationshipRequests = lazy(() => import("@/pages/admin/AdminCarRelationshipRequests"));
const AdminMerkehubber = lazy(() => import("@/pages/admin/AdminMerkehubber"));
const AdminMerkehubEditor = lazy(() => import("@/pages/admin/AdminMerkehubEditor"));

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

const rawRoutes: RouteConfig[] = [
  // Public routes with navigation
  { path: "/", element: Hjem, label: "Hjem", description: "Min garasje", icon: Home, isPublic: true, showInNav: false },
  { path: "/app", element: AppEntry, isPublic: true, showInNav: false },
  { path: "/legg-inn-bil", element: RegistrerBil, label: "Legg inn bil", description: "Legg inn bilen din", icon: Home, isPublic: true, showInNav: true },
  { path: "/hjem", element: Index, label: "Utforsk", description: "Forsiden med biler og historier", icon: Home, isPublic: true, showInNav: false },
  { path: "/manedens-bil", element: ManedensBil, label: "Månedens bil", description: "Se denne månedens utvalgte bil", icon: Star, glow: true, isPublic: true, showInNav: true },
  { path: "/biler", element: Biler, label: "Biler", description: "Utforsk biler og historier fra hele Norge", icon: Car, isPublic: true, showInNav: true },
  { path: "/ukjente-biler", element: UkjenteBiler, label: "Ukjente biler", description: "Hjelp å identifisere spottede biler", icon: HelpCircle, isPublic: true, showInNav: false },
  { path: "/markedsplass/:branch", element: Markedsplass, isPublic: true },
  { path: "/markedsplass", element: Markedsplass, label: "Markedsplass", description: "Deler, tilbehør og annonser", icon: ShoppingBag, isPublic: true, showInNav: true },
  { path: "/arrangement", element: EventsPage, label: "Arrangement", description: "Kommende biltreff og events", icon: CalendarDays, isPublic: true, showInNav: true },
  { path: "/send-inn", element: SendInnBil, isPublic: true, showInNav: false },
  { path: "/legg-til-bil", element: LeggTilBil, isPublic: true, showInNav: false },
  { path: "/historie", element: Historie, label: "Historie", description: "Lær om bilhistorien vår", icon: BookOpen, isPublic: true, showInNav: true },
  { path: "/om-oss", element: OmOss, label: "Om oss", description: "Hvem står bak Bilgarasje.no", icon: Users, isPublic: true, showInNav: true },
  { path: "/kontakt", element: Kontakt, label: "Kontakt", description: "Ta kontakt med oss", icon: Mail, isPublic: true, showInNav: true },

  // Public routes without navigation
  { path: "/biler/:slug", element: BilDetalj, isPublic: true },
  { path: "/annonse/:slug", element: AnnonseDetalj, isPublic: true },
  { path: "/profil/:slug", element: EierProfil, isPublic: true },
  { path: "/eier/:slug", element: EierProfil, isPublic: true },
  { path: "/foresporsel", element: Foresporsel, isPublic: true },
  { path: "/personvern", element: Personvern, isPublic: true },
  { path: "/vilkar", element: Brukervilkar, isPublic: true },
  { path: "/accept-invitation", element: AcceptInvitation, isPublic: true },
  { path: "/i/:token", element: AcceptInvitation, isPublic: true },
  { path: "/login", element: Login, isPublic: true },
  { path: "/glemt-passord", element: GlemtPassord, isPublic: true },
  { path: "/nytt-passord", element: NyttPassord, isPublic: true },
  { path: "/sok-om-tilgang", element: SokOmTilgang, isPublic: true },
  { path: "/registrer", element: RegistrerBruker, isPublic: true },
  { path: "/start-annonse", element: StartAnnonse, isPublic: true },
  { path: "/registrer-bil", element: lazy(() => import("@/pages/RegistrerBilRedirect")), isPublic: true },
  { path: "/s/:slug", element: PublicPagePage, isPublic: true },
  { path: "/e/:slug", element: PublicEventPage, isPublic: true },
  { path: "/aktoerer", element: AktoererPage, label: "Aktører", description: "Verksteder, forhandlere og andre aktører", isPublic: true, showInNav: false },
  { path: "/klubber", element: KlubberPage, label: "Klubber", description: "Bilklubber og foreninger", isPublic: true, showInNav: false },
  { path: "/klubber/:slug", element: PublicPagePage, isPublic: true },
  { path: "/merker/:brand", element: MerkeHub, isPublic: true },

  // Auth required
  { path: "/garasje", element: Garasje, requiresAuth: true },
  { path: "/aktiv", element: AktivTur, requiresAuth: true },
  { path: "/turer", element: MineTurer, requiresAuth: true },
  { path: "/tur/:id", element: TurDetalj, requiresAuth: true },
  { path: "/min-garasje", element: MinGarasje, requiresAuth: true },
  { path: "/konto", element: Konto, requiresAuth: true },
  { path: "/kom-i-gang", element: CompleteProfilePage, requiresAuth: true },
  { path: "/dashboard", element: lazy(() => import("@/pages/Garasje")), requiresAuth: true },
  { path: "/dashboard/mine-biler", element: DashboardMineBiler, requiresAuth: true },
  { path: "/dashboard/opprett-bil", element: DashboardOpprettBil, requiresAuth: true },
  { path: "/dashboard/bil/:carId", element: DashboardBilDetalj, requiresAuth: true },
  { path: "/dashboard/mine-annonser", element: DashboardMineAnnonser, requiresAuth: true },
  { path: "/dashboard/mine-foresporsler", element: DashboardMineForesporsler, requiresAuth: true },
  { path: "/dashboard/innboks", element: DashboardInnboks, requiresAuth: true },
  { path: "/dashboard/opprett-annonse", element: OpprettAnnonse, requiresAuth: true },
  { path: "/dashboard/annonse/:itemId/rediger", element: RedigerAnnonse, requiresAuth: true },
  { path: "/dashboard/annonse/:itemId/forhandsvis", element: ForhandsvisAnnonse, requiresAuth: true },
  { path: "/dashboard/min-profil", element: DashboardMinProfilPage, requiresAuth: true },
  { path: "/dashboard/sider", element: DashboardPagesPage, requiresAuth: true },
  { path: "/dashboard/sider/ny", element: CreatePagePage, requiresAuth: true },
  { path: "/dashboard/sider/:pageId", element: EditPagePage, requiresAuth: true },
  { path: "/dashboard/events", element: DashboardEventsPage, requiresAuth: true },
  { path: "/dashboard/events/ny", element: CreateEventPage, requiresAuth: true },
  { path: "/dashboard/events/:eventId", element: EditEventPage, requiresAuth: true },
  { path: "/relasjon-sendt/:requestId", element: RelasjonSendt, requiresAuth: true },
  { path: "/sporsmal/ny", element: NyttSporsmal, requiresAuth: true },
  { path: "/sporsmal/:slug", element: SporsmalDetalj, isPublic: true },

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
  { path: "/admin/brukerprofiler", element: AdminPersonProfiles, requiresAdmin: true },
  { path: "/admin/relasjoner", element: AdminCarRelationshipRequests, requiresAdmin: true },
  { path: "/admin/merkehubber", element: AdminMerkehubber, requiresAdmin: true },
  { path: "/admin/merkehubber/ny", element: AdminMerkehubEditor, requiresAdmin: true },
  { path: "/admin/merkehubber/:id", element: AdminMerkehubEditor, requiresAdmin: true },

  // 404
  { path: "*", element: NotFound, isPublic: true },
];

export const routes: RouteConfig[] = rawRoutes.map(lockRoute);

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
