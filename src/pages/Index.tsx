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
    desc: "Historier og profiler",
    active: true,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-5 h-5">
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
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-5 h-5">
        <path d="M7 9h18l-2 13H9L7 9z" strokeLinejoin="round"/>
        <path d="M7 9L5 5" strokeLinecap="round"/>
        <circle cx="12" cy="26" r="1.5"/><circle cx="20" cy="26" r="1.5"/>
      </svg>
    ),
  },
  {
    href: "/arrangement",
    title: "Arrangementer",
    desc: "Treff & samlinger",
    active: true,
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-5 h-5">
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
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-5 h-5">
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
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-5 h-5">
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
          <img
            src={heroCar}
            alt="Simca 1000 Rallye racerbil"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#0a0a0a]/50 to-transparent" />

          <div className="relative z-10 h-full flex flex-col justify-center max-w-[1200px] mx-auto px-5 md:px-8">
            <p className="text-[11px] sm:text-xs text-[#c4a882]/50 tracking-[0.3em] uppercase mb-2"
              style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 400 }}>
              bilgarasje.no
            </p>
            <h1
              className="text-[2.4rem] sm:text-[3.2rem] md:text-[4.2rem] leading-[1] uppercase tracking-[0.12em] text-white font-bold"
              style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
            >
              Hele Norges bilsamfunn
            </h1>
            <p
              className="text-[1.1rem] sm:text-[1.5rem] md:text-[1.8rem] uppercase tracking-[0.25em] text-[#c4a882]/50 mt-1"
              style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif", fontWeight: 400 }}
            >
              — på nett
            </p>
            <p className="text-[11px] sm:text-xs text-white/40 mt-3 tracking-[0.1em]">
              Se oppdateringer fra norske bilentusiaster
            </p>
          </div>
        </section>

        {/* ─── MODULES ─── */}
        <section className="bg-[#0a0a0a]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            <div className="flex border-t border-[#a89880]/8">
              {modules.map((mod, i) => {
                const inner = (
                  <div
                    className={`flex-1 flex items-center justify-center gap-3 py-5 md:py-6 text-center transition-all duration-300 group ${
                      mod.active ? "cursor-pointer" : "opacity-20 cursor-default"
                    } ${i < modules.length - 1 ? "border-r border-[#a89880]/8" : ""}`}
                  >
                    <div className={`text-[#a89880]/30 transition-colors duration-300 ${mod.active ? "group-hover:text-[#c4a882]/70" : ""}`}>
                      {mod.icon}
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-[13px] md:text-[15px] tracking-[0.1em] uppercase font-semibold leading-tight transition-colors duration-300 ${
                          mod.active ? "text-white/80 group-hover:text-white" : "text-white/20"
                        }`}
                        style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
                      >
                        {mod.title}
                      </p>
                      <p className={`text-[10px] md:text-[11px] leading-tight mt-0.5 transition-colors duration-300 ${
                        mod.active ? "text-[#a89880]/40 group-hover:text-[#a89880]/60" : "text-white/10"
                      }`}>
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                );

                return mod.active ? (
                  <Link key={mod.title} to={mod.href} className="flex-1">{inner}</Link>
                ) : (
                  <div key={mod.title} className="flex-1">{inner}</div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── TRANSITION ─── */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#a89880]/15 to-transparent" />

        {/* ─── POST UPDATE + FEED ─── */}
        <section className="bg-background py-8 md:py-12">
          <div className="max-w-[860px] mx-auto px-5 md:px-8">

            {/* Post update bar */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 flex items-center gap-3 px-5 py-3.5 bg-[#1a1714]/60 border border-[#a89880]/10 rounded-sm">
                <div className="w-8 h-8 rounded-full bg-[#a89880]/8 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs text-[#a89880]/40">👤</span>
                </div>
                <p className="text-sm text-[#a89880]/35">
                  Hva tenker du på i dag? Del et bilde eller en oppdatering...
                </p>
              </div>
              <Link
                to={user ? "/dashboard" : "/login?returnUrl=/dashboard"}
                className="flex items-center gap-2 px-5 py-3.5 bg-[#c4a882] text-[#0f0d0b] text-sm font-semibold tracking-wide hover:bg-[#d4b892] transition-colors flex-shrink-0"
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
