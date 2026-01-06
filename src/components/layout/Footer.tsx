import { Link } from "react-router-dom";
import { Facebook, Mail } from "lucide-react";
import simcaLogo from "@/assets/simca-logo.png";
export function Footer() {
  return <footer className="bg-metal-blue text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Logo & Tagline */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <img src={simcaLogo} alt="Simca Norge" className="h-20 w-auto drop-shadow-lg" />
            <p className="font-serif italic text-lg text-center md:text-left text-white/90">
              "La petite voiture française"
            </p>
            <p className="text-sm text-white/70">
              Norges hjørne for Simca, Talbot og Matra - entusiaster
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="font-display text-2xl mb-4 text-metal">SNARVEIER</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/biler" className="hover:text-white/80 transition-colors text-white/90">Biler & Historier</Link>
              <Link to="/deler" className="hover:text-white/80 transition-colors text-white/90">Finn deler</Link>
              <Link to="/send-inn" className="hover:text-white/80 transition-colors text-white/90">Send inn din bil</Link>
              <Link to="/historie" className="hover:text-white/80 transition-colors text-white/90">Simcas historie</Link>
              <Link to="/kontakt" className="hover:text-white/80 transition-colors text-white/90">Kontakt oss</Link>
              <Link to="/foresporsel" className="hover:text-white/80 transition-colors text-white/90">Min forespørsel</Link>
            </nav>
          </div>

          {/* Contact */}
          <div className="text-center md:text-left">
            <h3 className="font-display text-2xl mb-4 text-metal">KONTAKT</h3>
            <div className="flex flex-col gap-3">
              <a href="mailto:kontaktpeder@gmail.com" className="flex items-center justify-center md:justify-start gap-2 hover:text-white/80 transition-colors text-white/90">
                <Mail className="w-5 h-5" />
                kontaktpeder@gmail.com
              </a>
              <a href="https://facebook.com/groups/simcanorge" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-start gap-2 hover:text-white/80 transition-colors text-white/90">
                <Facebook className="w-5 h-5" />
                Facebook-gruppen
              </a>
            </div>
            <p className="mt-6 text-sm text-white/70">
              Pappa sjekker hylla hver dag! 🔧
            </p>
          </div>
        </div>

        <div className="section-divider !my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/70">
          <p>© {new Date().getFullYear()} Simca Norge. Laget med ❤️ for klassiske biler.</p>
          <Link to="/admin/login" className="hover:text-white/90 transition-colors">
            Admin
          </Link>
        </div>
      </div>
    </footer>;
}