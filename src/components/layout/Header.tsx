import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import simcaBadge from "@/assets/simca-badge.png";
import toolboxIcon from "@/assets/toolbox-icon.png";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const navItems = [
  { href: "/", label: "Hjem", description: "Tilbake til forsiden" },
  { href: "/manedens-bil", label: "Månedens bil", description: "Se denne månedens utvalgte Simca" },
  { href: "/biler", label: "Biler", description: "Utforsk Simca-biler og historier" },
  { href: "/deler", label: "Deler", description: "Finn deler til din Simca" },
  { href: "/send-inn", label: "Send inn din bil", description: "Del din Simca-historie med oss" },
  { href: "/historie", label: "Simcaens historie", description: "Lær om Simcas rike historie" },
  { href: "/om-oss", label: "Om oss", description: "Hvem står bak Simca Norge" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 header-chrome">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover-lift">
            <img 
              src={simcaBadge} 
              alt="Simca Norge" 
              className="h-14 w-auto drop-shadow-md"
            />
            <div className="hidden sm:block">
              <span className="font-display text-2xl text-primary">SIMCA</span>
              <span className="font-display text-2xl text-accent ml-1">NORGE</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <TooltipProvider delayDuration={200}>
              {navItems.map((item) => (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.href}
                      className={`font-display text-lg uppercase tracking-wide transition-all hover:text-accent relative py-1 ${
                        location.pathname === item.href
                          ? "text-accent"
                          : "text-foreground"
                      }`}
                    >
                      {item.label}
                      {location.pathname === item.href && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                      )}
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.description}</p>
                  </TooltipContent>
                </Tooltip>
              ))}

              {/* Toolbox Icon */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to="/foresporsel"
                    className="relative p-2 hover:bg-muted/50 rounded-lg transition-colors ml-2"
                    aria-label="Min verktøykasse"
                  >
                    <img src={toolboxIcon} alt="Verktøykasse" className="w-8 h-8 object-contain" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground w-5 h-5 rounded-full text-xs font-display flex items-center justify-center shadow-md">
                        {itemCount}
                      </span>
                    )}
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{itemCount > 0 ? `${itemCount} deler i verktøykassen` : "Min verktøykasse"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </nav>

          {/* Mobile: Toolbox + Menu */}
          <div className="lg:hidden flex items-center gap-2">
            <Link
              to="/foresporsel"
              className="relative p-2 hover:bg-muted/50 rounded-lg transition-colors"
              aria-label="Min verktøykasse"
            >
              <img src={toolboxIcon} alt="Verktøykasse" className="w-8 h-8 object-contain" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground w-5 h-5 rounded-full text-xs font-display flex items-center justify-center shadow-md">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-muted/50 rounded-lg"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="lg:hidden pb-6 border-t border-chrome-mid mt-2 pt-4">
            <div className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-display text-xl uppercase tracking-wide py-2 px-4 rounded-lg transition-all hover:bg-muted/50 ${
                    location.pathname === item.href
                      ? "text-accent bg-muted/30"
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
