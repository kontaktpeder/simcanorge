import { useState } from "react";
import { Link } from "react-router-dom";
import { ReportProblemModal } from "@/components/support";
import { useAuth } from "@/hooks/useAuth";
import { FEATURES } from "@/config/features";
import carSilhouette from "@/assets/car-silhouette.png";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export function Footer() {
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <footer className="relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #0e151d 0%, #0a0f14 100%)' }}>
        {/* Car silhouette watermark */}
        <img
          src={carSilhouette}
          alt=""
          aria-hidden="true"
          className="absolute bottom-0 right-0 translate-x-[20%] translate-y-[15%] w-[500px] md:w-[600px] opacity-[0.03] pointer-events-none select-none -scale-x-100"
          style={{ filter: 'invert(1) brightness(2)' }}
        />

        <div className="h-px bg-[#2dd4a8]/10" />
        <div className="relative max-w-[860px] mx-auto px-5 md:px-8 py-10 md:py-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-10">
            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <p className="text-[11px] tracking-[0.25em] uppercase font-bold mb-3"
                style={{ ...chakra, background: 'linear-gradient(135deg, #2dd4a8, #5aedc4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                bilgarasje.no
              </p>
              <p className="text-[12px] text-white/35 leading-relaxed" style={chakra}>
                Norges bilsamfunn på nett. Biler, deler, treff og historier.
              </p>
            </div>

            {/* Utforsk */}
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#2dd4a8]/50 font-bold mb-3" style={chakra}>Utforsk</h3>
              <nav className="flex flex-col gap-1.5 text-[12px]" style={chakra}>
                <Link to="/biler" className="text-white/40 hover:text-[#2dd4a8] transition-colors">Biler</Link>
                {!FEATURES.simpleLaunchMode && (
                  <>
                    <Link to="/markedsplass" className="text-white/40 hover:text-[#2dd4a8] transition-colors">Markedsplass</Link>
                    <Link to="/arrangement" className="text-white/40 hover:text-[#2dd4a8] transition-colors">Arrangementer</Link>
                  </>
                )}
                <Link to="/historie" className="text-white/40 hover:text-[#2dd4a8] transition-colors">Historie</Link>
              </nav>
            </div>

            {/* Delta */}
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#2dd4a8]/50 font-bold mb-3" style={chakra}>Delta</h3>
              <nav className="flex flex-col gap-1.5 text-[12px]" style={chakra}>
                <Link to="/legg-til-bil" className="text-white/40 hover:text-[#2dd4a8] transition-colors">Legg inn bilen din</Link>
                {!FEATURES.simpleLaunchMode && (
                  <Link to="/start-annonse" className="text-white/40 hover:text-[#2dd4a8] transition-colors">Opprett annonse</Link>
                )}
                <Link to="/kontakt" className="text-white/40 hover:text-[#2dd4a8] transition-colors">Kontakt oss</Link>
                <button
                  onClick={() => setReportModalOpen(true)}
                  className="text-left text-white/40 hover:text-[#2dd4a8] transition-colors"
                >
                  Rapporter problem
                </button>
              </nav>
            </div>

            {/* Fellesskap */}
            <div>
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-[#2dd4a8]/50 font-bold mb-3" style={chakra}>Fellesskap</h3>
              <nav className="flex flex-col gap-1.5 text-[12px]" style={chakra}>
                <a href="https://www.facebook.com/groups/1569119639997670" target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-[#2dd4a8] transition-colors">
                  Facebook
                </a>
                <Link to="/om-oss" className="text-white/40 hover:text-[#2dd4a8] transition-colors">Om oss</Link>
              </nav>
            </div>
          </div>

          <div className="h-px bg-[#2dd4a8]/10 mt-10 mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] tracking-[0.1em] text-white/20" style={chakra}>
            <p>© {new Date().getFullYear()} Bilgarasje.no</p>
            <div className="flex items-center gap-4">
              <Link to="/personvern" className="hover:text-[#2dd4a8]/50 transition-colors">Personvern</Link>
              <Link to="/admin/login" className="hover:text-[#2dd4a8]/50 transition-colors">Admin</Link>
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
