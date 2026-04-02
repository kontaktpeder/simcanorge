import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { ArrowRight, PlusCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import heroCar from "@/assets/hero-car.jpg";

const modules = [
  {
    href: "/biler",
    title: "Biler",
    desc: "Historier",
    active: true,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6">
        <path d="M5 21l3-7h16l3 7" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="3" y="21" width="26" height="5" rx="1"/>
        <circle cx="9" cy="26" r="2"/><circle cx="23" cy="26" r="2"/>
      </svg>
    ),
  },
  {
    href: "/markedsplass",
    title: "Markedsplass",
    desc: "Kjøp & salg",
    active: true,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6">
        <path d="M7 9h18l-2 13H9L7 9z" strokeLinejoin="round"/>
        <path d="M7 9L5 5" strokeLinecap="round"/>
        <circle cx="12" cy="26" r="1.5"/><circle cx="20" cy="26" r="1.5"/>
      </svg>
    ),
  },
  {
    href: "/arrangement",
    title: "Events",
    desc: "Treff & samlinger",
    active: true,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6">
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
    desc: "Kommer snart",
    active: false,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6">
        <circle cx="12" cy="11" r="4"/><circle cx="22" cy="13" r="3"/>
        <path d="M4 27c0-5 4-8 8-8s8 3 8 8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "#",
    title: "Aktører",
    desc: "Kommer snart",
    active: false,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6">
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
        <title>Bilgarasje.no — Hele Norges bilsamfunn på nett</title>
        <meta name="description" content="Utforsk norske biler og deres historie. Biler, markedsplass, arrangementer og mer." />
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)] bg-[#0a0a0a]">

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden h-[280px] sm:h-[320px] md:h-[360px]">
          {/* Full-width image */}
          <img
            src={heroCar}
            alt="Simca 1000 Rallye racerbil"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#0a0a0a]/50 to-transparent" />

          {/* Title */}
          <div className="relative z-10 h-full flex flex-col justify-center max-w-[1200px] mx-auto px-5 md:px-8">
            <h1 className="font-display text-[2.2rem] sm:text-[3rem] md:text-[3.8rem] leading-[1.05] uppercase tracking-wider text-white/90">
              Hele Norges bilsamfunn
            </h1>
            <p className="font-display text-[1.1rem] sm:text-[1.4rem] md:text-[1.7rem] uppercase tracking-[0.15em] text-white/25 mt-1">
              på nett
            </p>
            <p className="text-[11px] sm:text-xs text-white/35 mt-3 tracking-wide">
              Se oppdateringer fra norske bilentusiaster
            </p>
          </div>
        </section>

        {/* ─── MODULES ─── */}
        <section className="bg-[#0a0a0a]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-5 border-t border-white/[0.06]">
              {modules.map((mod, i) => {
                const inner = (
                  <div
                    className={`flex flex-col items-center justify-center gap-2 py-6 md:py-8 text-center transition-all duration-300 group ${
                      mod.active ? "cursor-pointer" : "opacity-25 cursor-default"
                    } ${i < modules.length - 1 ? "border-r border-white/[0.06]" : ""}`}
                  >
                    <div className={`text-white/30 transition-colors duration-300 ${mod.active ? "group-hover:text-white/70" : ""}`}>
                      {mod.icon}
                    </div>
                    <div>
                      <p className={`text-sm md:text-base tracking-[0.06em] uppercase font-semibold leading-tight transition-colors duration-300 ${
                        mod.active ? "text-white/70 group-hover:text-white" : "text-white/25"
                      }`}>
                        {mod.title}
                      </p>
                      <p className="text-[9px] md:text-[10px] text-white/20 leading-tight mt-1">
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                );

                return mod.active ? (
                  <Link key={mod.title} to={mod.href}>{inner}</Link>
                ) : (
                  <div key={mod.title}>{inner}</div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── TRANSITION ─── */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* ─── POST UPDATE + FEED ─── */}
        <section className="bg-background py-8 md:py-12">
          <div className="max-w-[860px] mx-auto px-5 md:px-8">

            {/* Post update bar */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 flex items-center gap-3 px-5 py-3.5 bg-muted/50 border border-border/40 rounded-sm">
                <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-muted-foreground/40">👤</span>
                </div>
                <p className="text-sm text-muted-foreground/40">
                  Hva tenker du på i dag? Del et bilde eller en oppdatering...
                </p>
              </div>
              <Link
                to={user ? "/dashboard" : "/login?returnUrl=/dashboard"}
                className="flex items-center gap-2 px-5 py-3.5 bg-foreground text-background text-sm font-semibold tracking-wide hover:bg-foreground/90 transition-colors flex-shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Legg ut oppdatering
              </Link>
            </div>

            {/* Feed header */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-base font-semibold text-foreground/80">
                Siste oppdateringer
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

            {/* Feed placeholder */}
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/30">
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
