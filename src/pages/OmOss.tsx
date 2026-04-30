import { Layout } from "@/components/layout/Layout";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { Facebook, Heart, Users, Car, Wrench, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { FEATURES } from "@/config/features";

const chakra = { fontFamily: "'Chakra Petch', 'Oswald', sans-serif" } as const;

export default function OmOss() {
  return (
    <Layout contained>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-[#0a0a0a]">
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at 20% 80%, rgba(196,150,44,0.08) 0%, transparent 60%)',
        }} />
        <div className="max-w-[900px] mx-auto px-5 md:px-8 py-16 md:py-28 relative z-10">
          <AnimatedSection triggerOnMount>
            <p
              className="text-[10px] md:text-[11px] tracking-[0.35em] uppercase text-[#c4962c] mb-4 font-bold"
              style={chakra}
            >
              Om oss
            </p>
            <h1
              className="text-[2rem] sm:text-[2.8rem] md:text-[3.6rem] leading-[1.0] uppercase tracking-[0.02em] text-white font-bold italic"
              style={{ ...chakra, textShadow: '0 2px 24px rgba(0,0,0,0.4)' }}
            >
              Fordi disse bilene<br />fortjente bedre
            </h1>
          </AnimatedSection>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/[0.06]" />
      </section>

      {/* ─── INTRO ─── */}
      <section style={{ background: 'linear-gradient(180deg, #f0ebe3 0%, #ebe4da 100%)' }}>
        <div className="max-w-[750px] mx-auto px-5 md:px-8 py-14 md:py-20">
          <AnimatedSection>
            <p className="font-serif text-xl sm:text-2xl md:text-[1.7rem] text-[#3a2e24]/85 leading-[1.7] italic">
              Bilgarasje.no startet med Simca-entusiastene – fordi disse bilene nesten forsvant, og fordi noen mente de fortjente bedre. I dag er plattformen åpen for alle bilentusiaster i Norge.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── SECTIONS ─── */}
      <section style={{ background: '#ebe4da' }}>
        <div className="max-w-[750px] mx-auto px-5 md:px-8 pb-16 md:pb-24 space-y-16 md:space-y-24">

          {/* Fra Facebook til nettsted */}
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <Facebook className="w-5 h-5 text-[#c4962c]" />
              <h2
                className="text-[1.1rem] md:text-[1.3rem] uppercase font-bold tracking-[0.08em] text-[#3a2e24]"
                style={chakra}
              >
                Fra Facebook til nettsted
              </h2>
            </div>
            <div className="space-y-4 text-[15px] sm:text-base text-[#3a2e24]/65 leading-[1.85]">
              <p>
                Ikke før 2007 ble Facebook-gruppen Simca Norge etablert av noen få entusiaster. Gruppen har siden vært levende og aktiv, og har gjennom årene samlet over 1000 medlemmer. Her deles minner, bilder, teknisk kunnskap og entusiasme for et bilmerke som for mange har hatt en helt spesiell plass.
              </p>
              <p>Samtidig har det lenge vært savnet noe mer.</p>
            </div>
          </AnimatedSection>

          {/* Callout */}
          <AnimatedSection>
            <div className="rounded-xl overflow-hidden shadow-lg border border-[#3a2e24]/10">
              <div className="bg-[#3a2e24] p-6 md:p-8">
                <p className="text-[15px] sm:text-base text-white/75 leading-[1.85]">
                  Facebook egner seg godt for dialog, men gir begrensede muligheter for å vise frem bilene slik de fortjener. Bilder forsvinner fort i strømmen, og det har manglet et sted der norske Simca, Talbot og Matra-biler kan presenteres ordentlig, inspirere nye eiere – og vekke interessen hos dem som kanskje bare husker bilene fra barndommen.
                </p>
              </div>
              <div className="bg-[#c4962c] px-6 md:px-8 py-5">
                <p
                  className="text-base md:text-lg text-white font-bold uppercase tracking-[0.04em]"
                  style={chakra}
                >
                  Denne nettsiden er laget for å fylle nettopp det rommet.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* Et levende arkiv */}
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <Car className="w-5 h-5 text-[#c4962c]" />
              <h2
                className="text-[1.1rem] md:text-[1.3rem] uppercase font-bold tracking-[0.08em] text-[#3a2e24]"
                style={chakra}
              >
                Et levende arkiv
              </h2>
            </div>
            <p className="text-[15px] sm:text-base text-[#3a2e24]/65 leading-[1.85]">
              Bilgarasje.no er et visuelt og levende arkiv der bilene får plass, historiene kan bevares, og entusiasmen kan vokse. Her kan både ferdig restaurerte biler og pågående prosjekter vises frem – til inspirasjon for andre.
            </p>
          </AnimatedSection>

          {/* Deler og restaurering */}
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <Wrench className="w-5 h-5 text-[#c4962c]" />
              <h2
                className="text-[1.1rem] md:text-[1.3rem] uppercase font-bold tracking-[0.08em] text-[#3a2e24]"
                style={chakra}
              >
                Deler og restaurering
              </h2>
            </div>
            <p className="text-[15px] sm:text-base text-[#3a2e24]/65 leading-[1.85]">
              I takt med at flere biler nå restaureres, har også behovet for deler økt. Bilgarasje.no formidler et omfattende bildellager med røtter i Simca-miljøet. Målet er å gjøre det enklere for eiere å finne riktige deler, holde bilene på veien – og senke terskelen for å sette i gang med restaurering.
            </p>
          </AnimatedSection>

          {/* Utfyller fellesskapet */}
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <Users className="w-5 h-5 text-[#c4962c]" />
              <h2
                className="text-[1.1rem] md:text-[1.3rem] uppercase font-bold tracking-[0.08em] text-[#3a2e24]"
                style={chakra}
              >
                Utfyller fellesskapet
              </h2>
            </div>
            <div className="border-l-[3px] border-[#c4962c]/40 pl-5 space-y-3">
              <p className="text-[15px] sm:text-base text-[#3a2e24]/65 leading-[1.85]">
                Bilgarasje.no er ikke ment å erstatte fellesskapet på Facebook, men å utfylle det.
              </p>
              <p className="font-serif text-lg md:text-xl text-[#3a2e24]/80 italic leading-relaxed">
                Facebook er møteplassen. Denne siden er utstillingsrommet, verktøykassen og inspirasjonskilden.
              </p>
            </div>
          </AnimatedSection>

          {/* Closing */}
          <AnimatedSection>
            <div className="text-center pt-8 border-t border-[#3a2e24]/10">
              <Heart className="w-8 h-8 text-[#c4962c]/60 mx-auto mb-5" />
              <p className="font-serif text-lg md:text-xl text-[#3a2e24]/70 leading-relaxed max-w-xl mx-auto italic">
                Alt drives av entusiasme, frivillig innsats og kjærlighet til et bilmerke som fortjener å bli sett – og brukt – også i dag.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-[#0a0a0a]">
        <div className="max-w-[750px] mx-auto px-5 md:px-8 py-12 md:py-16">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/biler"
              className="inline-flex items-center gap-2 bg-[#c4962c] hover:bg-[#b3872a] text-white font-bold uppercase tracking-[0.1em] text-sm px-6 py-3 rounded-lg transition-colors"
              style={chakra}
            >
              Se alle biler
              <ArrowRight className="w-4 h-4" />
            </Link>
            {FEATURES.simpleLaunchMode ? (
              <span
                className="inline-flex items-center gap-2 border border-white/10 text-white/40 font-bold uppercase tracking-[0.1em] text-sm px-6 py-3 rounded-lg cursor-not-allowed select-none"
                style={chakra}
                aria-disabled="true"
              >
                Markedsplass kommer snart
              </span>
            ) : (
              <Link
                to="/markedsplass"
                className="inline-flex items-center gap-2 border border-white/15 text-white/70 hover:text-white hover:border-white/30 font-bold uppercase tracking-[0.1em] text-sm px-6 py-3 rounded-lg transition-colors"
                style={chakra}
              >
                Markedsplass
              </Link>
            )}
            <a
              href="https://www.facebook.com/groups/1569119639997670"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-white/40 hover:text-[#c4962c] font-bold uppercase tracking-[0.1em] text-sm transition-colors"
              style={chakra}
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </a>
          </div>
        </div>
      </section>
    </Layout>
  );
}
