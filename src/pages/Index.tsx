import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import carSilhouette from "@/assets/car-silhouette.png";

const modules = [
  {
    href: "/biler",
    title: "Biler",
    desc: "Se og del bilhistorier",
    active: true,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-8 h-8">
        <path d="M4 20l3-8h18l3 8" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="2" y="20" width="28" height="6" rx="1"/>
        <circle cx="8" cy="26" r="2.5"/><circle cx="24" cy="26" r="2.5"/>
        <line x1="12" y1="16" x2="20" y2="16" strokeOpacity="0.4"/>
      </svg>
    ),
  },
  {
    href: "/markedsplass",
    title: "Markedsplass",
    desc: "Deler og biler til salgs",
    active: true,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-8 h-8">
        <path d="M6 8h20l-2 14H8L6 8z" strokeLinejoin="round"/>
        <path d="M6 8L4 4" strokeLinecap="round"/>
        <circle cx="11" cy="26" r="2"/><circle cx="21" cy="26" r="2"/>
        <line x1="12" y1="14" x2="20" y2="14" strokeOpacity="0.4"/>
      </svg>
    ),
  },
  {
    href: "/arrangement",
    title: "Events",
    desc: "Treff og arrangementer",
    active: true,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-8 h-8">
        <rect x="4" y="6" width="24" height="22" rx="2"/>
        <line x1="4" y1="12" x2="28" y2="12"/>
        <line x1="10" y1="4" x2="10" y2="8" strokeLinecap="round"/>
        <line x1="22" y1="4" x2="22" y2="8" strokeLinecap="round"/>
        <rect x="9" y="16" width="4" height="4" rx="0.5" strokeOpacity="0.5"/>
        <rect x="19" y="16" width="4" height="4" rx="0.5" strokeOpacity="0.5"/>
      </svg>
    ),
  },
  {
    href: "#",
    title: "Klubber",
    desc: "Bli med i en bilklubb",
    active: false,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-8 h-8">
        <circle cx="12" cy="10" r="4"/><circle cx="22" cy="12" r="3"/>
        <path d="M4 26c0-5 4-8 8-8s8 3 8 8" strokeLinecap="round"/>
        <path d="M20 26c0-3.5 2-6 5-6s5 2.5 5 6" strokeLinecap="round" strokeOpacity="0.5"/>
      </svg>
    ),
  },
  {
    href: "#",
    title: "Aktører",
    desc: "Verksteder og forhandlere",
    active: false,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.2" className="w-8 h-8">
        <path d="M4 28V12l12-8 12 8v16" strokeLinejoin="round"/>
        <rect x="12" y="18" width="8" height="10"/>
        <rect x="8" y="14" width="4" height="4" rx="0.5" strokeOpacity="0.5"/>
        <rect x="20" y="14" width="4" height="4" rx="0.5" strokeOpacity="0.5"/>
      </svg>
    ),
  },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <Layout>
      <Helmet>
        <title>Bilgarasje.no — Norges bilsamfunn på nett</title>
        <meta name="description" content="Utforsk norske biler og deres historie. Biler, markedsplass, arrangementer og mer." />
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)]">

        {/* ─── HERO ─── */}
        <section className="relative bg-[#0a0a0a] pt-10 pb-14 md:pt-12 md:pb-16 overflow-hidden">
          {/* Car silhouette watermark */}
          <img
            src={carSilhouette}
            alt=""
            aria-hidden="true"
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-[15%] w-[700px] md:w-[900px] opacity-[0.04] invert pointer-events-none select-none"
          />
          <div className="relative max-w-[1100px] mx-auto px-5 md:px-8 text-center">
            <p className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-white/20 mb-4 md:mb-5">
              bilgarasje.no
            </p>
            <h1 className="font-display text-[2.2rem] sm:text-[3rem] md:text-[3.8rem] leading-[1] uppercase tracking-wider text-white/90">
              Norges bilsamfunn på nett
            </h1>
          </div>
        </section>

        {/* ─── MODULE GRID ─── */}
        <section className="bg-[#0a0a0a] pb-10 md:pb-14">
          <div className="max-w-[860px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[1px] bg-white/[0.06]">
              {modules.map((mod) => {
                const inner = (
                  <div
                    className={`relative flex flex-col items-center text-center p-6 md:p-7 bg-[#0a0a0a] transition-all duration-300 group ${
                      mod.active
                        ? "hover:bg-white/[0.04] cursor-pointer"
                        : "opacity-30 cursor-default"
                    }`}
                  >
                    {!mod.active && (
                      <span className="absolute top-2.5 right-2.5 text-[7px] tracking-[0.2em] uppercase text-white/30 border border-white/10 px-1.5 py-0.5">
                        Snart
                      </span>
                    )}
                    <div className={`text-white/50 mb-4 transition-colors duration-300 ${mod.active ? "group-hover:text-white/80" : ""}`}>
                      {mod.icon}
                    </div>
                    <p className={`text-[11px] tracking-[0.15em] uppercase font-semibold mb-1 transition-colors duration-300 ${
                      mod.active ? "text-white/70 group-hover:text-white" : "text-white/30"
                    }`}>
                      {mod.title}
                    </p>
                    <p className="text-[9px] tracking-[0.05em] text-white/20 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                );

                return mod.active ? (
                  <Link key={mod.title} to={mod.href}>
                    {inner}
                  </Link>
                ) : (
                  <div key={mod.title}>{inner}</div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── TRANSITION TO LIGHT ─── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* ─── FEED SECTION ─── */}
        <section className="bg-background py-10 md:py-14">
          <div className="max-w-[860px] mx-auto px-5 md:px-8">
            <div className="flex items-center justify-between mb-8">
              <p className="text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                Oppdateringer
              </p>
              {!user && (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-muted-foreground/50 hover:text-foreground transition-colors"
                >
                  Logg inn
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border/30">
              <p className="text-sm font-medium text-foreground/60 mb-1">
                Feed kommer snart
              </p>
              <p className="text-xs text-muted-foreground/60 text-center max-w-xs">
                Oppdateringer fra bileiere, treff og markedsplass
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
