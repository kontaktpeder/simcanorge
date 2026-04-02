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
    title: "Marked",
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
    desc: "Treff",
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
    desc: "Snart",
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
    desc: "Snart",
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

        {/* ─── MAIN HERO COMPOSITION ─── */}
        <section className="relative overflow-hidden">
          {/* Background image — portrait, right-aligned, tall */}
          <div className="absolute top-0 right-0 bottom-0 w-[55%] md:w-[52%]">
            <img
              src={heroCar}
              alt="Porsche 911 i garasje"
              className="w-full h-full object-cover object-[center_40%]"
            />
            {/* Fade left */}
            <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
            {/* Fade bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
            {/* Fade top */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#0a0a0a]/60 to-transparent" />
          </div>

          {/* Content overlay */}
          <div className="relative z-10 max-w-[1100px] mx-auto px-5 md:px-8">
            {/* Search */}
            <div className="pt-6 pb-8 max-w-[380px]">
              <GlobalSearch />
            </div>

            {/* Title — left column, vertically centered */}
            <div className="pb-10 md:pb-14 max-w-[50%]">
              <p className="text-[9px] tracking-[0.4em] uppercase text-white/20 mb-3">
                bilgarasje.no
              </p>
              <h1 className="font-display text-[2rem] sm:text-[2.6rem] md:text-[3.2rem] leading-[1.05] uppercase tracking-wider text-white/90">
                Hele Norges bilsamfunn
              </h1>
              <p className="font-display text-[1.2rem] sm:text-[1.5rem] md:text-[1.8rem] uppercase tracking-[0.15em] text-white/25 mt-1">
                — på nett
              </p>
            </div>

            {/* Modules — inline row along bottom */}
            <div className="pb-8 md:pb-12">
              <div className="flex items-stretch overflow-x-auto -mx-1">
                {modules.map((mod, i) => {
                  const inner = (
                    <div
                      className={`flex items-center gap-3 px-4 md:px-5 py-3 whitespace-nowrap transition-all duration-300 group ${
                        mod.active
                          ? "cursor-pointer"
                          : "opacity-25 cursor-default"
                      }`}
                    >
                      <div className={`text-white/35 transition-colors duration-300 ${mod.active ? "group-hover:text-white/70" : ""}`}>
                        {mod.icon}
                      </div>
                      <div>
                        <p className={`text-[13px] md:text-sm tracking-[0.04em] uppercase font-semibold leading-tight transition-colors duration-300 ${
                          mod.active ? "text-white/75 group-hover:text-white" : "text-white/25"
                        }`}>
                          {mod.title}
                        </p>
                        <p className="text-[9px] md:text-[10px] text-white/20 leading-tight mt-0.5">
                          {mod.desc}
                        </p>
                      </div>
                    </div>
                  );

                  const separator = i < modules.length - 1 ? (
                    <div className="w-px self-stretch bg-white/[0.08] my-2" />
                  ) : null;

                  return (
                    <div key={mod.title} className="flex items-stretch">
                      {mod.active ? (
                        <Link to={mod.href}>{inner}</Link>
                      ) : (
                        <div>{inner}</div>
                      )}
                      {separator}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Minimum height to let the car image breathe */}
          <div className="h-[520px] sm:h-[560px] md:h-[600px]" />
        </section>

        {/* ─── TRANSITION ─── */}
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
