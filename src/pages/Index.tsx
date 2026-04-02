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
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
        <path d="M5 21l3-7h16l3 7" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="21" width="26" height="5" rx="1"/>
        <circle cx="9" cy="26" r="2"/><circle cx="23" cy="26" r="2"/>
      </svg>
    ),
  },
  {
    href: "/markedsplass",
    title: "Markedsplass",
    desc: "Deler og biler til salgs",
    active: true,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
        <path d="M7 9h18l-2 13H9L7 9z" strokeLinejoin="round"/>
        <path d="M7 9L5 5" strokeLinecap="round"/>
        <circle cx="12" cy="26" r="1.5"/><circle cx="20" cy="26" r="1.5"/>
      </svg>
    ),
  },
  {
    href: "/arrangement",
    title: "Events",
    desc: "Treff og arrangementer",
    active: true,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
        <rect x="5" y="7" width="22" height="20" rx="2"/>
        <line x1="5" y1="13" x2="27" y2="13"/>
        <line x1="11" y1="5" x2="11" y2="9" strokeLinecap="round"/>
        <line x1="21" y1="5" x2="21" y2="9" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "#",
    title: "Klubber",
    desc: "Bli med i en bilklubb",
    active: false,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
        <circle cx="12" cy="11" r="4"/><circle cx="22" cy="13" r="3"/>
        <path d="M4 27c0-5 4-8 8-8s8 3 8 8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "#",
    title: "Aktører",
    desc: "Verksteder og forhandlere",
    active: false,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-7 h-7">
        <path d="M5 28V13l11-8 11 8v15" strokeLinejoin="round"/>
        <rect x="13" y="19" width="6" height="9"/>
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
