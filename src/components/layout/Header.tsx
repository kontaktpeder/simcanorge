import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn, Warehouse } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { FEATURES } from "@/config/features";
import simcaLogo from "@/assets/simca-norge-badge.png";

const allNavLinks = [
  { href: "/", label: "Hjem" },
  { href: "/biler", label: "Biler" },
  { href: "/markedsplass", label: "Markedsplass", launchLocked: true },
  { href: "/arrangement", label: "Arrangement", launchLocked: true },
  { href: "/manedens-bil", label: "Månedens bil" },
  { href: "/historie", label: "Historie" },
  { href: "/om-oss", label: "Om oss" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const navLinks = allNavLinks.filter(
    (link) => !(FEATURES.simpleLaunchMode && link.launchLocked)
  );

  const garageHref = "/min-garasje";
  const loginHref = `/login?returnUrl=${encodeURIComponent(garageHref)}`;

  return (
    <header className="sticky top-0 z-50 bg-[#071628]">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-center h-14 md:h-16 gap-4 md:gap-6">
          <Link
            to="/"
            className="flex-shrink-0 group"
            aria-label="Simca Norge — hjem"
          >
            <img
              src={simcaLogo}
              alt="Simca Norge"
              className="h-11 md:h-12 w-auto opacity-100 group-hover:opacity-90 transition-opacity duration-200"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1 flex-shrink-0" aria-label="Hovedmeny">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative px-3 py-2 text-[13px] font-semibold tracking-wide transition-colors ${
                    isActive
                      ? "text-white"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex flex-1 max-w-sm ml-auto">
            <GlobalSearch variant="dark" />
          </div>

          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {user ? (
              <Link
                to={garageHref}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/25 rounded-md transition-colors"
              >
                <Warehouse className="w-4 h-4" />
                Min garasje
              </Link>
            ) : (
              <Link
                to={loginHref}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-white/90 hover:text-white border border-white/25 hover:border-white/40 rounded-md transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Logg inn
              </Link>
            )}
            <Link
              to="/send-inn"
              className="px-3.5 py-2 text-[13px] font-bold text-[#071628] bg-white hover:bg-white/90 rounded-md transition-colors"
            >
              Send inn bil
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden ml-auto p-2 text-white/90 hover:text-white transition-colors"
            aria-label="Meny"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="lg:hidden bg-[#071628] border-t border-white/15" aria-label="Mobilmeny">
          <div className="px-4 pt-3 pb-2">
            <GlobalSearch variant="dark" />
          </div>
          <div className="px-4 py-2 flex flex-col">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 text-[15px] font-semibold border-b border-white/10 transition-colors ${
                    isActive ? "text-white" : "text-white/85 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-2 mt-4 pb-4">
              {user ? (
                <Link
                  to={garageHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-center text-[14px] font-semibold text-white bg-white/15 border border-white/25 rounded-md"
                >
                  Min garasje
                </Link>
              ) : (
                <Link
                  to={loginHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-3 text-center text-[14px] font-semibold text-white/90 border border-white/25 rounded-md inline-flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" /> Logg inn
                </Link>
              )}
              <Link
                to="/send-inn"
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-center text-[14px] font-bold text-[#071628] bg-white rounded-md"
              >
                Send inn bil
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
