import { useState } from "react";
import { Link } from "react-router-dom";
import { ReportProblemModal } from "@/components/support";
import { useAuth } from "@/hooks/useAuth";

export function Footer() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <footer className="bg-[#0a0a0a] text-white/60">
        <div className="h-px bg-white/[0.06]" />
        <div className="max-w-[860px] mx-auto px-5 md:px-8 py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <p className="text-[10px] tracking-[0.3em] uppercase text-white/30 mb-3">
                Bilgarasje.no
              </p>
              <p className="text-xs text-white/40 leading-relaxed">
                Norges bilsamfunn på nett. Biler, deler, treff og historier.
              </p>
            </div>

            {/* Utforsk */}
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-3">Utforsk</h3>
              <nav className="flex flex-col gap-1.5 text-xs">
                <Link to="/biler" className="hover:text-white transition-colors">Biler</Link>
                <Link to="/markedsplass" className="hover:text-white transition-colors">Markedsplass</Link>
                <Link to="/arrangement" className="hover:text-white transition-colors">Arrangementer</Link>
                <Link to="/historie" className="hover:text-white transition-colors">Historie</Link>
              </nav>
            </div>

            {/* Delta */}
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-3">Delta</h3>
              <nav className="flex flex-col gap-1.5 text-xs">
                <Link to="/send-inn" className="hover:text-white transition-colors">Send inn bil</Link>
                <Link to="/start-annonse" className="hover:text-white transition-colors">Opprett annonse</Link>
                <Link to="/kontakt" className="hover:text-white transition-colors">Kontakt oss</Link>
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="text-left hover:text-white transition-colors"
                >
                  Rapporter problem
                </button>
              </nav>
            </div>

            {/* Fellesskap */}
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-white/30 mb-3">Fellesskap</h3>
              <nav className="flex flex-col gap-1.5 text-xs">
                <a href="https://www.facebook.com/groups/1569119639997670" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  Facebook
                </a>
                <Link to="/om-oss" className="hover:text-white transition-colors">Om oss</Link>
              </nav>
            </div>
          </div>

          <div className="h-px bg-white/[0.06] mt-10 mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] tracking-[0.1em] text-white/25">
            <p>© {new Date().getFullYear()} Bilgarasje.no</p>
            <div className="flex items-center gap-4">
              <Link to="/personvern" className="hover:text-white/50 transition-colors">Personvern</Link>
              <Link to="/admin/login" className="hover:text-white/50 transition-colors">Admin</Link>
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
