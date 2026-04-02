import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Search, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import bilgarasjeLogo from "@/assets/bilgarasje-logo.png";

const navLinks = [
  { href: "/", label: "Hjem" },
  { href: "/biler", label: "Biler" },
  { href: "/markedsplass", label: "Markedsplass" },
  { href: "/manedens-bil", label: "Månedens bil" },
  { href: "/historie", label: "Historie" },
  { href: "/om-oss", label: "Om oss" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Header() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0a] border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-5 md:px-8">
        <div className="flex items-center justify-between h-16 md:h-[72px]">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 flex-shrink-0 group">
            <img
              src={bilgarasjeLogo}
              alt="Bilgarasje.no"
              className="h-10 md:h-12 w-auto invert opacity-90 group-hover:opacity-100 transition-opacity"
            />
          </Link>

          {/* Search bar - desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Søk etter biler, deler, historier..."
                className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/25 focus:bg-white/8 transition-all"
              />
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3 py-1.5 text-[13px] tracking-[0.08em] uppercase transition-all ${
                    isActive
                      ? "text-white border-b border-white"
                      : "text-white/50 hover:text-white/80"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Separator */}
            <div className="w-px h-5 bg-white/15 mx-2" />

            {/* Min garasje / Login */}
            {user ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-1.5 text-[13px] tracking-[0.08em] uppercase text-white/70 hover:text-white border border-white/20 rounded-full transition-all hover:border-white/40"
              >
                Min garasje
              </Link>
            ) : (
              <Link
                to="/login?returnUrl=/dashboard"
                className="flex items-center gap-2 px-4 py-1.5 text-[13px] tracking-[0.08em] uppercase text-white/70 hover:text-white border border-white/20 rounded-full transition-all hover:border-white/40"
              >
                <LogIn className="w-3.5 h-3.5" />
                Logg inn
              </Link>
            )}

            {/* Send inn bil - accent */}
            <Link
              to="/send-inn"
              className="ml-1 px-4 py-1.5 text-[13px] tracking-[0.08em] uppercase text-black bg-white rounded-full hover:bg-white/90 transition-all font-medium"
            >
              Send inn bil
            </Link>
          </nav>

          {/* Mobile controls */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-white/50 hover:text-white transition-colors"
              aria-label="Søk"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white/50 hover:text-white transition-colors"
              aria-label="Meny"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        {searchOpen && (
          <div className="lg:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Søk etter biler, deler, historier..."
                autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2.5 text-sm text-white/80 placeholder:text-white/30 focus:outline-none focus:border-white/25 transition-all"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="lg:hidden border-t border-white/10 bg-[#0a0a0a]">
          <div className="max-w-[1400px] mx-auto px-5 py-4 flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-2.5 px-3 text-[13px] tracking-[0.08em] uppercase rounded transition-all ${
                    isActive
                      ? "text-white bg-white/5"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="h-px bg-white/10 my-2" />

            {user ? (
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 text-[13px] tracking-[0.08em] uppercase text-white/60 hover:text-white transition-all"
              >
                Min garasje
              </Link>
            ) : (
              <Link
                to="/login?returnUrl=/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 px-3 text-[13px] tracking-[0.08em] uppercase text-white/60 hover:text-white flex items-center gap-2 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Logg inn
              </Link>
            )}

            <Link
              to="/send-inn"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 py-2.5 px-4 text-[13px] tracking-[0.08em] uppercase text-black bg-white rounded-full text-center font-medium"
            >
              Send inn bil
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
