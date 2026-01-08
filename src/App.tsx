import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ScrollToTop } from "@/components/layout/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import ManedensBil from "./pages/ManedensBil";
import Biler from "./pages/Biler";
import BilDetalj from "./pages/BilDetalj";
import Deler from "./pages/Deler";
import Foresporsel from "./pages/Foresporsel";
import OmOss from "./pages/OmOss";
import Historie from "./pages/Historie";
import Kontakt from "./pages/Kontakt";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBiler from "./pages/admin/AdminBiler";
import AdminBilProfil from "./pages/admin/AdminBilProfil";
import AdminDeler from "./pages/admin/AdminDeler";
import AdminKategorier from "./pages/admin/AdminKategorier";
import AdminForesporsler from "./pages/admin/AdminForesporsler";
import AdminInnsendinger from "./pages/admin/AdminInnsendinger";
import AdminMeldinger from "./pages/admin/AdminMeldinger";
import SendInnBil from "./pages/SendInnBil";
import Personvern from "./pages/Personvern";
import AcceptInvitation from "./pages/AcceptInvitation";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import DashboardMineBiler from "./pages/DashboardMineBiler";
import DashboardBilDetalj from "./pages/DashboardBilDetalj";
import EierProfil from "./pages/EierProfil";
import AdminEierprofiler from "./pages/admin/AdminEierprofiler";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/manedens-bil" element={<ManedensBil />} />
              <Route path="/biler" element={<Biler />} />
              <Route path="/biler/:slug" element={<BilDetalj />} />
              <Route path="/eier/:slug" element={<EierProfil />} />
              <Route path="/deler" element={<Deler />} />
              <Route path="/foresporsel" element={<Foresporsel />} />
              <Route path="/om-oss" element={<OmOss />} />
              <Route path="/historie" element={<Historie />} />
              <Route path="/send-inn" element={<SendInnBil />} />
              <Route path="/kontakt" element={<Kontakt />} />
              <Route path="/personvern" element={<Personvern />} />
              <Route path="/accept-invitation" element={<AcceptInvitation />} />
              <Route path="/i/:token" element={<AcceptInvitation />} />
              <Route path="/login" element={<Login />} />
              {/* Dashboard routes for car owners */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/mine-biler" element={<DashboardMineBiler />} />
              <Route path="/dashboard/bil/:carId" element={<DashboardBilDetalj />} />
              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/biler" element={<AdminBiler />} />
              <Route path="/admin/biler/:carId" element={<AdminBilProfil />} />
              <Route path="/admin/deler" element={<AdminDeler />} />
              <Route path="/admin/kategorier" element={<AdminKategorier />} />
              <Route path="/admin/eierprofiler" element={<AdminEierprofiler />} />
              <Route path="/admin/foresporsler" element={<AdminForesporsler />} />
              <Route path="/admin/innsendinger" element={<AdminInnsendinger />} />
              <Route path="/admin/meldinger" element={<AdminMeldinger />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
