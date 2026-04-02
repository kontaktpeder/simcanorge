import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Helmet } from "react-helmet-async";
import { Car, ShoppingBag, CalendarDays, Users, Building2, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const modules = [
  {
    href: "/biler",
    icon: Car,
    title: "Biler",
    desc: "Se og del bilhistorier",
    active: true,
  },
  {
    href: "/markedsplass",
    icon: ShoppingBag,
    title: "Markedsplass",
    desc: "Bruktbiler og deler til salgs",
    active: true,
  },
  {
    href: "/arrangement",
    icon: CalendarDays,
    title: "Arrangementer",
    desc: "Treff og biltreff i Norge",
    active: true,
  },
  {
    href: "#",
    icon: Users,
    title: "Klubber",
    desc: "Bli med i en bilklubb",
    active: false,
  },
  {
    href: "#",
    icon: Building2,
    title: "Aktører",
    desc: "Finn verksteder og forhandlere",
    active: false,
  },
];

export default function Index() {
  const { user } = useAuth();

  return (
    <Layout>
      <Helmet>
        <title>Bilgarasje.no — Norges bilsamfunn på nett</title>
        <meta name="description" content="Utforsk norske biler og deres historie. Biler, markedsplass, arrangementer og mer." />
      </Helmet>

      <div className="min-h-[calc(100vh-4rem)]">

        {/* ─── HERO ─── */}
        <section className="bg-[#0a0a0a] pt-12 pb-16 md:pt-16 md:pb-20">
          <div className="max-w-[1100px] mx-auto px-5 md:px-8 text-center">
            <p className="text-[10px] md:text-[11px] tracking-[0.3em] uppercase text-white/25 mb-4 md:mb-6">
              bilgarasje.no
            </p>
            <h1 className="font-display text-[2.8rem] sm:text-[3.8rem] md:text-[5rem] leading-[0.95] uppercase tracking-wide text-white/90">
              Norges<br />bilsamfunn<br />på nett
            </h1>
          </div>
        </section>

        {/* ─── MODULE GRID ─── */}
        <section className="bg-background py-10 md:py-14">
          <div className="max-w-[900px] mx-auto px-5 md:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
              {modules.map((mod) => {
                const Icon = mod.icon;
                const inner = (
                  <div
                    className={`relative flex flex-col items-center text-center p-5 md:p-6 rounded-lg border transition-all duration-300 ${
                      mod.active
                        ? "border-border/60 bg-card hover:border-border hover:shadow-sm cursor-pointer"
                        : "border-border/30 bg-muted/30 opacity-50 cursor-default"
                    }`}
                  >
                    {!mod.active && (
                      <span className="absolute top-2 right-2 text-[8px] tracking-[0.15em] uppercase text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded">
                        Kommer
                      </span>
                    )}
                    <Icon className="w-7 h-7 md:w-8 md:h-8 text-foreground/70 mb-3" strokeWidth={1.5} />
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-0.5">
                        {mod.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-snug">
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                );

                return mod.active ? (
                  <Link key={mod.title} to={mod.href}>
                    {inner}
                  </Link>
                ) : (
                  <div key={mod.title}>{inner}</div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── DIVIDER + FEED HEADING ─── */}
        <section className="bg-background">
          <div className="max-w-[900px] mx-auto px-5 md:px-8">
            <div className="h-px bg-border/50" />
            <div className="flex items-center justify-between py-6 md:py-8">
              <p className="text-[10px] md:text-[11px] tracking-[0.2em] uppercase text-muted-foreground">
                Oppdateringer fra andre bilentusiaster
              </p>
              {!user && (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 hover:text-foreground transition-colors"
                >
                  Logg inn for å delta
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ─── FEED PLACEHOLDER ─── */}
        <section className="bg-background pb-16 md:pb-24">
          <div className="max-w-[900px] mx-auto px-5 md:px-8">
            <div className="flex flex-col items-center justify-center py-16 md:py-20 border border-dashed border-border/40 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Car className="w-5 h-5 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-foreground/70 mb-1">
                Feed kommer snart
              </p>
              <p className="text-xs text-muted-foreground text-center max-w-xs">
                Her vil du se oppdateringer fra bileiere, treff og markedsplass
              </p>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}
