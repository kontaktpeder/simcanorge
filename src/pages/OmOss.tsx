import { Layout } from "@/components/layout/Layout";
import { AnimatedSection } from "@/components/layout/AnimatedSection";
import { SeoHead } from "@/components/seo";
import { Facebook, Heart, Users, Car, Wrench, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function OmOss() {
  return (
    <Layout>
      <SeoHead
        title="Om oss | Simca Norge"
        description="Simca Norge er opprettet fordi disse bilene nesten forsvant – og fordi noen mente de fortjente bedre."
        canonicalPath="/om-oss"
      />
      {/* ─── HERO ─── */}
      <div className="-mt-16 pt-16 min-h-full bg-[#f6f3ee] text-[#1c1917]">
      <section className="border-b border-black/10">
        <div className="max-w-[42rem] mx-auto px-5 md:px-8 py-10 md:py-16">
          <AnimatedSection triggerOnMount>
            <p className="font-display text-lg tracking-[0.12em] uppercase text-[#C10D0D]">
              Om oss
            </p>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl uppercase leading-none text-[#071628] mt-1">
              Fordi disse bilene fortjente bedre
            </h1>
          </AnimatedSection>
        </div>
      </section>

      <section>
        <div className="max-w-[42rem] mx-auto px-5 md:px-8 py-10 md:py-14">
          <AnimatedSection>
            <p className="font-sans text-xl md:text-2xl text-[#1c1917] leading-relaxed">
              Simca Norge er opprettet fordi disse bilene nesten forsvant – og fordi noen mente de fortjente bedre.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── SECTIONS ─── */}
      <section>
        <div className="max-w-[42rem] mx-auto px-5 md:px-8 pb-16 md:pb-24 space-y-14 md:space-y-20">

          {/* Fra Facebook til nettsted */}
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <Facebook className="w-5 h-5 text-[#C10D0D]" />
              <h2 className="font-display text-3xl uppercase text-[#071628]">
                Fra Facebook til nettsted
              </h2>
            </div>
            <div className="space-y-4 font-sans text-base leading-relaxed text-[#1c1917]">
              <p>
                Ikke før 2007 ble Facebook-gruppen Simca Norge etablert av noen få entusiaster. Gruppen har siden vært levende og aktiv, og har gjennom årene samlet over 1000 medlemmer. Her deles minner, bilder, teknisk kunnskap og entusiasme for et bilmerke som for mange har hatt en helt spesiell plass.
              </p>
              <p>Samtidig har det lenge vært savnet noe mer.</p>
            </div>
          </AnimatedSection>

          {/* Callout */}
          <AnimatedSection>
            <div className="rounded-xl overflow-hidden border border-black/10">
              <div className="bg-[#071628] p-6 md:p-8">
                <p className="font-sans text-base text-white/90 leading-relaxed">
                  Facebook egner seg godt for dialog, men gir begrensede muligheter for å vise frem bilene slik de fortjener. Bilder forsvinner fort i strømmen, og det har manglet et sted der norske Simca, Talbot og Matra-biler kan presenteres ordentlig, inspirere nye eiere – og vekke interessen hos dem som kanskje bare husker bilene fra barndommen.
                </p>
              </div>
              <div className="bg-white px-6 md:px-8 py-5 border-t border-black/10">
                <p className="font-sans text-base md:text-lg text-[#071628] leading-relaxed">
                  Denne nettsiden er laget for å fylle nettopp det rommet.
                </p>
              </div>
            </div>
          </AnimatedSection>

          {/* Et levende arkiv */}
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <Car className="w-5 h-5 text-[#C10D0D]" />
              <h2 className="font-display text-3xl uppercase text-[#071628]">
                Et levende arkiv
              </h2>
            </div>
            <p className="font-sans text-base leading-relaxed text-[#1c1917]">
              Simca Norge skal være et visuelt og levende arkiv der bilene får plass, historiene kan bevares, og entusiasmen kan vokse. Her kan både ferdig restaurerte biler og pågående prosjekter vises frem – til inspirasjon for andre.
            </p>
          </AnimatedSection>

          {/* Deler og restaurering */}
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <Wrench className="w-5 h-5 text-[#C10D0D]" />
              <h2 className="font-display text-3xl uppercase text-[#071628]">
                Deler og restaurering
              </h2>
            </div>
            <p className="font-sans text-base leading-relaxed text-[#1c1917]">
              I takt med at flere biler nå restaureres, har også behovet for deler økt. Simca Norge har fått tilgang til et omfattende bildellager, som formidles gjennom denne siden. Målet er å gjøre det enklere for eiere å finne riktige deler, holde bilene på veien – og senke terskelen for å sette i gang med restaurering.
            </p>
          </AnimatedSection>

          {/* Utfyller fellesskapet */}
          <AnimatedSection>
            <div className="flex items-center gap-3 mb-5">
              <Users className="w-5 h-5 text-[#C10D0D]" />
              <h2 className="font-display text-3xl uppercase text-[#071628]">
                Utfyller fellesskapet
              </h2>
            </div>
            <div className="border-l-[3px] border-[#C10D0D] pl-5 space-y-3">
              <p className="font-sans text-base leading-relaxed text-[#1c1917]">
                Simca Norge er ikke ment å erstatte fellesskapet på Facebook, men å utfylle det.
              </p>
              <p className="font-sans text-lg md:text-xl text-[#071628] leading-relaxed">
                Facebook er møteplassen. Denne siden er utstillingsrommet, verktøykassen og inspirasjonskilden.
              </p>
            </div>
          </AnimatedSection>

          {/* Closing */}
          <AnimatedSection>
            <div className="text-center pt-8 border-t border-black/10">
              <Heart className="w-7 h-7 text-[#C10D0D] mx-auto mb-5" />
              <p className="font-sans text-lg text-[#1c1917] leading-relaxed max-w-xl mx-auto">
                Alt drives av entusiasme, frivillig innsats og kjærlighet til et bilmerke som fortjener å bli sett – og brukt – også i dag.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-black/10 bg-white">
        <div className="max-w-[42rem] mx-auto px-5 md:px-8 py-12 md:py-16">
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link to="/biler" className="btn-enamel-red">
              Se alle biler
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/markedsplass" className="btn-secondary">
              Markedsplass
            </Link>
            <a
              href="https://www.facebook.com/groups/1569119639997670"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-sans text-base text-[#071628] hover:text-[#C10D0D]"
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </a>
          </div>
        </div>
      </section>
      </div>
    </Layout>
  );
}
