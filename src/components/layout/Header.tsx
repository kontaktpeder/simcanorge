import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { FEATURES } from "@/config/features";
import simcaLogo from "@/assets/simca-norge-badge.png";

const allNavLinks = [
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
  const submitHref = user ? "/legg-til-bil" : "/send-inn";

  return (
    <header className="sticky top-0 z-50 bg-[#071628] border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        <div className="flex items-center h-16 gap-5 xl:gap-8">
          <Link
            to="/"
            className="flex-shrink-0 group"
            aria-label="Simca Norge — hjem"
          >
            <img
              src={simcaLogo}
              alt="Simca Norge"
              className="h-11 w-auto group-hover:opacity-90 transition-opacity duration-200"
            />
          </Link>

          <nav className="hidden xl:flex items-center gap-5 flex-shrink-0" aria-label="Hovedmeny">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`font-display text-xl leading-none tracking-wide uppercase transition-colors ${
                    isActive
                      ? "text-white border-b-2 border-[#D41515] pb-0.5"
                      : "text-white/90 hover:text-white border-b-2 border-transparent pb-0.5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex flex-1 min-w-[10rem] max-w-xs ml-auto">
            <GlobalSearch variant="dark" />
          </div>

          <div className="hidden xl:flex items-center gap-5 flex-shrink-0">
            <Link
              to={user ? garageHref : loginHref}
              className="font-display text-xl leading-none tracking-wide uppercase text-white/90 hover:text-white transition-colors"
            >
              {user ? "Min garasje" : "Logg inn"}
            </Link>
            <Link
              to={submitHref}
              className="btn-enamel-red !px-4 !py-2 !text-lg !leading-none"
            >
              Legg inn bil
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden ml-auto md:ml-0 inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-2.5 text-white hover:text-white/80 transition-colors"
            aria-label="Meny"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="xl:hidden bg-[#071628] border-t border-white/15" aria-label="Mobilmeny">
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
                  className={`py-3 font-display text-2xl leading-none tracking-wide uppercase border-b border-white/10 transition-colors ${
                    isActive ? "text-white" : "text-white/85 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-3 mt-4 pb-4">
              <Link
                to={user ? garageHref : loginHref}
                onClick={() => setMobileMenuOpen(false)}
                className="py-3 text-center font-display text-2xl leading-none tracking-wide uppercase text-white border border-white/25 rounded-xl"
              >
                {user ? "Min garasje" : "Logg inn"}
              </Link>
              <Link
                to={submitHref}
                onClick={() => setMobileMenuOpen(false)}
                className="btn-enamel-red w-full !text-xl"
              >
                Legg inn bil
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
