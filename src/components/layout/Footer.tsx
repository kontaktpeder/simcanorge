import { Link } from "react-router-dom";
import { Facebook, Mail } from "lucide-react";
import simcaLogo from "@/assets/simca-logo.png";

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <img 
              src={simcaLogo} 
              alt="Simca Norge" 
              className="h-20 w-auto"
            />
            <p className="font-serif italic text-lg text-center md:text-left">
              "La petite voiture française"
            </p>
            <p className="text-sm opacity-80">
              Norges hjørne for Simca-entusiaster
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="font-display text-2xl mb-4">SNARVEIER</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/biler" className="hover:underline">Biler & Historier</Link>
              <Link to="/deler" className="hover:underline">Finn deler</Link>
              <Link to="/send-inn" className="hover:underline">Send inn din bil</Link>
              <Link to="/historie" className="hover:underline">Simcas historie</Link>
              <Link to="/foresporsel" className="hover:underline">Min forespørsel</Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left">
            <h3 className="font-display text-2xl mb-4">KONTAKT</h3>
            <div className="flex flex-col gap-3">
              <a 
                href="mailto:kontaktpeder@gmail.com" 
                className="flex items-center justify-center md:justify-start gap-2 hover:underline"
              >
                <Mail className="w-5 h-5" />
                kontaktpeder@gmail.com
              </a>
              <a 
                href="https://facebook.com/groups/simcanorge" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center md:justify-start gap-2 hover:underline"
              >
                <Facebook className="w-5 h-5" />
                Facebook-gruppen
              </a>
            </div>
            <p className="mt-6 text-sm opacity-80">
              Pappa sjekker hylla hver dag! 🔧
            </p>
          </div>
        </div>

        <div className="section-divider !bg-primary-foreground/30" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-80">
          <p>© {new Date().getFullYear()} Simca Norge. Laget med ❤️ for klassiske biler.</p>
          <Link to="/admin/login" className="hover:underline">
            Admin
          </Link>
        </div>
      </div>
    </footer>
  );
}
