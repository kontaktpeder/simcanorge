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

        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #3a2e24 0%, #2a2118 40%, #1e1812 100%)' }}>
          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 30% 50%, transparent 40%, rgba(0,0,0,0.35) 100%)' }} />
          {/* Warm glow behind car */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 75% 50%, rgba(255,180,80,0.2) 0%, transparent 50%)' }} />

          {/* Car image — fills right side, fades into background */}
          <div className="absolute inset-0 pointer-events-none hidden md:block">
            <img
              src={heroCar}
              alt=""
              className="absolute right-0 bottom-0 h-full w-[65%] object-contain object-right-bottom"
              style={{
                WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 85%), linear-gradient(to top, black 70%, transparent 100%)',
                WebkitMaskComposite: 'intersect',
                maskImage: 'linear-gradient(to left, black 30%, transparent 85%), linear-gradient(to top, black 70%, transparent 100%)',
                maskComposite: 'intersect',
                filter: 'drop-shadow(0 4px 40px rgba(0,0,0,0.3))',
                opacity: 0.9,
              }}
            />
          </div>

          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex flex-col justify-center min-h-[200px] sm:min-h-[230px] md:min-h-[280px] py-8 md:py-10 md:max-w-[50%]">
              <p className="text-[10px] sm:text-[11px] tracking-[0.3em] uppercase mb-1.5"
                style={{ ...oswald, fontWeight: 500, background: 'linear-gradient(135deg, #F5A623, #FFD166)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                bilgarasje.no
              </p>
              <h1
                className="text-[1.5rem] sm:text-[1.9rem] md:text-[2.4rem] lg:text-[2.8rem] leading-[0.93] uppercase tracking-[0.02em] text-white font-bold italic"
                style={{ ...chakra, textShadow: '0 2px 20px rgba(0,0,0,0.6)' }}
              >
                Hele Norges<br />bilsamfunn
              </h1>
              <p
                className="text-[0.7rem] sm:text-[0.85rem] md:text-[1rem] uppercase tracking-[0.15em] text-white/55 font-bold italic mt-0.5"
                style={chakra}
              >
                — på nett
              </p>

              <div className="mt-5 w-full max-w-[480px]">
                <HeroSearch />
              </div>
            </div>
          </div>
        </section>

        {/* ─── CATEGORY NAV ─── */}
        <nav
          className="border-b"
          style={{ background: 'linear-gradient(180deg, #e8e0d4 0%, #ebe3d8 100%)', borderColor: 'rgba(58,46,36,0.08)' }}
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            {/* Mobile: scroll */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide -mx-1 px-1 md:hidden py-2.5">
              {modules.map((mod) => {
                const ModIcon = mod.icon;
                return (
                  <Link key={mod.title} to={mod.href} className="group flex-shrink-0">
                    <div className="flex items-center gap-2 py-2 px-3 rounded-full bg-white/50 border border-[#c4962c]/10 hover:border-[#c4962c]/25 active:scale-[0.97] transition-all">
                      <ModIcon className="w-4 h-4 text-[#8b6914]" strokeWidth={1.8} />
                      <span className="text-[11px] tracking-[0.04em] uppercase font-bold text-[#3a2e24] whitespace-nowrap" style={chakra}>
                        {mod.title}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Desktop: even row */}
            <div className="hidden md:flex items-stretch">
              {modules.map((mod, i) => {
                const ModIcon = mod.icon;
                const createHref = user
                  ? mod.createUrl
                  : `/login?returnUrl=${encodeURIComponent(mod.createUrl)}`;
                return (
                  <div
                    key={mod.title}
                    className="group relative flex-1"
                    style={i < modules.length - 1 ? { borderRight: '1px solid rgba(58,46,36,0.06)' } : undefined}
                  >
                    <Link
                      to={mod.href}
                      className="flex items-center justify-center gap-2.5 py-3.5 hover:bg-white/40 transition-colors duration-200"
                    >
                      <ModIcon className="w-5 h-5 text-[#8b6914] group-hover:text-[#c4962c] transition-colors" strokeWidth={1.6} />
                      <div className="flex flex-col">
                        <span className="text-[13px] lg:text-[14px] tracking-[0.05em] uppercase font-bold text-[#3a2e24] leading-tight" style={chakra}>
                          {mod.title}
                        </span>
                        <span className="text-[10px] text-[#3a2e24]/40 leading-tight" style={chakra}>
                          {mod.desc}
                        </span>
                      </div>
                    </Link>

                    {/* Create chip on hover */}
                    <Link
                      to={createHref}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-0.5 px-1.5 py-0.5 bg-[#3a2e24]/70 backdrop-blur-sm text-white/80 hover:text-white text-[8px] uppercase tracking-[0.12em] font-bold rounded"
                      style={chakra}
                    >
                      <Plus className="w-2.5 h-2.5" />
                      {user ? "Ny" : "Logg inn"}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </nav>

        {/* ─── FEED (scrolls right in) ─── */}
        <section
          className="pt-6 sm:pt-8 md:pt-10 pb-12 sm:pb-20 md:pb-32"
          style={{ background: 'linear-gradient(180deg, #ebe3d8 0%, #e2d9cc 40%, #dbd0c2 100%)' }}
        >
          <div className="max-w-[1000px] mx-auto px-4 sm:px-5 md:px-8">

            <div className="flex items-end justify-between mb-5 sm:mb-7">
              <FeedFilterTabs active={feedFilter} onChange={setFeedFilter} />
            </div>

            <div className="mb-6 sm:mb-10">
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
