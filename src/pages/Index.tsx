import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { FeedCard } from "@/components/feed/FeedCard";
import { HomeFeedComposer } from "@/components/feed/HomeFeedComposer";
import heroCar from "@/assets/hero-car.jpg";

const modules = [
  {
    href: "/biler",
    title: "Biler",
    desc: "Historier og profiler",
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
    title: "Arrangementer",
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
  const { data: feedPosts, isLoading: feedLoading } = useFeedPosts();

  return (
    <Layout>
      <Helmet>
        <title>Bilgarasje.no — Hele Norges bilsamfunn på nett</title>
        <meta name="description" content="Utforsk norske biler og deres historie. Biler, markedsplass, arrangementer og mer." />
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)] bg-[#111315]">

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden h-[280px] sm:h-[320px] md:h-[360px]">
          <img
            src={heroCar}
            alt="Simca 1000 Rallye racerbil"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
          {/* Softer overlays — more cinematic, less wall */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#111315] via-[#111315]/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-[#111315] to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#111315]/40 to-transparent" />

          <div className="relative z-10 h-full flex flex-col justify-center max-w-[1200px] mx-auto px-5 md:px-8">
            <p className="text-[11px] sm:text-xs text-[#c4a882]/70 tracking-[0.3em] uppercase mb-2"
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
              className="text-[1.1rem] sm:text-[1.5rem] md:text-[1.8rem] uppercase tracking-[0.25em] text-[#c4a882]/60 mt-1"
              style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif", fontWeight: 400 }}
            >
              — på nett
            </p>
            <p className="text-[12px] sm:text-sm text-white/50 mt-3 tracking-[0.05em]">
              Se oppdateringer fra norske bilentusiaster
            </p>
          </div>
        </section>

        {/* ─── MODULES ─── */}
        <section className="bg-[#111315]">
          <div className="max-w-[1200px] mx-auto px-5 md:px-8">
            <div className="flex border-t border-white/[0.06]">
              {modules.map((mod, i) => {
                const inner = (
                  <div
                    className={`flex-1 flex items-center justify-center gap-3 py-6 md:py-7 text-center transition-all duration-300 group ${
                      mod.active ? "cursor-pointer hover:bg-white/[0.03]" : "opacity-25 cursor-default"
                    } ${i < modules.length - 1 ? "border-r border-white/[0.06]" : ""}`}
                  >
                    <div className={`transition-colors duration-300 ${mod.active ? "text-[#b0b7bd] group-hover:text-[#d4af37]" : "text-white/20"}`}>
                      {mod.icon}
                    </div>
                    <div className="text-left">
                      <p
                        className={`text-[16px] md:text-[18px] tracking-[0.06em] uppercase font-semibold leading-tight transition-colors duration-300 ${
                          mod.active ? "text-white group-hover:text-white" : "text-white/25"
                        }`}
                        style={{ fontFamily: "'Oswald', 'Bebas Neue', sans-serif" }}
                      >
                        {mod.title}
                      </p>
                      <p className={`text-[12px] md:text-[13px] leading-tight mt-1 transition-colors duration-300 ${
                        mod.active ? "text-[#b0b7bd]/70 group-hover:text-[#b0b7bd]" : "text-white/15"
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

        {/* ─── FEED ─── */}
        <section className="pt-14 md:pt-20 pb-16 md:pb-24 bg-[#141618]">
          <div className="max-w-[960px] mx-auto px-5 md:px-8">

            {/* Composer */}
            <div className="mb-14">
              <HomeFeedComposer />
            </div>

            {/* Section title */}
            <div className="flex items-end justify-between mb-10">
              <div>
                <p
                  className="text-[10px] uppercase tracking-[0.25em] text-[#c8102e] font-semibold mb-2"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  Feed
                </p>
                <h2
                  className="text-[1.8rem] md:text-[2.2rem] text-white/95 font-bold leading-[1.1]"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  Siste oppdateringer
                </h2>
              </div>
              {!user && (
                <Link
                  to="/login"
                  className="text-[10px] uppercase tracking-[0.2em] text-white/30 hover:text-white/60 transition-colors font-semibold border-b border-white/10 hover:border-white/30 pb-0.5"
                  style={{ fontFamily: "'Oswald', sans-serif" }}
                >
                  Logg inn
                </Link>
              )}
            </div>

            {/* Thin top rule */}
            <div className="h-px bg-white/[0.08] mb-10" />

            {/* Feed posts */}
            {feedLoading && (
              <div className="space-y-10">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="h-[400px] bg-white/[0.03] animate-pulse" />
                    <div className="h-px bg-white/[0.06] mt-10" />
                  </div>
                ))}
              </div>
            )}

            {!feedLoading && feedPosts && feedPosts.length > 0 && (
              <div>
                {feedPosts.map((post, i) => (
                  <div key={post.id}>
                    <FeedCard post={post} />
                    {i < feedPosts.length - 1 && (
                      <div className="h-px bg-white/[0.06] my-10" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!feedLoading && (!feedPosts || feedPosts.length === 0) && (
              <div className="py-20 text-center">
                <p
                  className="text-[1.3rem] text-white/40 mb-2"
                  style={{ fontFamily: "'DM Serif Display', serif" }}
                >
                  Ingen oppdateringer enda
                </p>
                <p className="text-[13px] text-white/20">
                  Bli den første til å dele noe med bilsamfunnet
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
