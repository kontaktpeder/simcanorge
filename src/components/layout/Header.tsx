import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import simcaLogo from "@/assets/simca-logo.png";

const navItems = [
  { href: "/", label: "Hjem" },
  { href: "/biler", label: "Biler & Historier" },
  { href: "/deler", label: "Deler" },
  { href: "/send-inn", label: "Send inn din bil" },
  { href: "/historie", label: "Historie" },
  { href: "/om-oss", label: "Om oss" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-card border-b-4 border-foreground">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover-lift">
            <img 
              src={simcaLogo} 
              alt="Simca Norge" 
              className="h-14 w-auto"
            />
            <div className="hidden sm:block">
              <span className="font-display text-2xl text-primary">SIMCA</span>
              <span className="font-display text-2xl text-accent ml-1">NORGE</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`font-display text-lg uppercase tracking-wide transition-colors hover:text-accent ${
                  location.pathname === item.href
                    ? "text-accent"
                    : "text-foreground"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-muted rounded"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden pb-6 border-t border-border mt-2 pt-4">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-display text-xl uppercase tracking-wide py-2 transition-colors hover:text-accent ${
                    location.pathname === item.href
                      ? "text-accent"
                      : "text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
