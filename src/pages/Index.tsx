import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { useAuth } from "@/hooks/useAuth";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { FeedCard } from "@/components/feed/FeedCard";
import { HomeFeedComposer } from "@/components/feed/HomeFeedComposer";
import { HeroSearch } from "@/components/layout/HeroSearch";
import { FeedFilterTabs, type FeedFilter } from "@/components/feed/FeedFilterTabs";
import heroCar from "@/assets/hero-car.jpg";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;

const modules = [
  {
    href: "/biler",
    title: "Biler",
    desc: "Historier og profiler",
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
    href: "/aktoerer",
    title: "Klubber",
    desc: "Kommer snart",
    icon: (
      <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.3" className="w-6 h-6">
        <circle cx="12" cy="11" r="4"/><circle cx="22" cy="13" r="3"/>
        <path d="M4 27c0-5 4-8 8-8s8 3 8 8" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    href: "/aktoerer",
    title: "Aktører",
    desc: "Verksteder & bedrifter",
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
  const [feedFilter, setFeedFilter] = useState<FeedFilter>("alle");

  const filteredPosts = useMemo(() => {
    if (!feedPosts) return [];
    if (feedFilter === "alle") return feedPosts;
    if (feedFilter === "biler") return feedPosts.filter((p) => p.car != null);
    if (feedFilter === "marked") return feedPosts.filter((p) => p.marketplace_item != null);
    if (feedFilter === "arrangementer") return feedPosts.filter((p) => p.event != null);
    return feedPosts;
  }, [feedPosts, feedFilter]);

  return (
    <Layout>
      <Helmet>
        <title>Bilgarasje.no — Hele Norges bilsamfunn på nett</title>
        <meta name="description" content="Utforsk norske biler og deres historie. Biler, markedsplass, arrangementer og mer." />
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)] bg-[#111315]">

        {/* ─── HERO with search ─── */}
        <section className="relative overflow-hidden h-[260px] sm:h-[320px] md:h-[380px]">
          <img
            src={heroCar}
            alt="Simca 1000 Rallye racerbil"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#111315] via-[#111315]/70 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-28 sm:h-32 bg-gradient-to-t from-[#111315] to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#111315]/50 to-transparent" />

          <div className="relative z-10 h-full flex flex-col justify-end pb-8 sm:justify-center sm:pb-0 max-w-[1200px] mx-auto px-5 md:px-8">
            <p className="text-[12px] sm:text-[16px] tracking-[0.3em] uppercase mb-1 sm:mb-2"
              style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              bilgarasje.no
            </p>
            <h1
              className="text-[2rem] sm:text-[3.2rem] md:text-[4.2rem] leading-[0.95] uppercase tracking-[0.02em] sm:tracking-[0.04em] text-white font-bold italic"
              style={{ fontFamily: "'Chakra Petch', 'Oswald', sans-serif" }}
            >
              Hele Norges bilsamfunn
            </h1>
            <p
              className="text-[0.95rem] sm:text-[1.5rem] md:text-[1.8rem] uppercase tracking-[0.12em] sm:tracking-[0.18em] text-white/80 font-bold italic mt-0.5 sm:mt-1"
              style={{ fontFamily: "'Chakra Petch', 'Oswald', sans-serif" }}
            >
              — på nett
            </p>

            {/* Hero search */}
            <div className="mt-4 sm:mt-6">
              <HeroSearch />
            </div>
          </div>
        </section>

        {/* ─── MODULES ─── */}
        <section className="bg-[#111315]">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            {/* Mobile: compact grid */}
            <div className="grid grid-cols-2 gap-px border-t border-white/[0.06] md:hidden">
              {modules.map((mod) => (
                <Link key={mod.title} to={mod.href} className="border-b border-white/[0.04]">
                  <div className="flex flex-col items-center gap-1.5 py-4 px-2 text-center group active:bg-white/[0.04] transition-colors">
                    <div className="text-[#b0b7bd]">{mod.icon}</div>
                    <p className="text-[11px] tracking-[0.08em] uppercase font-bold text-white leading-tight"
                      style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                      {mod.title}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
            {/* Desktop row */}
            <div className="hidden md:flex border-t border-white/[0.06]">
              {modules.map((mod, i) => (
                <Link key={mod.title} to={mod.href} className="flex-1">
                  <div
                    className={`flex items-center gap-3 py-7 justify-center transition-all duration-300 group cursor-pointer hover:bg-white/[0.03] ${
                      i < modules.length - 1 ? "border-r border-white/[0.06]" : ""
                    }`}
                  >
                    <div className="transition-colors duration-300 text-[#b0b7bd] group-hover:text-[#d4af37]">
                      {mod.icon}
                    </div>
                    <div className="text-left">
                      <p className="text-[18px] tracking-[0.06em] uppercase font-bold leading-tight transition-colors duration-300 text-white group-hover:text-white"
                        style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                        {mod.title}
                      </p>
                      <p className="text-[13px] leading-tight mt-1 transition-colors duration-300 text-[#b0b7bd]/70 group-hover:text-[#b0b7bd]"
                        style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEED ─── */}
        <section className="pt-8 sm:pt-16 md:pt-24 pb-12 sm:pb-20 md:pb-32 bg-[#111315]">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-5 md:px-8">

            {/* Section header + filter tabs */}
            <div className="mb-6 sm:mb-10">
              <h2 className="text-[1.6rem] sm:text-[2.2rem] md:text-[3rem] uppercase text-white font-bold leading-[1] tracking-[0.06em] mb-4 sm:mb-6"
                style={oswald}>
                Oppdateringer
              </h2>
              <FeedFilterTabs active={feedFilter} onChange={setFeedFilter} />
            </div>

            {/* Composer */}
            <div className="mb-8 sm:mb-14">
              <HomeFeedComposer />
            </div>

            {/* Feed */}
            {feedLoading && (
              <div className="space-y-8 sm:space-y-12">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="h-[280px] sm:h-[420px] bg-white/[0.02] animate-pulse" />
                    <div className="h-px bg-white/[0.04] mt-8 sm:mt-12" />
                  </div>
                ))}
              </div>
            )}

            {!feedLoading && filteredPosts.length > 0 && (
              <div>
                {filteredPosts.map((post, i) => (
                  <div key={post.id}>
                    <FeedCard post={post} />
                    {i < filteredPosts.length - 1 && (
                      <div className="h-px bg-white/[0.06] my-8 sm:my-12" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!feedLoading && filteredPosts.length === 0 && (
              <div className="py-12 sm:py-24 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/[0.03] flex items-center justify-center">
                  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-white/15">
                    <path d="M5 21l3-7h16l3 7" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="3" y="21" width="26" height="5" rx="1"/>
                    <circle cx="9" cy="26" r="2"/><circle cx="23" cy="26" r="2"/>
                  </svg>
                </div>
                <p className="text-[1.2rem] sm:text-[1.6rem] uppercase text-white/20 font-bold tracking-[0.08em]"
                  style={oswald}>
                  {feedFilter === "alle" ? "Ingen oppdateringer enda" : "Ingen treff i denne kategorien"}
                </p>
                <p className="text-[13px] text-white/[0.12] mt-1.5">
                  {feedFilter === "alle" ? "Bli den første til å dele noe" : "Prøv en annen kategori"}
                </p>
                {!user && feedFilter === "alle" && (
                  <Link to="/login"
                    className="inline-block mt-5 text-[12px] uppercase tracking-[0.2em] text-[#c8102e] hover:text-[#e01830] font-bold transition-colors border-b border-[#c8102e]/30 hover:border-[#c8102e]/60 pb-0.5"
                    style={oswald}>
                    Logg inn for å starte →
                  </Link>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}
