import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import bilgarasjeLogo from "@/assets/bilgarasje-logo.png";

const navLinks = [
  { href: "/", label: "Hjem" },
  { href: "/biler", label: "Biler" },
  { href: "/markedsplass", label: "Markedsplass" },
  { href: "/arrangement", label: "Arrangement" },
  { href: "/manedens-bil", label: "Månedens bil" },
  { href: "/historie", label: "Historie" },
  { href: "/om-oss", label: "Om oss" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a]">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="flex items-center h-14 md:h-16 gap-6">

          <Link to="/" className="flex-shrink-0 group -my-2">
            <img
              src={bilgarasjeLogo}
              alt="Bilgarasje.no"
              className="h-16 md:h-[76px] w-auto invert opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-0 flex-shrink-0">
            {navLinks.map((link, i) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative px-3 py-1 text-[10.5px] tracking-[0.18em] uppercase transition-all duration-300 ${
                    isActive
                      ? "text-white"
                      : "text-white/30 hover:text-white/65"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-[7px] left-3 right-3 h-px bg-white/60" />
                  )}
                  {i < navLinks.length - 1 && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-2.5 bg-white/[0.07]" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="hidden md:flex flex-1 max-w-sm ml-auto">
            <GlobalSearch />
          </div>

          <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
            {user ? (
              <Link
                to="/dashboard"
                className="px-4 py-1.5 text-[10.5px] tracking-[0.15em] uppercase text-white/40 hover:text-white/80 border border-white/10 hover:border-white/25 transition-all duration-300"
              >
                Min garasje
              </Link>
            ) : (
              <Link
                to="/login?returnUrl=/dashboard"
                className="flex items-center gap-1.5 px-4 py-1.5 text-[10.5px] tracking-[0.15em] uppercase text-white/40 hover:text-white/80 border border-white/10 hover:border-white/25 transition-all duration-300"
              >
                <LogIn className="w-3 h-3" />
                Logg inn
              </Link>
            )}
            <Link
              to="/send-inn"
              className="px-4 py-1.5 text-[10.5px] tracking-[0.15em] uppercase text-[#0a0a0a] bg-white/85 hover:bg-white transition-all duration-300 font-semibold"
            >
              Send inn bil
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden ml-auto p-2 text-white/35 hover:text-white transition-colors"
            aria-label="Meny"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="h-px bg-white/[0.06]" />

      {mobileMenuOpen && (
        <nav className="lg:hidden bg-[#0a0a0a] border-t border-white/[0.04]">
          <div className="px-5 pt-3 pb-2">
            <GlobalSearch />
          </div>
          <div className="px-5 py-2 flex flex-col">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2.5 text-[11px] tracking-[0.15em] uppercase border-b border-white/[0.03] transition-all ${
                    isActive ? "text-white" : "text-white/25 hover:text-white/55"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="flex flex-col gap-2 mt-3 pb-2">
              {user ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center text-[11px] tracking-[0.15em] uppercase text-white/40 border border-white/10">
                  Min garasje
                </Link>
              ) : (
                <Link to="/login?returnUrl=/dashboard" onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-center text-[11px] tracking-[0.15em] uppercase text-white/40 border border-white/10 flex items-center justify-center gap-2">
                  <LogIn className="w-3.5 h-3.5" /> Logg inn
                </Link>
              )}
              <Link to="/send-inn" onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-center text-[11px] tracking-[0.15em] uppercase text-[#0a0a0a] bg-white/85 font-semibold">
                Send inn bil
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
