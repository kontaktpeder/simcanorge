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
          {/* Dramatic teal ambient glow */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 900px 500px at 10% 65%, rgba(45,212,168,0.09) 0%, transparent 65%)' }} />
          {/* Secondary warm glow for depth */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 600px 350px at 80% 20%, rgba(52,234,184,0.04) 0%, transparent 70%)' }} />
          {/* Bottom fade into nav */}
          <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(to bottom, transparent, #181f28)' }} />

          {/* Animated accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none overflow-hidden">
            <div className="h-full w-full" style={{
              background: 'linear-gradient(90deg, transparent 0%, #2dd4a8 20%, #00ffc8 50%, #2dd4a8 80%, transparent 100%)',
              animation: 'shimmer 4s ease-in-out infinite',
            }} />
          </div>

          {/* Car image — brighter, more dramatic */}
          <div className="absolute inset-0 pointer-events-none">
            <img
              src={heroCar}
              alt=""
              className="absolute right-0 top-0 h-full w-full md:w-[65%] object-cover object-[60%_30%]"
              style={{
                WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent 92%)',
                maskImage: 'linear-gradient(to left, black 40%, transparent 92%)',
                opacity: 0.7,
                filter: 'contrast(1.15) saturate(1.2) brightness(1.05)',
              }}
            />
            {/* Teal light leak on car */}
            <div className="absolute inset-0 pointer-events-none hidden md:block" style={{ background: 'radial-gradient(ellipse 400px 600px at 75% 80%, rgba(45,212,168,0.06) 0%, transparent 70%)' }} />
            <div className="absolute inset-0 md:hidden" style={{ background: 'linear-gradient(to right, rgba(7,11,16,0.95) 25%, rgba(7,11,16,0.35) 100%)' }} />
          </div>

          <div className="relative z-10 max-w-[1200px] mx-auto px-4 sm:px-5 md:px-8">
            <div className="flex flex-col justify-center min-h-[200px] sm:min-h-[240px] md:min-h-[280px] py-8 sm:py-10 md:py-10 md:max-w-[50%]">
              <p className="text-[9px] sm:text-[11px] tracking-[0.35em] uppercase mb-2 sm:mb-3"
                style={{ ...oswald, fontWeight: 600, background: 'linear-gradient(135deg, #2dd4a8, #00ffc8, #34eab8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', filter: 'drop-shadow(0 0 12px rgba(45,212,168,0.5))' }}>
                bilgarasje.no
              </p>
              <h1
                className="text-[1.5rem] sm:text-[2.3rem] md:text-[3rem] lg:text-[3.6rem] leading-[0.89] uppercase tracking-[0.01em] text-white font-bold italic"
                style={{ ...chakra, textShadow: '0 2px 40px rgba(0,0,0,0.7), 0 0 80px rgba(45,212,168,0.1), 0 0 120px rgba(45,212,168,0.05)' }}
              >
                Hele Norges<br />bilsamfunn
              </h1>
              <p
                className="text-[0.7rem] sm:text-[0.9rem] md:text-[1.05rem] uppercase tracking-[0.22em] text-white/45 font-bold italic mt-1.5"
                style={{ ...chakra, textShadow: '0 0 24px rgba(45,212,168,0.18)' }}
              >
                — på nett
              </p>

              <div className="mt-6 sm:mt-8 w-full max-w-[480px]">
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
          {/* Top accent line — animated glow */}
          <div className="absolute top-0 left-0 right-0 h-px overflow-hidden">
            <div className="h-full w-full" style={{ background: 'linear-gradient(90deg, transparent 5%, rgba(45,212,168,0.5) 30%, rgba(0,255,200,0.6) 50%, rgba(45,212,168,0.5) 70%, transparent 95%)' }} />
          </div>

          <div className="max-w-[1200px] mx-auto px-3 sm:px-5 md:px-8">
            {/* Mobile: wrapped grid */}
            <div className="grid grid-cols-3 gap-2 md:hidden py-3">
              {modules.slice(0, 3).map((mod) => {
                const ModIcon = mod.icon;
                return (
                  <Link key={mod.title} to={mod.href} className="group">
                    <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-[#2dd4a8]/50 hover:bg-[#2dd4a8]/[0.08] active:scale-[0.97] transition-all duration-200 hover:shadow-[0_0_20px_rgba(45,212,168,0.12)]">
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
                    <div className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl bg-white/[0.05] border border-white/[0.08] hover:border-[#2dd4a8]/50 hover:bg-[#2dd4a8]/[0.08] active:scale-[0.97] transition-all duration-200 hover:shadow-[0_0_20px_rgba(45,212,168,0.12)]">
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
                      className="flex items-center justify-center gap-3 py-5 hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <div className="relative">
                        <ModIcon className="w-6 h-6 text-[#34eab8] group-hover:text-[#5aedc4] transition-colors duration-200 relative z-10" strokeWidth={1.6} />
                        {/* Icon glow on hover */}
                        <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: 'radial-gradient(circle, rgba(45,212,168,0.25) 0%, transparent 70%)', transform: 'scale(2.5)' }} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] lg:text-[16px] tracking-[0.05em] uppercase font-bold text-white/90 group-hover:text-white leading-tight transition-colors" style={chakra}>
                          {mod.title}
                        </span>
                        <span className="text-[11px] lg:text-[12px] text-white/30 group-hover:text-[#2dd4a8]/60 leading-tight transition-colors" style={chakra}>
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

          {/* Bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 15%, rgba(45,212,168,0.2) 50%, transparent 85%)' }} />
        </nav>

        {/* ─── FEED ─── */}
        <section
          className="relative pt-8 sm:pt-10 md:pt-12 pb-10 sm:pb-20 md:pb-32 overflow-hidden"
          style={{ background: 'linear-gradient(180deg, #1e2733 0%, #1a2230 8%, #171e28 25%, #151c24 50%, #10161e 100%)' }}
        >
          {/* Ambient glow behind feed */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none" style={{ background: 'radial-gradient(ellipse, rgba(45,212,168,0.03) 0%, transparent 70%)' }} />

          {/* Car silhouette — positioned below composer area */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none hidden sm:flex justify-center overflow-hidden z-0" style={{ opacity: 0.03, top: '220px' }}>
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

            {/* Subtle glow behind composer */}
            <div className="relative mb-5 sm:mb-10">
              <div className="absolute -inset-6 sm:-inset-10 rounded-3xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(45,212,168,0.04) 0%, transparent 70%)' }} />
              <div className="relative">
                <HomeFeedComposer />
              </div>
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
