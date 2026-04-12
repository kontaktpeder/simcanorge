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
import carSilhouette from "@/assets/car-silhouette.png";

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
        <section className="relative overflow-visible" style={{ background: 'linear-gradient(135deg, #070b10 0%, #0c1219 40%, #060a0f 100%)' }}>
          {/* Subtle teal ambient — reduced */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 800px 400px at 15% 60%, rgba(45,212,168,0.06) 0%, transparent 70%)' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle 500px at 72% 40%, rgba(45,212,168,0.07) 0%, transparent 60%)' }} />
          {/* Bottom vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 35%)' }} />

          {/* Car image — brighter, more visible */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={heroCar}
              alt=""
              className="absolute right-0 top-0 h-full w-full md:w-[62%] object-cover object-[60%_30%]"
              style={{
                WebkitMaskImage: 'linear-gradient(to left, black 50%, transparent 95%)',
                maskImage: 'linear-gradient(to left, black 50%, transparent 95%)',
                opacity: 0.6,
                filter: 'contrast(1.1) saturate(1.15)',
              }}
            />
            <div className="absolute inset-0 md:hidden" style={{ background: 'linear-gradient(to right, rgba(7,11,16,0.95) 25%, rgba(7,11,16,0.4) 100%)' }} />
          </div>

          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex flex-col justify-center min-h-[180px] sm:min-h-[260px] md:min-h-[320px] py-6 sm:py-10 md:py-12 md:max-w-[50%]">
              <p className="text-[9px] sm:text-[11px] tracking-[0.35em] uppercase mb-1.5 sm:mb-2"
                style={{ ...oswald, fontWeight: 600, background: 'linear-gradient(135deg, #2dd4a8, #00ffc8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 8px rgba(45,212,168,0.4))' }}>
                bilgarasje.no
              </p>
              <h1
                className="text-[1.4rem] sm:text-[2.1rem] md:text-[2.7rem] lg:text-[3.2rem] leading-[0.91] uppercase tracking-[0.01em] text-white font-bold italic"
                style={{ ...chakra, textShadow: '0 2px 30px rgba(0,0,0,0.6), 0 0 60px rgba(45,212,168,0.08)' }}
              >
                Hele Norges<br />bilsamfunn
              </h1>
              <p
                className="text-[0.65rem] sm:text-[0.85rem] md:text-[1rem] uppercase tracking-[0.18em] text-white/50 font-bold italic mt-1"
                style={{ ...chakra, textShadow: '0 0 20px rgba(45,212,168,0.15)' }}
              >
                — på nett
              </p>

              <div className="mt-5 sm:mt-6 w-full max-w-[480px]">
                <HeroSearch />
              </div>
            </div>
          </div>

        </section>

        {/* ─── CATEGORY NAV ─── */}
        <nav
          className="border-b relative"
          style={{ background: 'linear-gradient(180deg, #181f28 0%, #1a2230 100%)', borderColor: 'rgba(255,255,255,0.08)' }}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 10%, rgba(45,212,168,0.3) 50%, transparent 90%)' }} />

          <div className="max-w-[1200px] mx-auto px-3 sm:px-5 md:px-8">
            {/* Mobile: wrapped grid */}
            <div className="grid grid-cols-3 gap-2 md:hidden py-3">
              {modules.slice(0, 3).map((mod) => {
                const ModIcon = mod.icon;
                return (
                  <Link key={mod.title} to={mod.href} className="group">
                    <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-[#2dd4a8]/40 hover:bg-[#2dd4a8]/[0.06] active:scale-[0.97] transition-all duration-200">
                      <ModIcon className="w-5 h-5 text-[#34eab8] group-hover:text-[#5aedc4] transition-colors" strokeWidth={1.8} />
                      <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-white/80 group-hover:text-white transition-colors" style={chakra}>
                        {mod.title}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {modules.slice(3).map((mod) => {
                const ModIcon = mod.icon;
                return (
                  <Link key={mod.title} to={mod.href} className="group">
                    <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-[#2dd4a8]/40 hover:bg-[#2dd4a8]/[0.06] active:scale-[0.97] transition-all duration-200">
                      <ModIcon className="w-5 h-5 text-[#34eab8] group-hover:text-[#5aedc4] transition-colors" strokeWidth={1.8} />
                      <span className="text-[10px] tracking-[0.06em] uppercase font-bold text-white/80 group-hover:text-white transition-colors" style={chakra}>
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
                    style={i < modules.length - 1 ? { borderRight: '1px solid rgba(255,255,255,0.06)' } : undefined}
                  >
                    <Link
                      to={mod.href}
                      className="flex items-center justify-center gap-3 py-4.5 hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <ModIcon className="w-6 h-6 text-[#34eab8] group-hover:text-[#5aedc4] transition-colors duration-200" strokeWidth={1.6} />
                      <div className="flex flex-col">
                        <span className="text-[15px] lg:text-[16px] tracking-[0.05em] uppercase font-bold text-white/90 group-hover:text-white leading-tight transition-colors" style={chakra}>
                          {mod.title}
                        </span>
                        <span className="text-[11px] lg:text-[12px] text-white/30 group-hover:text-white/50 leading-tight transition-colors" style={chakra}>
                          {mod.desc}
                        </span>
                      </div>
                    </Link>

                    {/* Create chip on hover */}
                    <Link
                      to={createHref}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center gap-0.5 px-1.5 py-0.5 bg-[#2dd4a8]/10 backdrop-blur-sm text-[#34eab8] hover:text-[#5aedc4] text-[8px] uppercase tracking-[0.12em] font-bold rounded border border-[#2dd4a8]/20"
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

        {/* ─── FEED ─── */}
        <section
          className="relative pt-5 sm:pt-8 md:pt-10 pb-10 sm:pb-20 md:pb-32 overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #1c2530 0%, #18202a 15%, #151c24 40%)' }}
        >
          {/* Car silhouette — positioned below composer area */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none hidden sm:flex justify-center overflow-hidden z-0" style={{ opacity: 0.025, top: '220px' }}>
            <img
              src={carSilhouette}
              alt=""
              className="w-[70%] max-w-[900px] mt-auto"
              style={{ transform: 'scaleX(-1)', filter: 'invert(1) brightness(2)' }}
            />
          </div>

          <div className="relative z-10 max-w-[800px] mx-auto px-3 sm:px-5 md:px-8">

            <div className="flex items-end justify-between mb-4 sm:mb-7">
              <FeedFilterTabs active={feedFilter} onChange={setFeedFilter} />
            </div>

            <div className="mb-5 sm:mb-10">
              <HomeFeedComposer />
            </div>

            {feedLoading && (
              <div className="space-y-6 sm:space-y-12">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="h-[200px] sm:h-[420px] bg-white/[0.04] rounded-lg animate-pulse" />
                    <div className="h-px bg-white/[0.06] mt-6 sm:mt-12" />
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
                      <div className="h-px bg-white/[0.08] my-6 sm:my-12" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {!feedLoading && filteredPosts.length === 0 && (
              <div className="py-10 sm:py-24 text-center">
                <p className="text-[1rem] sm:text-[1.6rem] uppercase text-white/25 font-bold tracking-[0.08em]"
                  style={oswald}>
                  {feedFilter === "alle" ? "Ingen oppdateringer enda" : "Ingen treff i denne kategorien"}
                </p>
                <p className="text-[12px] sm:text-[13px] text-white/20 mt-1.5">
                  {feedFilter === "alle" ? "Bli den første til å dele noe" : "Prøv en annen kategori"}
                </p>
                {!user && feedFilter === "alle" && (
                  <Link to="/login"
                    className="inline-block mt-4 sm:mt-5 text-[11px] sm:text-[12px] uppercase tracking-[0.2em] text-[#2dd4a8] hover:text-[#5aedc4] font-bold transition-colors border-b border-[#2dd4a8]/30 hover:border-[#2dd4a8]/60 pb-0.5"
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
