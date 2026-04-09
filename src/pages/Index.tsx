import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Plus, Car, ShoppingBag, CalendarDays, Users, Building2 } from "lucide-react";
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
const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

const modules = [
  { href: "/biler", title: "Biler", desc: "Historier og profiler", icon: Car, createUrl: "/send-inn", createLabel: "Send inn din bil" },
  { href: "/markedsplass", title: "Markedsplass", desc: "Kjøp & salg", icon: ShoppingBag, createUrl: "/dashboard/opprett-annonse", createLabel: "Legg ut annonse" },
  { href: "/arrangement", title: "Arrangementer", desc: "Treff & samlinger", icon: CalendarDays, createUrl: "/dashboard/events/ny", createLabel: "Opprett arrangement" },
  { href: "/klubber", title: "Klubber", desc: "Bilklubber & foreninger", icon: Users, createUrl: "/dashboard/sider/ny", createLabel: "Registrer klubb" },
  { href: "/aktoerer", title: "Aktører", desc: "Verksteder & bedrifter", icon: Building2, createUrl: "/dashboard/sider/ny", createLabel: "Opprett side" },
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

      <div className="min-h-[calc(100vh-4rem)]">

        {/* ─── HERO (split layout) ─── */}
        <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3a2e24 0%, #2a2118 40%, #1e1812 100%)' }}>
          {/* Subtle vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)' }} />
          {/* Warm glow behind car */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 70% 45%, rgba(255,180,80,0.18) 0%, transparent 55%)' }} />

          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex flex-col md:flex-row items-center md:items-stretch min-h-[200px] sm:min-h-[220px] md:min-h-[260px]">

              {/* LEFT — branding + title + search */}
              <div className="flex-1 flex flex-col justify-center py-6 sm:py-8 md:py-10 md:pr-8 lg:pr-12 text-center md:text-left max-w-[520px] md:max-w-none">
                <p className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase mb-1 sm:mb-1.5"
                  style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  bilgarasje.no
                </p>
                <h1
                  className="text-[1.4rem] sm:text-[1.8rem] md:text-[2.2rem] lg:text-[2.6rem] leading-[0.95] uppercase tracking-[0.02em] text-white font-bold italic"
                  style={{ ...chakra, textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}
                >
                  Hele Norges<br />bilsamfunn
                </h1>
                <p
                  className="text-[0.7rem] sm:text-[0.85rem] md:text-[1rem] uppercase tracking-[0.15em] text-white/60 font-bold italic mt-0.5 sm:mt-1"
                  style={chakra}
                >
                  — på nett
                </p>

                <div className="mt-4 sm:mt-5 w-full max-w-[480px] mx-auto md:mx-0">
                  <HeroSearch />
                </div>
              </div>

              {/* RIGHT — car image with fade mask */}
              <div className="hidden md:flex items-end justify-end flex-shrink-0 w-[45%] lg:w-[50%] relative">
                <img
                  src={heroCar}
                  alt="Klassisk bil"
                  className="w-full h-auto max-h-[240px] lg:max-h-[280px] object-contain object-bottom"
                  style={{
                    WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 95%)',
                    maskImage: 'linear-gradient(to left, black 50%, transparent 95%)',
                    filter: 'drop-shadow(0 8px 30px rgba(0,0,0,0.4))',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom fade into modules */}
          <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: 'linear-gradient(to top, #e8e0d4, transparent)' }} />
        </section>

        {/* ─── MODULES ─── */}
        <section className="py-5 sm:py-7 md:py-9" style={{ background: 'linear-gradient(180deg, #e8e0d4 0%, #dfd5c7 50%, #d8cebf 100%)' }}>
          <div className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            {/* Mobile: horizontal scroll */}
            <div className="flex gap-2.5 overflow-x-auto scrollbar-hide -mx-1 px-1 md:hidden">
              {modules.map((mod) => {
                const ModIcon = mod.icon;
                return (
                  <Link key={mod.title} to={mod.href} className="group flex-shrink-0 w-[120px]">
                    <div className="flex flex-col items-center gap-2 py-3 px-2 rounded-lg bg-white/60 border border-[#c4962c]/10 hover:border-[#c4962c]/30 transition-all">
                      <ModIcon className="w-7 h-7 text-[#8b6914] group-active:scale-110 transition-transform" strokeWidth={1.5} />
                      <p className="text-[12px] tracking-[0.06em] uppercase font-bold text-[#3a2e24] leading-tight text-center" style={chakra}>
                        {mod.title}
                      </p>
                      {mod.comingSoon && (
                        <span className="text-[8px] tracking-[0.1em] uppercase text-[#c4962c] font-bold" style={oswald}>Snart</span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop: 5-col icon cards */}
            <div className="hidden md:grid md:grid-cols-5 gap-4">
              {modules.map((mod) => {
                const ModIcon = mod.icon;
                const createHref = user
                  ? mod.createUrl
                  : `/login?returnUrl=${encodeURIComponent(mod.createUrl)}`;
                return (
                  <div key={mod.title} className="group relative">
                    <Link to={mod.href}>
                      <div className="flex flex-col items-center gap-3 py-5 px-3 rounded-xl bg-white/50 border border-[#c4962c]/10 hover:border-[#c4962c]/30 hover:bg-white/70 hover:shadow-lg hover:shadow-[#c4962c]/5 transition-all duration-300">
                        <ModIcon className="w-9 h-9 lg:w-10 lg:h-10 text-[#8b6914] group-hover:text-[#c4962c] transition-colors duration-300" strokeWidth={1.5} />
                        <div className="text-center">
                          <p className="text-[15px] lg:text-[17px] tracking-[0.06em] uppercase font-bold text-[#3a2e24] leading-tight" style={chakra}>
                            {mod.title}
                          </p>
                          <p className="text-[11px] text-[#3a2e24]/50 mt-0.5" style={chakra}>
                            {mod.desc}
                          </p>
                        </div>
                        {mod.comingSoon && (
                          <span className="text-[9px] tracking-[0.1em] uppercase text-[#c4962c] font-bold" style={oswald}>Kommer snart</span>
                        )}
                      </div>
                    </Link>

                    {!mod.comingSoon && (
                      <Link
                        to={createHref}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1 px-2 py-1 bg-[#3a2e24]/80 backdrop-blur-sm border border-[#c4962c]/20 text-white/80 hover:text-white text-[9px] uppercase tracking-[0.15em] font-bold z-10 rounded"
                        style={chakra}
                      >
                        <Plus className="w-3 h-3" />
                        {user ? "Opprett" : "Logg inn"}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── FEED ─── */}
        <section className="pt-2 sm:pt-6 md:pt-8 pb-12 sm:pb-20 md:pb-32" style={{ background: 'linear-gradient(180deg, #d8cebf 0%, #cfc4b3 30%, #c8bbaa 100%)' }}>
          <div className="max-w-[1000px] mx-auto px-4 sm:px-5 md:px-8">

            <div className="mb-6 sm:mb-10">
              <h2 className="text-[1.6rem] sm:text-[2.2rem] md:text-[3rem] uppercase text-[#3a2e24] font-bold leading-[1] tracking-[0.06em] mb-4 sm:mb-6"
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
                    <div className="h-[280px] sm:h-[420px] bg-[#3a2e24]/[0.06] rounded-lg animate-pulse" />
                    <div className="h-px bg-[#3a2e24]/[0.08] mt-8 sm:mt-12" />
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
                      <div className="h-px bg-[#3a2e24]/[0.1] my-8 sm:my-12" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!feedLoading && filteredPosts.length === 0 && (
              <div className="py-12 sm:py-24 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#3a2e24]/[0.06] flex items-center justify-center">
                  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1" className="w-8 h-8 text-[#3a2e24]/20">
                    <path d="M5 21l3-7h16l3 7" strokeLinecap="round" strokeLinejoin="round"/>
                    <rect x="3" y="21" width="26" height="5" rx="1"/>
                    <circle cx="9" cy="26" r="2"/><circle cx="23" cy="26" r="2"/>
                  </svg>
                </div>
                <p className="text-[1.2rem] sm:text-[1.6rem] uppercase text-[#3a2e24]/30 font-bold tracking-[0.08em]"
                  style={oswald}>
                  {feedFilter === "alle" ? "Ingen oppdateringer enda" : "Ingen treff i denne kategorien"}
                </p>
                <p className="text-[13px] text-[#3a2e24]/25 mt-1.5">
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
