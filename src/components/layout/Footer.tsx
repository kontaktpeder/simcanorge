import { useState } from "react";
import { Link } from "react-router-dom";
import { Bug } from "lucide-react";
import simcaNorgeBadge from "@/assets/simca-norge-badge.png";
import { ReportProblemModal } from "@/components/support";
import { useAuth } from "@/hooks/useAuth";

export function Footer() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <footer className="bg-metal-blue text-white">
        <div className="container mx-auto px-4 py-6 md:py-10">
          <div className="flex flex-col md:flex-row gap-6 md:gap-10">
            {/* Logo & Tagline */}
            <div className="flex flex-col items-center md:items-start gap-2 md:gap-3 md:flex-1">
              <img src={simcaNorgeBadge} alt="Simca Norge" className="h-16 md:h-24 w-auto drop-shadow-lg" />
              <p className="font-serif italic text-sm md:text-base text-center md:text-left text-white/90">
                "La petite voiture française"
              </p>
              <p className="text-xs md:text-sm text-white/70 text-center md:text-left">
                Norges hjørne for Simca, Talbot og Matra - entusiaster
              </p>
            </div>

            {/* Two column links section */}
            <div className="grid grid-cols-2 gap-4 md:gap-8 md:flex-1">
              {/* Quick Links */}
              <div className="text-left">
                <h3 className="font-display text-base md:text-xl mb-2 md:mb-3 text-metal">SNARVEIER</h3>
                <nav className="flex flex-col gap-1 md:gap-1.5 text-xs md:text-base">
                  <Link to="/biler" className="hover:text-white/80 transition-colors text-white/90">Biler & Historier</Link>
                  <Link to="/deler" className="hover:text-white/80 transition-colors text-white/90">Finn deler</Link>
                  <Link to="/send-inn" className="hover:text-white/80 transition-colors text-white/90">Send inn din bil</Link>
                  <Link to="/historie" className="hover:text-white/80 transition-colors text-white/90">Simcas historie</Link>
                  <Link to="/foresporsel" className="hover:text-white/80 transition-colors text-white/90">Min forespørsel</Link>
                </nav>
              </div>

              {/* Contact */}
              <div className="text-left">
                <h3 className="font-display text-base md:text-xl mb-2 md:mb-3 text-metal">KONTAKT</h3>
                <div className="flex flex-col gap-1.5 md:gap-2 text-xs md:text-base">
                  {/* Report Problem */}
                  <button
                    onClick={() => setReportModalOpen(true)}
                    className="flex items-center gap-1.5 text-white/90 hover:text-white transition-colors text-left"
                  >
                    <Bug className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    <span>Rapporter et problem</span>
                  </button>
                  <Link to="/kontakt" className="hover:text-white/80 transition-colors text-white/90">
                    Kontakt oss
                  </Link>
                  <a href="https://www.facebook.com/groups/1569119639997670" target="_blank" rel="noopener noreferrer" className="hover:text-white/80 transition-colors text-white/90">
                    Facebook-gruppen
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="section-divider !my-4 md:!my-6" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4 text-xs md:text-sm text-white/70">
            <p>© {new Date().getFullYear()} Simca Norge. Laget med ❤️ for klassiske biler.</p>
            <div className="flex items-center gap-4">
              <Link to="/personvern" className="hover:text-white/90 transition-colors">
                Personvern
              </Link>
              <Link to="/admin/login" className="hover:text-white/90 transition-colors">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
      
      <ReportProblemModal
        open={reportModalOpen}
        onOpenChange={setReportModalOpen}
        userId={user?.id}
      />
    </>
  );
}
