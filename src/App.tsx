import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Biler from "./pages/Biler";
import BilDetalj from "./pages/BilDetalj";
import Deler from "./pages/Deler";
import Foresporsel from "./pages/Foresporsel";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminBiler from "./pages/admin/AdminBiler";
import AdminDeler from "./pages/admin/AdminDeler";
import AdminKategorier from "./pages/admin/AdminKategorier";
import AdminForesporsler from "./pages/admin/AdminForesporsler";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/biler" element={<Biler />} />
            <Route path="/biler/:slug" element={<BilDetalj />} />
            <Route path="/deler" element={<Deler />} />
            <Route path="/foresporsel" element={<Foresporsel />} />
            
            {/* Admin routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/biler" element={<AdminBiler />} />
            <Route path="/admin/deler" element={<AdminDeler />} />
            <Route path="/admin/kategorier" element={<AdminKategorier />} />
            <Route path="/admin/foresporsler" element={<AdminForesporsler />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
