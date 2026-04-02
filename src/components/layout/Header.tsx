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
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50" style={{
      background: 'linear-gradient(180deg, #0d0d0d 0%, #141414 100%)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      {/* Subtle noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="max-w-[1400px] mx-auto px-5 md:px-8 relative z-10">
        {/* Top row: logo centered + search */}
        <div className="flex items-center justify-between py-3 md:py-4">

          {/* Logo — large, proud */}
          <Link to="/" className="flex-shrink-0 group">
            <img
              src={bilgarasjeLogo}
              alt="Bilgarasje.no"
              className="h-14 md:h-20 w-auto invert opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            />
          </Link>

          {/* Search bar — integrated, no separate icon */}
          <div className="hidden md:flex flex-1 max-w-lg mx-10">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                placeholder="Søk etter biler, deler, historier..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-none pl-11 pr-4 py-2.5 text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-white/20 focus:bg-white/[0.06] transition-all tracking-wide"
              />
            </div>
          </div>

          {/* Right side: auth + CTA */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="px-5 py-2 text-[12px] tracking-[0.15em] uppercase text-white/50 hover:text-white border border-white/15 hover:border-white/30 transition-all duration-300"
              >
                Min garasje
              </Link>
            ) : (
              <Link
                to="/login?returnUrl=/dashboard"
                className="flex items-center gap-2 px-5 py-2 text-[12px] tracking-[0.15em] uppercase text-white/50 hover:text-white border border-white/15 hover:border-white/30 transition-all duration-300"
              >
                <LogIn className="w-3.5 h-3.5" />
                Logg inn
              </Link>
            )}
            <Link
              to="/send-inn"
              className="px-5 py-2 text-[12px] tracking-[0.15em] uppercase text-[#0d0d0d] bg-white/90 hover:bg-white transition-all duration-300 font-semibold"
            >
              Send inn bil
            </Link>
          </div>

          {/* Mobile: menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-white/40 hover:text-white transition-colors"
            aria-label="Meny"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Nav row — separated by thin line */}
        <div className="hidden lg:block border-t border-white/[0.06]">
          <nav className="flex items-center gap-0 py-0">
            {navLinks.map((link, i) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative px-4 py-3 text-[11px] tracking-[0.2em] uppercase transition-all duration-300 ${
                    isActive
                      ? "text-white"
                      : "text-white/35 hover:text-white/70"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-4 right-4 h-px bg-white" />
                  )}
                  {i < navLinks.length - 1 && (
                    <span className="absolute right-0 top-1/2 -translate-y-1/2 w-px h-3 bg-white/[0.08]" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <nav className="lg:hidden border-t border-white/[0.06]" style={{ background: '#0d0d0d' }}>
          {/* Mobile search */}
          <div className="px-5 pt-4 pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                placeholder="Søk..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-none pl-10 pr-4 py-2.5 text-sm text-white/70 placeholder:text-white/25 focus:outline-none focus:border-white/20 transition-all tracking-wide"
              />
            </div>
          </div>

          <div className="px-5 py-3 flex flex-col">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`py-3 text-[12px] tracking-[0.15em] uppercase border-b border-white/[0.04] transition-all ${
                    isActive ? "text-white" : "text-white/30 hover:text-white/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="flex flex-col gap-3 mt-4 pb-2">
              {user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-[12px] tracking-[0.15em] uppercase text-white/50 border border-white/15"
                >
                  Min garasje
                </Link>
              ) : (
                <Link
                  to="/login?returnUrl=/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2.5 text-center text-[12px] tracking-[0.15em] uppercase text-white/50 border border-white/15 flex items-center justify-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Logg inn
                </Link>
              )}
              <Link
                to="/send-inn"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2.5 text-center text-[12px] tracking-[0.15em] uppercase text-[#0d0d0d] bg-white/90 font-semibold"
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
