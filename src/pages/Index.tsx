import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import heroCar from "@/assets/hero-car.jpg";

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
        <title>Bilgarasje.no — Hele Norges bilsamfunn — på nett</title>
        <meta name="description" content="Utforsk norske biler og deres historie. Biler, markedsplass, arrangementer og mer." />
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)]">

        {/* ─── SEARCH BAR — centered above hero ─── */}
        <section className="relative z-10 bg-[#0a0a0a] pt-5 pb-3">
          <div className="max-w-[420px] mx-auto px-5">
            <GlobalSearch />
          </div>
        </section>

        {/* ─── HERO ─── */}
        <section className="relative bg-[#0a0a0a] overflow-hidden">
          <div className="max-w-[1100px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.4fr] items-end gap-0 md:gap-8">
              {/* Left: Title */}
              <div className="py-6 md:py-10">
                <p className="text-[9px] md:text-[10px] tracking-[0.4em] uppercase text-white/20 mb-3">
                  bilgarasje.no
                </p>
                <h1 className="font-display text-[1.8rem] sm:text-[2.2rem] md:text-[2.8rem] leading-[1.05] uppercase tracking-wider text-white/90 whitespace-nowrap">
                  Hele Norges bilsamfunn <span className="text-white/35">— på nett</span>
                </h1>
              </div>

              {/* Right: Full landscape image */}
              <div className="relative">
                <img
                  src={heroCar}
                  alt="Klassisk Porsche 911 i garasje"
                  className="w-full h-auto object-contain"
                />
                {/* Left fade into bg */}
                <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
              </div>
            </div>
          </div>
        </section>

        {/* ─── MODULE ROW — separated by lines ─── */}
        <section className="bg-[#0a0a0a] pt-6 pb-10 md:pb-14">
          <div className="max-w-[1100px] mx-auto px-5 md:px-8">
            {/* Top line */}
            <div className="h-px bg-white/[0.08] mb-1" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
              {modules.map((mod, i) => {
                const inner = (
                  <div
                    className={`relative flex flex-col items-center text-center py-6 md:py-8 transition-all duration-300 group ${
                      mod.active
                        ? "hover:bg-white/[0.02] cursor-pointer"
                        : "opacity-30 cursor-default"
                    }`}
                  >
                    {!mod.active && (
                      <span className="absolute top-2 right-2 text-[7px] tracking-[0.2em] uppercase text-white/30">
                        Snart
                      </span>
                    )}
                    <div className={`text-white/40 mb-3 transition-colors duration-300 ${mod.active ? "group-hover:text-white/80" : ""}`}>
                      {mod.icon}
                    </div>
                    <p className={`text-sm md:text-[15px] tracking-[0.04em] uppercase font-semibold mb-1 transition-colors duration-300 ${
                      mod.active ? "text-white/80 group-hover:text-white" : "text-white/30"
                    }`}>
                      {mod.title}
                    </p>
                    <p className="text-[10px] md:text-[11px] text-white/25 leading-relaxed">
                      {mod.desc}
                    </p>
                  </div>
                );

                const wrapperClass = i < modules.length - 1
                  ? "border-r border-white/[0.06]"
                  : "";

                return mod.active ? (
                  <Link key={mod.title} to={mod.href} className={wrapperClass}>
                    {inner}
                  </Link>
                ) : (
                  <div key={mod.title} className={wrapperClass}>{inner}</div>
                );
              })}
            </div>
            {/* Bottom line */}
            <div className="h-px bg-white/[0.08] mt-1" />
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
