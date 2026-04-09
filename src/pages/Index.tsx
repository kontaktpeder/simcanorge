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
import moduleBiler from "@/assets/module-biler.jpg";
import moduleMarkedsplass from "@/assets/module-markedsplass.jpg";
import moduleArrangementer from "@/assets/module-arrangementer.jpg";
import moduleKlubber from "@/assets/module-klubber.jpg";
import moduleAktoerer from "@/assets/module-aktoerer.jpg";

const oswald = { fontFamily: "'Oswald', 'Impact', sans-serif" } as const;
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const modules = [
  { href: "/biler", title: "Biler", desc: "Historier og profiler", image: moduleBiler },
  { href: "/markedsplass", title: "Markedsplass", desc: "Kjøp & salg", image: moduleMarkedsplass },
  { href: "/arrangement", title: "Arrangementer", desc: "Treff & samlinger", image: moduleArrangementer },
  { href: "/aktoerer", title: "Klubber", desc: "Kommer snart", image: moduleKlubber, comingSoon: true },
  { href: "/aktoerer", title: "Aktører", desc: "Verksteder & bedrifter", image: moduleAktoerer },
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

      <div className="min-h-[calc(100vh-4rem)]" style={{ background: 'linear-gradient(180deg, #f0ebe3 0%, #e8e2d8 40%, #e4ddd3 100%)' }}>

        {/* ─── HERO (compact) ─── */}
        <section className="relative overflow-hidden h-[180px] sm:h-[200px] md:h-[220px]">
          <img
            src={heroCar}
            alt="Klassisk bil"
            className="absolute inset-0 w-full h-full object-cover object-[center_35%] brightness-110"
          />
          <div className="absolute inset-0 bg-[#1a1a1a]/50" />
          <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: 'linear-gradient(to top, #f0ebe3, transparent)' }} />

          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center max-w-[800px] mx-auto px-5 md:px-8">
            <p className="text-[10px] sm:text-[12px] tracking-[0.3em] uppercase mb-0.5 sm:mb-1"
              style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              bilgarasje.no
            </p>
            <h1
              className="text-[1.5rem] sm:text-[2.2rem] md:text-[2.8rem] leading-[0.95] uppercase tracking-[0.02em] sm:tracking-[0.04em] text-white font-bold italic"
              style={{ ...chakra, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}
            >
              Hele Norges bilsamfunn
            </h1>
            <p
              className="text-[0.75rem] sm:text-[1rem] md:text-[1.2rem] uppercase tracking-[0.12em] sm:tracking-[0.18em] text-white/80 font-bold italic mt-0.5"
              style={{ ...chakra, textShadow: '0 1px 8px rgba(0,0,0,0.4)' }}
            >
              — på nett
            </p>

            <div className="mt-3 sm:mt-5 w-full max-w-[560px]">
              <HeroSearch />
            </div>
          </div>
        </section>

        {/* ─── MODULES ─── */}
        <section className="py-4 sm:py-6 md:py-8">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            {/* Mobile: compact horizontal scroll */}
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1 md:hidden">
              {modules.map((mod) => (
                <Link key={mod.title} to={mod.href} className="group relative flex-shrink-0 w-[140px]">
                  <div className="relative overflow-hidden rounded-lg shadow-lg border border-[#c4962c]/20 hover:border-[#c4962c]/50 transition-all duration-300">
                    <img src={mod.image} alt={mod.title} className="w-full h-[90px] object-cover group-active:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-[11px] tracking-[0.06em] uppercase font-bold text-white leading-tight" style={chakra}>
                        {mod.title}
                      </p>
                      {mod.comingSoon && (
                        <span className="text-[8px] tracking-[0.1em] uppercase text-[#c4962c] font-bold" style={oswald}>Kommer snart</span>
                      )}
                    </div>
                    <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-[#c4962c]/15 pointer-events-none" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop: 5-col row — compact */}
            <div className="hidden md:grid md:grid-cols-5 gap-3">
              {modules.map((mod) => (
                <Link key={mod.title} to={mod.href} className="group relative">
                  <div className="relative overflow-hidden rounded-xl shadow-lg border border-[#c4962c]/20 hover:border-[#c4962c]/50 hover:shadow-xl hover:shadow-[#c4962c]/10 transition-all duration-500">
                    <img src={mod.image} alt={mod.title} className="w-full h-[130px] lg:h-[150px] object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/5" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-[15px] tracking-[0.06em] uppercase font-bold text-white leading-tight" style={chakra}>
                        {mod.title}
                      </p>
                      <p className="text-[11px] text-white/55 mt-0.5" style={chakra}>
                        {mod.desc}
                      </p>
                    </div>
                    <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-[#c4962c]/20 pointer-events-none" />
                    <div className="absolute -inset-px rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{ boxShadow: 'inset 0 0 20px rgba(196, 150, 44, 0.15), 0 0 30px rgba(196, 150, 44, 0.08)' }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FEED ─── */}
        <section className="pt-4 sm:pt-10 md:pt-16 pb-12 sm:pb-20 md:pb-32">
          <div className="max-w-[1000px] mx-auto px-4 sm:px-5 md:px-8">

            <div className="mb-6 sm:mb-10">
              <h2 className="text-[1.6rem] sm:text-[2.2rem] md:text-[3rem] uppercase text-[#1a1a1a] font-bold leading-[1] tracking-[0.06em] mb-4 sm:mb-6"
                style={oswald}>
                Oppdateringer
              </h2>
              <FeedFilterTabs active={feedFilter} onChange={setFeedFilter} />
            </div>

            <div className="mb-8 sm:mb-14">
              <HomeFeedComposer />
            </div>

            {feedLoading && (
              <div className="space-y-8 sm:space-y-12">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="h-[280px] sm:h-[420px] bg-[#1a1a1a]/[0.04] rounded-lg animate-pulse" />
                    <div className="h-px bg-[#1a1a1a]/[0.06] mt-8 sm:mt-12" />
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
                      <div className="h-px bg-[#1a1a1a]/[0.08] my-8 sm:my-12" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!feedLoading && filteredPosts.length === 0 && (
              <div className="py-12 sm:py-24 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a1a1a]/[0.05] flex items-center justify-center">
                  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-[#1a1a1a]/15">
                    <path d="M5 21l3-7h16l3 7" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="3" y="21" width="26" height="5" rx="1"/>
                    <circle cx="9" cy="26" r="2"/><circle cx="23" cy="26" r="2"/>
                  </svg>
                </div>
                <p className="text-[1.2rem] sm:text-[1.6rem] uppercase text-[#1a1a1a]/25 font-bold tracking-[0.08em]"
                  style={oswald}>
                  {feedFilter === "alle" ? "Ingen oppdateringer enda" : "Ingen treff i denne kategorien"}
                </p>
                <p className="text-[13px] text-[#1a1a1a]/20 mt-1.5">
                  {feedFilter === "alle" ? "Bli den første til å dele noe" : "Prøv en annen kategori"}
                </p>
                {!user && feedFilter === "alle" && (
                  <Link to="/login"
                    className="inline-block mt-5 text-[12px] uppercase tracking-[0.2em] text-[#c4962c] hover:text-[#a07820] font-bold transition-colors border-b border-[#c4962c]/30 hover:border-[#c4962c]/60 pb-0.5"
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
